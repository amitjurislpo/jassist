variable "aws_region" {
  description = "Where the group database is, and so where the data link runs."
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "The group VPC (the one the group database is in)."
  type        = string
  default     = "vpc-0a6e564ae5a3286f0"
}

variable "db_identifier" {
  description = "The group database instance (IamJCG infra/rds, local.name)."
  type        = string
  default     = "jcg-group-postgres"
}

variable "environments" {
  description = "One Lambda per environment, each holding only its own database's login."
  type        = set(string)
  default     = ["production", "preview"]
}

variable "zip_path" {
  description = "The built Lambda (npm run datalink:build)."
  type        = string
  default     = "../../dist/datalink/datalink.zip"
}

variable "log_retention_days" {
  description = "How long the Lambdas' logs are kept. Short, so log storage stays inside the free allowance."
  type        = number
  default     = 14
}
