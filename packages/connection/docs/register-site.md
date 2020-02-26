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

Second, we must initialize ("configure") the `jetpack-connection` package within your plugin.

This is where the `jetpack-config` and `jetpack-autoload` packages come into play. Do this, and you're ready to start consuming the Jetpack connection!

```php
use Automattic\Jetpack\Config;

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

function jpcs_load_plugin() {

	// Here we enable the Jetpack packages.
	$config = new Config();
	$config->ensure( 'connection' );
}

add_action( 'plugins_loaded', 'jpcs_load_plugin', 1 );
```

### Create admin_post endpoint

```php
use Automattic\Jetpack\Manager;

add_action( 'admin_post_register_site', 'your_plugin_register_site' );

function your_plugin_register_site() {
	check_admin_referer( 'register-site' );
	( new Manager() )->register();

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
use Automattic\Jetpack\Manager;

function your_plugin_disconnect_site() {
	check_admin_referer( 'disconnect-site' );

	// This will destroy the blog tokens on both this site, and the tokens stored on wordpress.com
	( new Manager() )->disconnect_site_wpcom();

	// Clear all the tokens!
	( new Manager() )->delete_all_connection_tokens();

	// Your error handling and decorations
}
```