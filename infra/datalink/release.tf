# ============================================================================
# jassist-release-deployer — how JurisAssist is built, deployed and synced.
#
# The Founding CTO's order of 11 Nov 2026: "Juris Academy is built, deployed and
# synced only through the release worker's limited role, never the Admin user."
#
# The release worker (jcg-release-worker, the Group's one release machine) takes
# this role on for Juris Academy's release, exactly as it takes on
# pcd-release-deployer for ParaCounsel: the trust names the worker's role, so the
# worker's own policy is not widened, and no person or user can take it on.
#
# WHAT IT MAY DO, AND NOTHING MORE:
#   - deploy code to, and set the secrets of, the two data link functions;
#   - make, ask and delete one temporary trial function named jassist-datalink-trial-*
#     (release safety, 17 Nov 2026), and ask the live functions if they are ready.
# The settings it carries come from Doppler juris_assist (prd, stg) through the
# release worker's own Doppler access; the site's Vercel token is one of them.
# It cannot write IAM, create any function other than jassist-datalink-trial-*, read any other
# function, or touch any other application.
# ============================================================================
data "aws_caller_identity" "me" {}

locals {
  worker_role = "jcg-release-worker"
  worker_id   = "i-038a0064240b5ae59"
  account     = data.aws_caller_identity.me.account_id
}

resource "aws_iam_role" "deployer" {
  name                 = "jassist-release-deployer"
  description          = "Taken by the Group release worker to release JurisAssist: its data link code and secrets, and its site settings. Never a person."
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { AWS = [
        "arn:aws:iam::${local.account}:role/${local.worker_role}",
        "arn:aws:sts::${local.account}:assumed-role/${local.worker_role}/${local.worker_id}",
      ] }
      Action = "sts:AssumeRole"
    }]
  })
  tags = { Application = "juris_assist" }
}

resource "aws_iam_role_policy" "deployer" {
  name = "release-jassist-only"
  role = aws_iam_role.deployer.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DeployTheDataLink"
        Effect   = "Allow"
        Action   = ["lambda:UpdateFunctionCode", "lambda:UpdateFunctionConfiguration", "lambda:GetFunction", "lambda:GetFunctionConfiguration"]
        Resource = [for f in aws_lambda_function.link : f.arn]
      },
      # Zero-gap release (main.tf, alias "live"): publish a version, prove it by a direct invoke, then move the alias.
      {
        Sid      = "MoveTheLiveAliasAfterProof"
        Effect   = "Allow"
        Action   = ["lambda:PublishVersion", "lambda:GetAlias", "lambda:UpdateAlias", "lambda:InvokeFunction", "lambda:GetFunctionConfiguration"]
        Resource = concat([for f in aws_lambda_function.link : f.arn], [for f in aws_lambda_function.link : "${f.arn}:*"])
      },
      # Release safety (the CTO's words of 17 Nov 2026, 1:35 pm: "the new version starts beside the old one, is proven
      # ready, then swapped"). A temporary trial function, named jassist-datalink-trial-*, is made, asked if it is
      # ready, and deleted, in every release. It takes the data link's own role and network, has no URL and no alias.
      # It may not touch the live functions through this statement. Costs nothing: it lives seconds, inside the free tier.
      {
        Sid      = "TrialCopyBesideTheLiveLink"
        Effect   = "Allow"
        Action   = ["lambda:CreateFunction", "lambda:DeleteFunction", "lambda:InvokeFunction", "lambda:GetFunction"]
        Resource = "arn:aws:lambda:${var.aws_region}:${local.account}:function:jassist-datalink-trial-*"
      },
      {
        Sid      = "TrialCopyLogsRemoved"
        Effect   = "Allow"
        Action   = ["logs:DeleteLogGroup"]
        Resource = "arn:aws:logs:${var.aws_region}:${local.account}:log-group:/aws/lambda/jassist-datalink-trial-*"
      },
      {
        Sid      = "AskTheLiveLinkIfReady"
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = [for f in aws_lambda_function.link : f.arn]
      },
      {
        Sid       = "TrialCopyTakesTheLinkRoleOnly"
        Effect    = "Allow"
        Action    = "iam:PassRole"
        Resource  = aws_iam_role.link.arn
        Condition = { StringEquals = { "iam:PassedToService" = "lambda.amazonaws.com" } }
      },
      {
        Sid      = "TrialCopyNeedsTheNetworkNamed"
        Effect   = "Allow"
        Action   = ["ec2:DescribeSecurityGroups", "ec2:DescribeSubnets", "ec2:DescribeVpcs"]
        Resource = "*"
      },
    ]
  })
}

output "deployer_role_arn" {
  description = "The role the release worker takes on to release JurisAssist."
  value       = aws_iam_role.deployer.arn
}
