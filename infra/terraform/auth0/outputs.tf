output "client_id" {
  description = "Auth0 Client ID for Dashboard SPA"
  value       = auth0_client.dashboard.id
}

output "api_audience" {
  description = "Auth0 API audience/identifier for Dashboard"
  value       = auth0_resource_server.dashboard.identifier
}

output "api_id" {
  description = "Auth0 Resource Server ID for Dashboard API"
  value       = auth0_resource_server.dashboard.id
}
