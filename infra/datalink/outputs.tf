output "security_group_id" {
  description = "Give this to IamJCG infra/rds: the database admits this security group on 5432."
  value       = aws_security_group.link.id
}

output "function_names" {
  value = { for k, f in aws_lambda_function.link : k => f.function_name }
}

output "alias_urls" {
  description = "DATA_LINK_URL per environment (on the live alias; not secret: requests without the signature are refused)."
  value       = { for k, u in aws_lambda_function_url.live : k => u.function_url }
}
