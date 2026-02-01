# Auth0 App Stack: Dashboard

Manages Auth0 resources for the Dashboard application.

## Resources

- **Client**: `spa::dashboard` (SPA application - legacy name)
- **API**: `api://dashboard` (Resource Server - legacy identifier)
- **Roles**: `dashboard_user`, `dashboard_admin`
- **Scopes**: Fine-grained permissions for docs, links, categories, attachments, preferences, calendar

## Usage

```bash
cd infra/terraform/auth0
doppler run -- terraform init
doppler run -- terraform plan
doppler run -- terraform apply
```

## Import Commands

Before first apply in a new state, import existing resources:

```bash
# Import the SPA client
terraform import auth0_client.dashboard b88w8TPaj33tIEyeUBgK8y2PiVpJ9ozA

# Import the API resource server (get ID from Management API first)
# GET /api/v2/resource-servers?identifier=api://dashboard
terraform import auth0_resource_server.dashboard <resource_server_id>

# Import roles
terraform import auth0_role.dashboard_user rol_5QDfnbL7Ft29wfE4
terraform import auth0_role.dashboard_admin rol_azDctu5fZfzX1A4L
```

## Outputs

- `client_id`: For use in frontend configuration
- `api_audience`: For use in API token requests
- `api_id`: Auth0 Resource Server ID
