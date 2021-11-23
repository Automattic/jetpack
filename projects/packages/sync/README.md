# Jetpack Sync

Everything needed to allow syncing to the WordPress.com infrastructure.

## Get Started

## Initial Full Sync

An initial full sync of the site is started when the site is registered or when a user is authorized.

### `Actions::do_only_first_initial_sync`

The `Actions::do_only_first_initial_sync` method can be used to start an initial full sync when a site has not already had a full sync started. This is useful for situations in which a plugin needs to start an initial full sync only if no other plugin has already started one.

## Examples
