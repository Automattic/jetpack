# Register the site / Create blog token

This means registering the site with WordPress.com. It will create a "site (or 'blog') token" on both sides, establishing a secure two-way communication path.

The blog token is required in order to [authenticate at a user level](authorize-user.md) later (link to user auth docs here), so let's learn the simplest way we can do that in your plugin.

## Install the right packages

First, let's make sure that the `automattic/jetpack-connection` package is set up in your composer.json file:

At minimum you need three things. One is the `automattic/jetpack-autoloader` package, which will ensure that you're not colliding with any other plugins on the site that may be including the same packages. Two, of course, is the `automattic/jetpack-connection` package. Third is our `automattic/jetpack-config` package that will be your tool for initializing the packages.

We recommend that you always use the latest published versions of our packages, but you can also run our latest trunk branch builds:
```
{
    "name": "you/your-awesome-plugin",
    "description": "Super awesome plugin!",
    "type": "package",
    "license": "GPL-2.0-or-later",
    "authors": [
        {
            "name": "Your name",
            "email": "your@email.com"
        }
    ],
    "minimum-stability": "dev",
    "require": {
        "automattic/jetpack-autoloader": "dev-trunk",
        "automattic/jetpack-config": "dev-trunk",
        "automattic/jetpack-connection": "dev-trunk"
    }
}
```

## Initialize the package

Second, we must initialize ("configure") the `jetpack-connection` package within your plugin, and provide the information about it.

This is where the `jetpack-config` and `jetpack-autoload` packages come into play. Do this, and you're ready to start consuming the Jetpack connection!

```php
use Automattic\Jetpack\Config;

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

function jpcs_load_plugin() {

	// Here we enable the Jetpack packages.
	$config = new Config();
	$config->ensure(
        'connection',
        array(
            'slug' => 'plugin-slug', // Required, slug of your plugin, should be unique.
            'name' => 'Plugin Name', // Required, your plugin name.
            'url_info' => 'https://example.org/conneciton-info', // Optional, URL of the connection info page.
        )
    );
}

add_action( 'plugins_loaded', 'jpcs_load_plugin', 1 );
```

## Connecting the site and the users

In the JS connection package (see js-packages/connection folder in the monorepo) you'll find the React components that handle all the connection process for you out of the box. If you can, prefer to use them.

If you need to build your own connection flow from scratch, here is how to do it:

### Make an API call to register the site

You can then make an API POST call to `jetpack/v4/connection/register` to register the site.

If successful, this endpoint will return a `authorizeUrl` which is the URL you need to take the user to if you want them to authorize their WPCOM users.

#### Manually registering the site and authorizing user

If you need to build a custom flow and run these processes manually, here's what to do:

To register the site:
```
$manager = new Manager( 'plugin-slug' );
$manager->try_registration();
```

You can then connect the user, meaning that the user will be redirected to Calypso to authorize their WPCOM users:
```
$manager->connect_user();
```

Or you can fetch the Calypso URL and use it in a link or button:
```
$auth_url   = $manager->get_authorization_url();
```
### Disconnect the site

When disconnecting the site, we recommend also clearing the remaining user tokens, since those won't work anyway and may cause problems on reconnection.

```php
use Automattic\Jetpack\Connection\Manager;

function your_plugin_disconnect_site() {
	check_admin_referer( 'disconnect-site' );

	$manager = new Manager( 'plugin-slug' );

	// Mark the plugin connection as disabled.
	// If there are no other plugins using the connection, destroy blog and user tokens,
	// as well as the tokens stored in wordpress.com
	$manager->remove_connection();

	// Your error handling and decorations
}
```

#### Custom Disconnect

Method `$manager->remove_connection()` essentially calls `disconnect_site_wpcom()` and `delete_all_connection_tokens()`.
Its purpose is to simplify the disconnection process.
If you need to customize the disconnect process you can call these methods one by one.

```php

$manager = new Manager( 'plugin-slug' );

// If no other plugins use the connection, this will destroy the blog tokens on both this site, and the tokens stored on wordpress.com
$manager->disconnect_site_wpcom();

// If no other plugins use the connection, this will clear all the tokens!
$manager->delete_all_connection_tokens();
```

### Using the connection

The `Connection::Manager` class gives you several methods to check on the connection status and act accordingly. Here are some of the most useful methods:

* `is_connected()`: Checks if the site has a site-level connection. aka has a blog token.
* `has_connected_owner()`: Checks if the site has an admin connected and marked as the connection owner.
* `is_user_connected()`: Checks if the current user (or any given user) is connected (authorized in wpcom).
* `is_site_connection()`: Checks if the site is connected only at a site level. Similar to `is_connected` but will diferentiate if this is truly a site-only connection and not a site that has a broken user connection.

### Reconnecting

There's a method that handles reconnection in case you need to refresh your connection. This will destroy the connection and start a new connection flow. Note that you still need to authorize the user after reconnecting.

```php
$manager = new Manager( 'plugin-slug' );
$manager->reconnect();
```

If you want something smarter, you can use `restore()`. This method will check for your tokens health and refresh only what's needed.

From your plugin, most likely you will want to make a request to `jetpack/v4/connection/reconnect`.
