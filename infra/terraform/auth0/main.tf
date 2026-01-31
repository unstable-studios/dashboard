/**
 * Auth0 App Stack: Echo Hub
 *
 * Manages Auth0 resources for the Echo Hub application:
 * - SPA client (spa::echo-hub)
 * - API resource server (api::echo-hub)
 * - Permissions/scopes for RBAC
 */

locals {
  # Existing client ID - IMPORT, do not recreate
  client_id = "b88w8TPaj33tIEyeUBgK8y2PiVpJ9ozA"

  # API audience
  api_audience = "api://echo-hub"

  # Callback URLs for the Hub
  callbacks = [
    "https://hub.unstablestudios.com/callback",
    "http://localhost:5173/callback",
  ]

  logout_urls = [
    "https://hub.unstablestudios.com",
    "http://localhost:5173",
  ]

  web_origins = [
    "https://hub.unstablestudios.com",
    "http://localhost:5173",
  ]
}

# =============================================================================
# SPA Client
# =============================================================================

# Import with: terraform import auth0_client.echo_hub b88w8TPaj33tIEyeUBgK8y2PiVpJ9ozA
resource "auth0_client" "echo_hub" {
  name        = "The Hub"
  description = "Internal dashboard for Unstable Studios"
  app_type    = "spa"

  client_metadata = {
    internal_id = "spa::echo-hub"
    is_internal = "true"
  }

  callbacks           = local.callbacks
  allowed_logout_urls = local.logout_urls
  web_origins         = local.web_origins

  # Where to send users who navigate directly to Auth0 login
  initiate_login_uri = "https://hub.unstablestudios.com"

  oidc_conformant = true
  grant_types     = ["authorization_code", "refresh_token"]

  # Organization login - require users to log in through unstable-studios org
  organization_usage            = "require"
  organization_require_behavior = "no_prompt"

  jwt_configuration {
    alg                 = "RS256"
    lifetime_in_seconds = 36000
  }

  refresh_token {
    rotation_type                = "rotating"
    expiration_type              = "expiring"
    idle_token_lifetime          = 1296000 # 15 days
    token_lifetime               = 2592000 # 30 days
    leeway                       = 0
    infinite_idle_token_lifetime = false
    infinite_token_lifetime      = false
  }

  # Lifecycle: preserve client_id
  lifecycle {
    prevent_destroy = true
  }
}

# Note: Primary database connection is already enabled for this client.
# Connection-client bindings are managed at the connection level, not per-app.

# =============================================================================
# API Resource Server
# =============================================================================

# Import with: terraform import auth0_resource_server.echo_hub <resource_server_id>
# (Get ID via Management API: GET /api/v2/resource-servers?identifier=api://echo-hub)
resource "auth0_resource_server" "echo_hub" {
  identifier = local.api_audience
  name       = "Echo Hub API"

  signing_alg                                     = "RS256"
  allow_offline_access                            = true
  token_lifetime                                  = 86400
  token_lifetime_for_web                          = 7200
  skip_consent_for_verifiable_first_party_clients = true

  # RBAC settings - required for permissions in access token
  enforce_policies = true
  token_dialect    = "access_token_authz"
}

# =============================================================================
# API Permissions/Scopes
# =============================================================================

resource "auth0_resource_server_scopes" "echo_hub" {
  resource_server_identifier = auth0_resource_server.echo_hub.identifier

  # Legacy scopes (kept for backward compatibility)
  scopes {
    name        = "hub:read"
    description = "Read access to Hub resources (docs, links) - LEGACY"
  }

  scopes {
    name        = "hub:edit"
    description = "Edit access to Hub resources (create, update, delete) - LEGACY"
  }

  # Document scopes
  scopes {
    name        = "docs:read"
    description = "View published documents"
  }

  scopes {
    name        = "docs:read:unpublished"
    description = "View unpublished/draft documents (admin)"
  }

  scopes {
    name        = "docs:edit"
    description = "Create and update documents (admin)"
  }

  scopes {
    name        = "docs:delete"
    description = "Delete documents (admin)"
  }

  # Link scopes
  scopes {
    name        = "links:read"
    description = "View service links"
  }

  scopes {
    name        = "links:edit"
    description = "Create and update links (admin)"
  }

  scopes {
    name        = "links:delete"
    description = "Delete links (admin)"
  }

  # Category scopes
  scopes {
    name        = "categories:read"
    description = "View categories"
  }

  scopes {
    name        = "categories:edit"
    description = "Create and update categories (admin)"
  }

  scopes {
    name        = "categories:delete"
    description = "Delete categories (admin)"
  }

  # Attachment scopes
  scopes {
    name        = "attachments:read"
    description = "Download and list attachments"
  }

  scopes {
    name        = "attachments:upload"
    description = "Upload attachments (admin)"
  }

  scopes {
    name        = "attachments:delete"
    description = "Delete attachments (admin)"
  }

  # Preferences scopes
  scopes {
    name        = "prefs:read"
    description = "Read own preferences"
  }

  scopes {
    name        = "prefs:edit"
    description = "Update own preferences and favorites"
  }

  # Calendar/Reminders scopes
  scopes {
    name        = "cal:read"
    description = "View reminders"
  }

  scopes {
    name        = "cal:add:user"
    description = "Create personal reminders"
  }

  scopes {
    name        = "cal:add:global"
    description = "Create org-wide reminders (admin)"
  }

  scopes {
    name        = "cal:edit:user"
    description = "Edit own reminders"
  }

  scopes {
    name        = "cal:edit:global"
    description = "Edit any reminder (admin)"
  }

  scopes {
    name        = "cal:delete:user"
    description = "Delete own reminders"
  }

  scopes {
    name        = "cal:delete:global"
    description = "Delete any reminder (admin)"
  }
}

# =============================================================================
# Client Grant - Authorize SPA to request tokens for the API
# =============================================================================

# All scopes the SPA can request
locals {
  all_scopes = [
    # Legacy scopes (backward compatibility)
    "hub:read", "hub:edit",
    # Document scopes
    "docs:read", "docs:read:unpublished", "docs:edit", "docs:delete",
    # Link scopes
    "links:read", "links:edit", "links:delete",
    # Category scopes
    "categories:read", "categories:edit", "categories:delete",
    # Attachment scopes
    "attachments:read", "attachments:upload", "attachments:delete",
    # Preferences scopes
    "prefs:read", "prefs:edit",
    # Calendar scopes
    "cal:read", "cal:add:user", "cal:add:global", "cal:edit:user", "cal:edit:global", "cal:delete:user", "cal:delete:global",
  ]
}

resource "auth0_client_grant" "echo_hub_spa" {
  client_id = auth0_client.echo_hub.id
  audience  = auth0_resource_server.echo_hub.identifier
  scopes    = local.all_scopes
}

# User flow grant - allows SPA to request tokens on behalf of users
# Import with: terraform import auth0_client_grant.echo_hub_spa_user cgr_k6Z5cMqOda5EbRDA
resource "auth0_client_grant" "echo_hub_spa_user" {
  client_id    = auth0_client.echo_hub.id
  audience     = auth0_resource_server.echo_hub.identifier
  scopes       = local.all_scopes
  subject_type = "user"
}

# =============================================================================
# Roles
# =============================================================================

# Import with: terraform import auth0_role.echo_user rol_5QDfnbL7Ft29wfE4
resource "auth0_role" "echo_user" {
  name        = "echo_user"
  description = "Read-only access to The Hub"
}

# Import with: terraform import auth0_role.echo_admin rol_azDctu5fZfzX1A4L
resource "auth0_role" "echo_admin" {
  name        = "echo_admin"
  description = "Full access to The Hub (read + edit)"
}

# =============================================================================
# Role Permissions
# =============================================================================

resource "auth0_role_permissions" "echo_user" {
  role_id = auth0_role.echo_user.id

  # Legacy scope (backward compatibility)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "hub:read"
  }

  # Document read access
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "docs:read"
  }

  # Link read access
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "links:read"
  }

  # Category read access
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "categories:read"
  }

  # Attachment read access
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "attachments:read"
  }

  # Preferences read/write (users can manage their own preferences)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "prefs:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "prefs:edit"
  }

  # Calendar permissions for regular users
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:add:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:edit:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:delete:user"
  }
}

resource "auth0_role_permissions" "echo_admin" {
  role_id = auth0_role.echo_admin.id

  # Legacy scopes (backward compatibility)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "hub:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "hub:edit"
  }

  # Document permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "docs:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "docs:read:unpublished"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "docs:edit"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "docs:delete"
  }

  # Link permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "links:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "links:edit"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "links:delete"
  }

  # Category permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "categories:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "categories:edit"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "categories:delete"
  }

  # Attachment permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "attachments:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "attachments:upload"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "attachments:delete"
  }

  # Preferences permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "prefs:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "prefs:edit"
  }

  # Calendar permissions for admins (all scopes)
  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:add:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:add:global"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:edit:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:edit:global"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:delete:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.echo_hub.identifier
    name                       = "cal:delete:global"
  }
}
