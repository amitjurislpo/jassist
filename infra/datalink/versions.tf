terraform {
  required_version = ">= 1.10" # use_lockfile in the backend

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # 6, not the group's 5: since 2025 a public function URL also needs lambda:InvokeFunction
      # limited to calls made through the URL (invoked_via_function_url), which only 6 can set.
      # This module has its own state, so the group's modules are not affected.
      version = "~> 6.0"
    }
  }

  # The group's state bucket (versioned, encrypted, public access blocked), under its own key.
  backend "s3" {
    bucket       = "iamjcg-tfstate-594566440066"
    key          = "jassist-datalink/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}
