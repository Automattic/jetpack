# WP JS Data Sync

## Debug

WP JS DataSync listens for `ds-debug-disable` GET parameter to disable certain DataSync values.

To disable a specific DataSync value, add `?ds-debug-disable=<entry-key>` to the URL.
To disable all data sync values, add `?ds-debug-disable=all` to the URL.

#### Debug Example

If your dashboard URL is `https://example.com/wp-admin/admin.php?page=example`, and you want to disable the `widget_status` value, you would navigate to `https://example.com/wp-admin/admin.php?page=example?ds-debug-disable=widget_status`.














# Outdated Documentation:
WP JS Data Sync is a library designed to help sync data between WordPress and the JavaScript in the admin dashboard.

This helps create streamlined way to pass data from the WordPress backend to JavaScript and:

- Be clear about what options are available
- Ensure that any necessary transformation/validation/sanitization actions are performed at predictable times
- Provide a structured way to pass the data to the frontend on page load
- Automatically generate REST API CRUD endpoints that can be used by the JavaScript on the front-end
- Automatically set up a nonce for every entry that is registered
- Integrate with libraries like Zod on the front-end to provide type-safe data sync.

## Usage Overview

After integrating the package into your plugin, the typical setup for a new entry would look something like this:

```php
// Register the entries in the plugin:
plugin_name_register_entry( 'widget_status', Schema::as_boolean() );
plugin_name_register_entry( 'widget_title', Schema::as_string() );

// Somewhere, where the data is needed, get the data:
$status = plugin_name_get_entry( 'widget_status' );
$title = plugin_name_get_entry( 'widget_title' );
```


This will pass the necessary data to the admin-page scripts via `wp_localize_script`:
```js
// The data is available in the `window.plugin_name` global variable.
window.plugin_name = {
	rest_api: {
		nonce: '1234567890',
		value: 'https://example.com/wp-json',
	},
	widget_status: {
		value: true,
		nonce: '1234567890',
	},
	widget_title: {
		value: 'My Widget',
		nonce: '1234567890',
	},
	widget_text: {
		value: 'This is my widget',
		nonce: '1234567890',
	}
}
```

And will also create a REST API endpoints that can be used to update the data:
```
// GET, POST:    /wp-json/plugin-name/widget-status
// POST:         /wp-json/plugin-name/widget-status/set
// POST, DELETE: /wp-json/plugin-name/widget-status/delete
```


To update the data, you can submit a fetch request and pass in both WordPress REST API nonce and the nonce for the specific entry:
```js
// Update the widget title:
const req = fetch( 'https://example.com/wp-json/plugin-name/widget-status/set', {
	method: 'POST',
	headers: {
		'X-WP-Nonce': window.plugin_name.rest_api.nonce,
		'X-Jetpack-WP-JS-Sync-Nonce': window.plugin_name.widget_status.nonce,
	},
	body: JSON.stringify( {
		'JSON': 'This is a title',
	} ),
} );
const response = await req.json();
```

The response will look like this:
```json
{
	"status": "success",
	"JSON": "This is a title",
}
```

## Setup
### Step 1: Initialize Data Sync for the Admin Dashboard

The `Data_Sync` class is responsible for initializing and streamlining the setup for the Admin dashboard.

Initializing the Data Sync and pass in data about the admin environment.
This only needs to be done once per `$namespace` and is going to attach all the necesasry hooks.

```php
function plugin_name_initialize_datasync() {
	$data_sync = Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE );
	//          attach_to_plugin( $script_handle,       $plugin_page_hook         );
	$data_sync->attach_to_plugin( 'plugin-name-admin', 'jetpack_page_plugin-name' );
}
// This only needs to happen in the Admin Dashboard:
add_action( 'admin_init', 'plugin_name_initialize_datasync' );
```

### Step 2: Register Entries

Now that we have two handlers setup, we can register them with the Data Sync registry.

#### A simple example:
```php
$registry = Registry::get_instance( 'jetpack_favorites' );
$registry->register( 'enabled', Schema::as_boolean() );
```

#### A more complex example:

The default storage is `wp_options` using the `Data_Sync_Option` class, but sometimes you might want to customize that.

Here's an example of how to make Data Sync use WordPress posts instead of WP Options

```php
class Favorite_Posts implements Entry_Can_Get {

	public function get() {
		$posts = array_map( 'get_post', $value );
		return array_filter( $posts, function( $post ) {
			return $post instanceof WP_Post;
		} );
		return $posts;
	}
	
}
```


### Step 3: Usage

Now that the entries are registered, just like in [Usage](#usage) section, you can interact with the data via REST API or the Entry object.

```
// GET, POST:    /wp-json/jetpack-favorites/enabled
// POST:         /wp-json/jetpack-favorites/enabled/set
// POST, DELETE: /wp-json/jetpack-favorites/enabled/delete
// GET:          /wp-json/jetpack-favorites/favorite-posts
```

Or change the values via the Entry object in PHP:
```php
$entry = Registry::get_instance( 'jetpack_favorites' )->get_entry( 'enabled' );
$entry->set( true );
```

Values provided to `$entry->set()` will always be validated by the Schema before being saved.

## Utilities
If you're using the data in various places, it might be helpful to set up helper functions to make it easier to use:

```php
function jetpack_favorites() {
	return Registry::get_instance( 'jetpack_favorites' );
}

function jetpack_favorites_get( $key ) {
	$entry = jetpack_favorites()->get_entry( $key );
	return $entry->get();
}

function jetpack_favorites_set( $key, $value ) {
	$entry = jetpack_favorites()->get_entry( $key );
	return $entry->set( $value );
}
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security
Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License
WP JS Data Sync is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

