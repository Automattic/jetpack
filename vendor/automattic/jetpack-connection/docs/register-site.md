# Register the site / Create blog token

This means registering the site with WordPress.com. It will create a "site (or 'blog') token" on both sides, establishing a secure two-way communication path. 

The blog token is required in order to [authenticate at a user level](authorize-user.md) later (link to user auth docs here), so let's learn the simplest way we can do that in your plugin. 

### Install the right packages

First, let's make sure that the `automattic/jetpack-connection` package is set up in your composer.json file:

At minimum you need three things. One is the `automattic/jetpack-autoloader` package, which will ensure that you're not colliding with any other plugins on the site that may be including the same packages. Two, of course, is the `automattic/jetpack-connection` package. Third is our `automattic/jetpack-config` package that will be your tool for initializing the packages. 

We recommend that you always use the latest published versions of our packages, but you can also run our latest master branch builds:
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
        "automattic/jetpack-autoloader": "dev-master",
        "automattic/jetpack-config": "dev-master",
        "automattic/jetpack-connection": "dev-master"
    }
}
```

### Initialize the package

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

### Create admin_post endpoint

```php
use Automattic\Jetpack\Connection\Manager;

add_action( 'admin_post_register_site', 'your_plugin_register_site' );

function your_plugin_register_site() {
	check_admin_referer( 'register-site' );
	$manager = new Manager( 'plugin-slug' );

	// Mark the plugin connection as enabled, in case it was disabled earlier. 
	$manager->enable_plugin();

	// If the token doesn't exist (see "Soft and Hard Disconnect" section below), we need to register the site.
	if ( ! $manager->get_access_token() ) {
		$manager->register();
	}

	// This is where you could put your error handling, redirects, or whatever decorations you need.
}
```

### Make the button!

How are people supposed to register without something to click? I guess they would have to write their own plugin. Or you can make them a button that feeds into the admin_post endpoint you just created...

```html
<form action="/wp-admin/admin-post.php" method="post">
	<input type="hidden" name="action" value="register_site" />
	<?php wp_nonce_field( 'register-site' ); ?>
	<input type="submit" value="Register this site" class="button button-primary" />
</form>
```

### Voila!

And that's it! You've just created a button that will register a WordPress site with WordPress.com. Now the only thing left to do is [authorize the user](authorize-user.md). 

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

Method `$manager->remove_connection()` essentially calls `disable_plugin()`, `disconnect_site_wpcom()`, and `delete_all_connection_tokens()`.
Its purpose is to simplify the disconnection process.
If you need to customize the disconnect process, or perform a partial disconnect, you can call these methods one by one.

```php
// Mark the plugin connection as disabled.

$manager = new Manager( 'plugin-slug' );

// Mark the plugin connection as disabled.
$manager->disable_plugin();

// If no other plugins use the connection, this will destroy the blog tokens on both this site, and the tokens stored on wordpress.com
$manager->disconnect_site_wpcom();

// If no other plugins use the connection, this will clear all the tokens!
$manager->delete_all_connection_tokens();
```

### Soft and Hard Disconnect

There are two types of disconnection happening when you request a disconnect: *Soft Disconnect* and *Hard Disconnect*.
The package API takes care of that under the hood, so in most cases there won't be any need to differentiate them in your code.
Below is some basic information on how they differ.

#### Soft Disconnect

Soft disconnect means that all the tokens are preserved, and the connection for other plugins stays active.
Technically speaking, soft disconnect happens when you call `$manager->disable_plugin();`.
Next time you try to use the connection, you call `$manager->is_plugin_enabled()`, which will return `false`.

Calling `$manager->disconnect_site_wpcom()` and `$manager->delete_all_connection_tokens()` afterwards is still needed.
These calls will determine if the aforementioned plugin is the only one using the connection, and perform *soft* or *hard* disconnect accordingly.

#### Hard Disconnect

If there are no other plugins using the connection, or all of them have already been *softly disconnected*, the package will perform the *hard disconnect*.
In that case methods `disconnect_site_wpcom()` and `delete_all_connection_tokens()` will actually remove the tokens and run the `deregister` API request.

You can explicitly request hard disconnect by providing the argument `$ignore_connected_plugins`:
```php
$manager = new Manager( 'plugin-slug' );

$manager->disable_plugin();

// The `$ignore_connected_plugins` argument is set to `true`, so the Connection Manager will perform the hard disconnect.
$manager->disconnect_site_wpcom( true );
$manager->delete_all_connection_tokens( true );
```

#### Using the connection
If the plugin was *softly* disconnected, the access tokens will still be accessible.
However, the user explicitly requested the plugin to be disabled, so you need to check for that before you utilize the connection in any way:
```php
$manager = new Manager( 'plugin-slug' );

if ( $manager->is_plugin_enabled() && $manager->get_access_token() ) {
	// Perform the API requests.
} else {
	// Assume the plugin is disconnected, no matter if the tokens actually exist.
}
```

#### Reconnecting
Whether a *soft* or *hard* disconnect was performed, the plugin will be marked as "disconnected", so if the connect is being reestablished, you need to call `$manager->enable_plugin()` to remove that flag.
If the plugin was *softly* disconnected, removing the flag is enough for it to work. Otherwise, you'll need to register the website again:
```php
$manager = new Manager( 'plugin-slug' );
$manager->enable_plugin();

if ( ! $manager->get_access_token() ) {
    $manager->register();
}
```
