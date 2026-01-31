output "client_id" {
  description = "Auth0 Client ID for Echo Hub SPA"
  value       = auth0_client.echo_hub.id
}

output "api_audience" {
  description = "Auth0 API audience/identifier for Echo Hub"
  value       = auth0_resource_server.echo_hub.identifier
}

output "api_id" {
  description = "Auth0 Resource Server ID for Echo Hub API"
  value       = auth0_resource_server.echo_hub.id
}
