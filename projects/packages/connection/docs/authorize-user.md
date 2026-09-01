# Authorize a user / Create a user token

Once the site is [registered](register-site.md) (it has a blog token), you can authorize a user. This links a local WordPress user to their WordPress.com account and creates a "user token", which lets the Connection package make authenticated requests on that user's behalf.

The first user to be authorized becomes the **connection owner** (also called the "master user"). A site can have a site-level connection with no authorized users (see `is_site_connection()`), but many features require at least one connected user.

## The authorization flow

Authorizing a user means redirecting them to WordPress.com, where they approve the connection, and then back to your site. The Connection package builds the correct, signed URL for you — you should never construct it by hand, because it carries a signed representation of the user's role.

### Using the JS connection components

The JS connection package (see the `js-packages/connection` folder in the monorepo) ships React components that handle the entire connect + authorize flow out of the box. If you can, prefer those.

### Using the REST API

If you registered the site via `jetpack/v4/connection/register`, the response already includes an `authorizeUrl` — send the user there to authorize.

To fetch an authorization URL on its own, make a GET request to `jetpack/v4/connection/authorize_url`. It accepts optional `redirect_uri` and `from` query arguments.

### Authorizing a user manually in PHP

To send the current user off to Calypso to authorize (this redirects and exits):

```php
use Automattic\Jetpack\Connection\Manager;

$manager = new Manager( 'plugin-slug' );
$manager->connect_user();
```

`connect_user()` accepts an optional user ID and redirect URL:

```php
$manager->connect_user( $user_id, $redirect_url );
```

Or, if you'd rather render your own link or button, fetch the URL instead of redirecting:

```php
$auth_url = $manager->get_authorization_url();
```

`get_authorization_url()` accepts optional `$user`, `$redirect`, `$from`, and `$raw` arguments:

```php
$auth_url = $manager->get_authorization_url( $user, $redirect_url, 'my-plugin-banner' );
```

## Checking user connection status

The `Manager` class exposes several helpers for reasoning about user authorization:

* `is_user_connected()`: Checks if the current user (or a given user ID) is connected (authorized in WordPress.com).
* `has_connected_owner()`: Checks if the site has a connection owner (a connected admin marked as the owner).
* `is_connection_owner()`: Checks if the current user (or a given user ID) is the connection owner.
* `get_connection_owner()`: Returns the `WP_User` of the connection owner, or `false`.

```php
$manager = new Manager( 'plugin-slug' );

if ( $manager->is_user_connected() ) {
	// The current user has authorized their WordPress.com account.
}

if ( ! $manager->has_connected_owner() ) {
	// The site is registered but nobody owns the connection yet.
}
```

## Changing the connection owner

If the connection owner needs to be changed to another connected user, make a POST request to `jetpack/v4/connection/owner` with the target user ID. Only an existing connected admin can transfer ownership, and the new owner must already be a connected user.

## Disconnecting a user

To disconnect (deauthorize) a user, removing their user token:

```php
$manager = new Manager( 'plugin-slug' );
$manager->disconnect_user();
```

`disconnect_user()` accepts an optional user ID. Note that disconnecting the connection owner has site-wide implications — prefer transferring ownership first if other users are still connected.

To remove the entire connection (blog token plus all user tokens), see the [Disconnect the site](register-site.md#disconnect-the-site) section of the registration guide.
