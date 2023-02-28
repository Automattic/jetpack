# WP JS Data Sync

WP JS Data Sync is a library designed to help sync data between WordPress and the JavaScript in the admin dashboard.

This helps create streamlined way to pass data from the WordPress backend to JavaScript and:

- Be clear about what options are available
- Ensure that any necessary transformation/validation/sanitization actions are performed at predictable times
- Provide a structured way to pass the data to the frontend on page load
- Automatically generate REST API CRUD endpoints that can be used by the JavaScript on the front-end
- Automatically setup a nonce for every entry that is registered
- Integrate with libraries like Zod on the front-end to provide type-safe data sync.

This package is currently used in combination with the `@jetpack/js-packages/svelte-data-sync-client` package, but can be extended to work with other libraries in the future.

## Usage Overview

After integrating the package into your plugin, the typical setup for a new entry would look something like this:

```php
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Handler;

// Step 1: Create entry handler classes
class Widget_Status extends Data_Sync_Entry_Handler {
	// Validation implementation
	// ...
}
class Widget_Text_Field extends Data_Sync_Entry_Handler {
	// Validation implementation
	// ...
}

// Register the entries in the plugin:
plugin_name_register_entry( 'widget_status', new Widget_Status() );
plugin_name_register_entry( 'widget_title', new Widget_Text_Field() );

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
// GET, POST, DELETE: /wp-json/plugin-name/widget-status
// GET, POST, DELETE: /wp-json/plugin-name/widget-title
// GET, POST, DELETE: /wp-json/plugin-name/widget-text
```

To update the data, you can submit a fetch request and pass in both WordPress REST API nonce and the nonce for the specific entry:
```js
// Update the widget title:
const req = fetch( 'https://example.com/wp-json/plugin-name/widget-title', {
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

To make it easy to use in Svelte, there's a `@jetpack/js-packages/svelte-data-sync-client` package that provides a Svelte store that can be used to interact with the data.


## Setup
### Step 1: Initialize Data Sync for the Admin Dashboard

The `Data_Sync` class is responsible for initializing and streamlining the setup for the Admin dashboard.

Initializing the Data Sync and pass in data about the admin environment.
This only needs to be done once per `$namespace` and is going to attach all the necesasry hooks.

```php
// This only needs to happen in the Admin Dashboard:
add_action( 'admin_init', function() {
	// Data_Sync::setup( $namespace, $script_name, $plugin_page, $parent_page = 'admin' );
	Data_Sync::setup( 'jetpack_favorites', 'jetpack-favorites-scripts', 'jetpack-favorites-dashboard', 'admin' );
} );
```
You can omit `$plugin_page` and `$parent_page` parameters. They will default to `$namespace` for `$plugin_page` and `admin` for `$parent_page`.

### Step 2: Create an Entry Handler

Every entry needs to have a corresponding entry handler. The entry handler is responsible for:
	
- **Sanitizing** the data before it's saved to storage (**required**)
- **Parsing** the data when it's received via REST API
- **Validating** the data when it's received via REST API
- **Transforming** the data when it's retrieved from storage

#### A simple example:
The only required method is `sanitize`. 

For simple endpoints that don't need any data transformation or validation, you can do something like this:

```php
class Favorite_Posts_Status extends Data_Sync_Entry_Handler {
	public function sanitize( $value ) {
		return (bool) $value;
	}
}
```

#### A more complex example:

Here's an example that's going to handle an entry called `posts`.

This is going to store a list of post IDs in the database, but the REST API will receive and return a list of post objects.

```php
class Favorite_Posts extends Data_Sync_Entry_Handler {

	public function parse( $value ) {
		return wp_list_pluck( $value, 'ID' );
	}

	public function validate( $value ) {
		$valid = true;
		if ( ! is_array( $value ) ) {
			$this->add_error( 'I expected a list of posts.' );
			return false;
		}
		foreach ( $value as $post_id ) {
			if ( ! get_post( $post_id ) ) {
				$valid = false;
				$this->add_error( "Post with ID '$post_id' does not exist." );
			}
		}
		return $valid;
	}

	// A sanitize method is called before the option is saved to the database.
	public function sanitize( $value ) {
		return array_map( 'absint', $value );
	}

	// Send the whole post object to the client.
	public function transform( $value ) {
		$posts = array_map( 'get_post', $value );
		return array_filter( $posts, function( $post ) {
			return $post instanceof WP_Post;
		} );
	}
}
```

### Step 3: Register Entries

Now that we have two handlers setup, we can register them with the Data Sync registry.

```php
$registry = Registry::get_instance( 'jetpack_favorites' );
$registry->register( 'enabled', new Favorite_Posts_Status() );
$registry->register( 'posts', new Favorite_Posts() );
```

### Step 4: Uage

Now that the entries are registered, just like in [Usage](#usage) section, you can interact with the data via REST API or the Entry object.

```
// GET, POST, DELETE: /wp-json/jetpack-favorites/favorite-posts-status
// GET, POST, DELETE: /wp-json/jetpack-favorites/favorite-posts
```

Or change the values via the Entry object in PHP:
```php
$entry = Registry::get_instance( 'jetpack_favorites' )->get_entry( 'enabled' );
$entry->set( true );
```

Calling the `set` method is going to also going to trigger all the same validation hooks as the REST API.

If you need to bypass parsing, sanitizing and transforming, you can use `raw_set` and `raw_get` methods.

## Utilities
If you're using the data in various places, it might be helpful to setup helper functions to make it easier to use:

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


## Security
Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License
WP JS Data Sync is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

