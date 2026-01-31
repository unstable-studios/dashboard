# Auth0 App Stack: Dashboard

Manages Auth0 resources for the Dashboard application.

## Resources

- **Client**: `spa::echo-hub` (SPA application - legacy name)
- **API**: `api://echo-hub` (Resource Server - legacy identifier)
- **Roles**: `echo_user`, `echo_admin`
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
terraform import auth0_client.echo_hub b88w8TPaj33tIEyeUBgK8y2PiVpJ9ozA

# Import the API resource server (get ID from Management API first)
# GET /api/v2/resource-servers?identifier=api://echo-hub
terraform import auth0_resource_server.echo_hub <resource_server_id>

# Import roles
terraform import auth0_role.echo_user rol_5QDfnbL7Ft29wfE4
terraform import auth0_role.echo_admin rol_azDctu5fZfzX1A4L
```

## Outputs

- `client_id`: For use in frontend configuration
- `api_audience`: For use in API token requests
- `api_id`: Auth0 Resource Server ID
