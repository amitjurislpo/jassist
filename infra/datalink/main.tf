# The JurisAssist data link (copied from Juris Academy's): the secured HTTPS link from the site (on Vercel) to its data on the
# group database. The Founding CTO's decision of 10 Nov 2026 (IamJCG D-94): "the Academy site
# reaches its data on the group database only over a secured HTTPS link from a component inside
# our AWS network, with no new monthly cost and the database port closed to the internet."
#
# WHAT IS MADE: per environment, one Lambda inside the group VPC with an HTTPS function URL; one
# security group for both (egress to the database on 5432 only, no ingress at all); one role.
# The database's own security group admits this group by name (IamJCG infra/rds, a rule that
# names a security group, no address range). The database keeps no public address.
#
# NO MONTHLY COST: a Lambda is billed per request and per second used; this traffic is far
# inside the always-free allowance (1M requests and 400,000 GB-seconds a month). A function URL,
# a security group, an IAM role and Lambda's network interfaces cost nothing. No NAT gateway, no
# VPC endpoint, no load balancer, no Secrets Manager secret. Logs are kept 14 days.
#
# SECRETS ARE NOT HERE. Each Lambda's DATABASE_URL and DATA_LINK_SECRET are set by the release
# worker straight from Doppler (scripts/release/jassist_release.py), never printed; Terraform ignores
# them, so they never enter Terraform's state. The same release deploys the code (release.tf).

data "aws_db_instance" "group" {
  db_instance_identifier = var.db_identifier
}

data "aws_db_subnet_group" "group" {
  name = data.aws_db_instance.group.db_subnet_group
}

locals {
  name     = "jassist-datalink"
  db_sg_id = one(data.aws_db_instance.group.vpc_security_groups)
  short    = { production = "prod", preview = "preview" }
}

resource "aws_security_group" "link" {
  name        = "${local.name}-sg"
  description = "JurisAssist data link Lambdas - no ingress - egress to the group database only"
  vpc_id      = var.vpc_id

  egress {
    description     = "PostgreSQL to the group database only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [local.db_sg_id]
  }

  tags = { Name = "${local.name}-sg", Application = "juris_assist" }
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "link" {
  name               = "${local.name}-role"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = { Application = "juris_assist" }
}

# Network interfaces in the VPC and its own logs: nothing else. It has no AWS data access at all.
resource "aws_iam_role_policy_attachment" "vpc" {
  role       = aws_iam_role.link.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_cloudwatch_log_group" "link" {
  for_each          = var.environments
  name              = "/aws/lambda/${local.name}-${local.short[each.key]}"
  retention_in_days = var.log_retention_days
  tags              = { Application = "juris_assist" }
}

resource "aws_lambda_function" "link" {
  for_each         = var.environments
  function_name    = "${local.name}-${local.short[each.key]}"
  description      = "JurisAssist data link (${each.key}): named operations on its own database, signed requests only"
  role             = aws_iam_role.link.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = var.zip_path
  source_code_hash = filebase64sha256(var.zip_path)
  memory_size      = 256
  publish          = true # version 1, for the alias to start on
  timeout          = 120  # migrations; ordinary operations take well under a second

  vpc_config {
    subnet_ids         = data.aws_db_subnet_group.group.subnet_ids
    security_group_ids = [aws_security_group.link.id]
  }

  environment {
    variables = { JASSIST_ENVIRONMENT = each.key }
  }

  lifecycle {
    # DATABASE_URL and DATA_LINK_SECRET, and the code itself, are the release worker's
    # (scripts/release/jassist_release.py, through jassist-release-deployer; the Founding CTO's order
    # of 11 Nov 2026), never Terraform's. Terraform makes the function; it never deploys code to it.
    ignore_changes = [environment, filename, source_code_hash, publish]
  }

  depends_on = [aws_iam_role_policy_attachment.vpc, aws_cloudwatch_log_group.link]
  tags       = { Application = "juris_assist", Environment = each.key }
}

# ============================================================================
# ZERO-GAP RELEASES: an alias the release moves only after the new version is proven.
# The CTO's words of 17 Nov 2026 (1:05 pm): "A failed release must never take a live service offline. If the new
# version can't start, the old one keeps serving without a break."
#
# The release (scripts/release/jassist_release.py) updates $LATEST (which nothing routes to once the site uses the
# alias URL below), publishes a version, proves that version ready by a direct invoke, and only then moves the alias
# "live" to it. A failed live check moves the alias straight back. The alias is the release's to move, never
# Terraform's (ignore_changes on function_version).
#
# THE URL (HTTPS only): one function URL per environment, on the alias. Open at the network level because Vercel has
# no fixed address; every request must carry a valid HMAC signature for this environment (scripts/data-link.mjs),
# checked before the database is touched. Version 1 is published when the function is made (publish = true), so the
# alias has a version to start on in the same apply. $0 a month: aliases, versions, function URLs and permissions are
# not billed. The site's DATA_LINK_URL (Doppler juris_assist prd and stg) is the alias URL (output alias_urls).
# ============================================================================
variable "alias_start_versions" {
  description = "The published version each alias starts on (the release moves it from then on)."
  type        = map(string)
  default     = { production = "1", preview = "1" }
}

resource "aws_lambda_alias" "live" {
  for_each         = var.environments
  name             = "live"
  description      = "The version that serves; moved by the release worker only after the new version is proven ready"
  function_name    = aws_lambda_function.link[each.key].function_name
  function_version = var.alias_start_versions[each.key]

  lifecycle {
    ignore_changes = [function_version]
  }
}

resource "aws_lambda_function_url" "live" {
  for_each           = var.environments
  function_name      = aws_lambda_function.link[each.key].function_name
  qualifier          = aws_lambda_alias.live[each.key].name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "live_url" {
  for_each               = var.environments
  statement_id           = "FunctionURLAllowPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.link[each.key].function_name
  qualifier              = aws_lambda_alias.live[each.key].name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "live_invoke" {
  for_each                 = var.environments
  statement_id             = "FunctionURLInvoke"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.link[each.key].function_name
  qualifier                = aws_lambda_alias.live[each.key].name
  principal                = "*"
  invoked_via_function_url = true
}
