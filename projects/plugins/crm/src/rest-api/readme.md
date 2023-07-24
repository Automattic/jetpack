# Jetpack CRM API v4

## Introduction

Welcome to our first, official, API utilising WP REST.

In practice that means that we're using the WP REST API as close to WordPress core's intention as possible.

## Development

Fow now, all endpoint logic goes directly into the `src/v4` directory in anticipation of a future v5.

This is the same model WooCommerce has been using successfully for quite some time, so there's no reason for us to reinvent the wheel.

### The WordPress way

What does that mean? It means that we'll do our best to use all default WordPress REST API functionality, including:

* We follow the [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
* We extend `WP_REST_Controller` in as many instances as possible
  * We use the suggested `get_item`, `get_item_permissions_check`... methods that exist on the abstract controller class
* [We use WordPress' version of hyperlinking](https://developer.wordpress.org/rest-api/using-the-rest-api/linking-and-embedding/)
* We'll add hooks where it _might_ make sense in anticipation for third party developers to utilise them (read: so not just when the core plugin needs it)

#### Naming

Being a RESTful API, we follow the [REST naming conventions of singleton and collection resources](https://restfulapi.net/resource-naming/), and we use HTTP methods to determine what action will happen against the resource route.

Example:

* `/wp-json/jetpack-crm/v4/contacts` - Collection resource route
* `/wp-json/jetpack-crm/v4/contacts/:id` - Singleton resource route

```php
public function register_routes() {
	// Register REST collection resource endpoints.
	register_rest_route(
		$this->namespace,
		'/' . $this->rest_base,
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			),
		)
	);

	// Register REST singleton resource endpoints.
	register_rest_route(
		$this->namespace,
		'/' . $this->rest_base . '/(?P<id>[\d]+)',
		array(
			'args' => array(
				'id' => array(
					'description' => __( 'Unique identifier for the resource.', 'zero-bs-crm' ),
					'type'        => 'integer',
				),
			),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			),
		)
	);
}
```
