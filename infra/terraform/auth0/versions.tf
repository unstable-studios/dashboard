terraform {
  required_version = ">= 1.9"

  backend "s3" {
    bucket = "echo-core-terraform-state"
    key    = "stacks/auth0-app-dashboard/terraform.tfstate"
    region = "auto"

    endpoints = {
      s3 = "https://52dbc49383cdc147b51c1ff036ac13ac.r2.cloudflarestorage.com"
    }

    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_s3_checksum            = true
  }

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.0"
    }
    doppler = {
      source  = "DopplerHQ/doppler"
      version = "~> 1.0"
    }
  }
}

provider "doppler" {}
data "doppler_secrets" "this" {}

# Auth0 provider - credentials from Doppler
provider "auth0" {
  domain        = data.doppler_secrets.this.map.AUTH0_DOMAIN
  client_id     = data.doppler_secrets.this.map.AUTH0_TF_CLIENT_ID
  client_secret = data.doppler_secrets.this.map.AUTH0_TF_CLIENT_SECRET
  audience      = data.doppler_secrets.this.map.AUTH0_TF_AUDIENCE
}
