/**
 * Auth0 App Stack: Dashboard
 *
 * Manages Auth0 resources for the Dashboard application:
 * - SPA client (spa::dashboard)
 * - API resource server (api::dashboard)
 * - Permissions/scopes for RBAC
 */

locals {
  client_id = "b88w8TPaj33tIEyeUBgK8y2PiVpJ9ozA"

  # API audience
  api_audience = "api://dashboard"

  # Callback URLs for the Dashboard
  callbacks = [
    "https://dashboard.unstablestudios.com/callback",
    "http://localhost:5173/callback",
  ]

  logout_urls = [
    "https://dashboard.unstablestudios.com",
    "http://localhost:5173",
  ]

  web_origins = [
    "https://dashboard.unstablestudios.com",
    "http://localhost:5173",
  ]
}

# =============================================================================
# SPA Client
# =============================================================================

resource "auth0_client" "dashboard" {
  name        = "Dashboard"
  description = "Dashboard app hosted by Unstable Studios"
  app_type    = "spa"

  client_metadata = {
    internal_id = "spa::dashboard"
    is_internal = "true"
  }

  callbacks           = local.callbacks
  allowed_logout_urls = local.logout_urls
  web_origins         = local.web_origins

  # Where to send users who navigate directly to Auth0 login
  initiate_login_uri = "https://dashboard.unstablestudios.com"

  oidc_conformant = true
  grant_types     = ["authorization_code", "refresh_token"]

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

# =============================================================================
# API Resource Server
# =============================================================================

# (Get ID via Management API: GET /api/v2/resource-servers?identifier=api://dashboard)
resource "auth0_resource_server" "dashboard" {
  identifier = local.api_audience
  name       = "Dashboard API"

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

resource "auth0_resource_server_scopes" "dashboard" {
  resource_server_identifier = auth0_resource_server.dashboard.identifier

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

resource "auth0_client_grant" "dashboard_spa" {
  client_id = auth0_client.dashboard.id
  audience  = auth0_resource_server.dashboard.identifier
  scopes    = local.all_scopes
}

# User flow grant - allows SPA to request tokens on behalf of users
# Import with: terraform import auth0_client_grant.dashboard_spa_user cgr_k6Z5cMqOda5EbRDA
resource "auth0_client_grant" "dashboard_spa_user" {
  client_id    = auth0_client.dashboard.id
  audience     = auth0_resource_server.dashboard.identifier
  scopes       = local.all_scopes
  subject_type = "user"
}

# =============================================================================
# Roles
# =============================================================================

# Import with: terraform import auth0_role.dashboard_user rol_5QDfnbL7Ft29wfE4
resource "auth0_role" "dashboard_user" {
  name        = "dashboard_user"
  description = "Read-only access to the Dashboard"
}

# Import with: terraform import auth0_role.dashboard_admin rol_azDctu5fZfzX1A4L
resource "auth0_role" "dashboard_admin" {
  name        = "dashboard_admin"
  description = "Full access to the Dashboard (read + edit)"
}

# =============================================================================
# Role Permissions
# =============================================================================

resource "auth0_role_permissions" "dashboard_user" {
  role_id = auth0_role.dashboard_user.id

  # Document read access
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "docs:read"
  }

  # Link read access
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "links:read"
  }

  # Category read access
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "categories:read"
  }

  # Attachment read access
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "attachments:read"
  }

  # Preferences read/write (users can manage their own preferences)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "prefs:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "prefs:edit"
  }

  # Calendar permissions for regular users
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:add:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:edit:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:delete:user"
  }
}

resource "auth0_role_permissions" "dashboard_admin" {
  role_id = auth0_role.dashboard_admin.id

  # Document permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "docs:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "docs:read:unpublished"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "docs:edit"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "docs:delete"
  }

  # Link permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "links:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "links:edit"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "links:delete"
  }

  # Category permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "categories:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "categories:edit"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "categories:delete"
  }

  # Attachment permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "attachments:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "attachments:upload"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "attachments:delete"
  }

  # Preferences permissions (all)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "prefs:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "prefs:edit"
  }

  # Calendar permissions for admins (all scopes)
  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:read"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:add:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:add:global"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:edit:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:edit:global"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:delete:user"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.dashboard.identifier
    name                       = "cal:delete:global"
  }
}
