<?php
/**
 * The Registry class is a singleton that stores references to all Data_Sync_Entry instances.
 * It also stores references to all Endpoint instances.
 * It is namespaced to allow for multiple registries.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\Schema\Schema_Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Endpoints\Action_Endpoint;
use Automattic\Jetpack\WP_JS_Data_Sync\Endpoints\Endpoint;

class Registry {

	/**
	 * Registry instances are namespaced to allow for multiple registries.
	 *
	 * @var string
	 */
	private $namespace;

	/**
	 * Store a references for every Data_Sync_Entry instance.
	 *
	 * @var Data_Sync_Entry[]
	 */
	private $entries = array();

	private $action_endpoints = array();

	/**
	 * Store references for every Endpoint instance.
	 *
	 * @var Endpoint[]
	 */
	private $endpoints = array();

	/**
	 * There can be multiple registries, reference them by namepsace.
	 * For example "jetpack_boost".
	 *
	 * @param string $namespace The namespace for this registry instance.
	 */
	public function __construct( $namespace ) {
		$this->namespace = $namespace;
	}

	/**
	 * Sanitize a key.
	 *
	 * @param string $key - Keys should only include alphanumeric characters and underscores.
	 *
	 * @return string
	 * @throws \Exception In debug mode, if the key is invalid.
	 */
	private function sanitize_key( $key ) {
		$sanitized_key = sanitize_key( $key );
		$sanitized_key = str_replace( '-', '_', $sanitized_key );
		if ( DS_Utils::is_debug() && $sanitized_key !== $key ) {
			// If the key is invalid,
			// Log an error during development
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( "Invalid key '$key'. Keys should only include alphanumeric characters and underscores." );
		}
		return $sanitized_key;
	}

	/**
	 * Sanitize a key for use in a URL.
	 *
	 * @param string $key - Keys should only include alphanumeric characters and underscores.
	 *
	 * @return string
	 */
	private function sanitize_url_key( $key ) {
		return str_replace( '_', '-', sanitize_key( $key ) );
	}

	/**
	 * Register a new entry and add it to the registry.
	 *
	 * @param string          $key - The name of the entry. For example `widget_status`.
	 * @param Data_Sync_Entry $entry
	 *
	 * @return Data_Sync_Entry
	 */
	public function register( $key, $entry ) {

		$key = $this->sanitize_key( $key );

		$this->entries[ $key ]   = $entry;
		$endpoint                = new Endpoint( $this->get_namespace_http(), $this->sanitize_url_key( $key ), $entry );
		$this->endpoints[ $key ] = $endpoint;

		add_action( 'rest_api_init', array( $endpoint, 'register_rest_routes' ) );

		return $entry;
	}

	/**
	 * Register an action endpoint.
	 *
	 * @param string        $key            The base key for the endpoint.
	 * @param string        $action_name    The name of the action.
	 * @param Schema_Parser $request_schema The schema for the action's request body.
	 * @param mixed         $action_class   The class handling the action logic.
	 */
	public function register_action( $key, $action_name, $request_schema, $action_class ) {
		// Create and store the action endpoint instance
		$action_endpoint = new Action_Endpoint(
			$this->get_namespace_http(),
			$this->sanitize_url_key( $key ),
			$this->sanitize_url_key( $action_name ),
			$request_schema,
			$action_class
		);

		// Store the action endpoint instance for nonce retrieval
		$this->action_endpoints[ $key ][ $action_name ] = $action_endpoint;

		// Register the REST route for the action endpoint
		add_action( 'rest_api_init', array( $action_endpoint, 'register_rest_routes' ) );
	}

	/**
	 * Retrieve all action names for a given entry.
	 *
	 * @param string $entry_key The key for the entry.
	 *
	 * @return array An array of action names.
	 */
	public function get_action_names_for_entry( $entry_key ) {
		if ( isset( $this->action_endpoints[ $entry_key ] ) ) {
			return array_keys( $this->action_endpoints[ $entry_key ] );

		}
		return array();
	}

	/**
	 * Get the nonce for a specific action endpoint.
	 *
	 * @param string $key         The base key for the endpoint.
	 * @param string $action_name The name of the action.
	 *
	 * @return false|string The nonce or false if not found.
	 */
	public function get_action_nonce( $key, $action_name ) {
		if ( isset( $this->action_endpoints[ $key ][ $action_name ] ) ) {
			return $this->action_endpoints[ $key ][ $action_name ]->create_nonce();
		}
		return false;
	}

	/**
	 * Get all registered entries.
	 *
	 * @return Data_Sync_Entry[]
	 */
	public function all() {
		return $this->entries;
	}

	/**
	 * Get the endpoint for a given key.
	 *
	 * @param string $key - The key for the endpoint.
	 *
	 * @return Endpoint|false
	 */
	public function get_endpoint( $key ) {
		if ( ! isset( $this->endpoints[ $key ] ) ) {
			return false;
		}
		return $this->endpoints[ $key ];
	}

	/**
	 * Get the entry for a given key.
	 *
	 * @param string $key - The key for the entry.
	 *
	 * @return Data_Sync_Entry|false
	 */
	public function get_entry( $key ) {
		if ( ! isset( $this->entries[ $key ] ) ) {
			return false;
		}
		return $this->entries[ $key ];
	}

	/**
	 * Get the namespace for use in a filter.
	 *
	 * @return string The namespace key of this registry instance.
	 */
	public function get_namespace() {
		return $this->namespace;
	}

	/**
	 * Get the namespace for use in a URL.
	 *
	 * @return string The namespace key of this registry instance.
	 */
	public function get_namespace_http() {
		return $this->sanitize_url_key( $this->namespace );
	}
}
