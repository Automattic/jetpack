<?php
/**
 * The Registry class is a singleton that stores references to all Data_Sync_Entry instances.
 * It also stores references to all Endpoint instances.
 * It is namespaced to allow for multiple registries.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync;

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamName
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag
// phpcs:disable Squiz.Commenting.FunctionComment.MissingReturn
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.Missing
// phpcs:disable Squiz.Commenting.ClassComment.Missing
// phpcs:disable Squiz.Commenting.FileComment.Missing

use Automattic\Jetpack\WP_JS_Data_Sync\Endpoints\Endpoint;

class Registry {

	/**
	 * The Registry class is a singleton.
	 *
	 * @var Registry[]
	 */
	private static $instance = array();

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
	 * @param $namespace string The namespace for this registry instance.
	 */
	private function __construct( $namespace ) {
		$this->namespace = $namespace;
	}

	public static function get_instance( $namespace ) {
		if ( ! isset( static::$instance[ $namespace ] ) ) {
			static::$instance[ $namespace ] = new static( $namespace );
		}

		return static::$instance[ $namespace ];
	}

	/**
	 * Sanitize a key.
	 *
	 * @param $key string - Keys should only include alphanumeric characters and underscores.
	 *
	 * @return string
	 * @throws \Exception In debug mode, if the key is invalid.
	 */
	public function sanitize_key( $key ) {
		$sanitized_key = sanitize_key( $key );
		$sanitized_key = str_replace( '-', '_', $sanitized_key );
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && $sanitized_key !== $key ) {
			throw new \Exception( "Invalid key '$key'. Keys should only include alphanumeric characters and underscores." );
		}
		return $sanitized_key;
	}

	/**
	 * Sanitize a key for use in a URL.
	 *
	 * @param $key - Keys should only include alphanumeric characters and underscores.
	 *
	 * @return string
	 */
	public function sanitize_url_key( $key ) {
		return str_replace( '_', '-', sanitize_key( $key ) );
	}

	/**
	 * Register a new entry and add it to the registry.
	 *
	 * @param $entry_name  string - The name of the entry. For example `widget_status`.
	 * @param $value       Data_Sync_Entry_Handler
	 *
	 * @return Data_Sync_Entry
	 * @throws \Exception If the option name is invalid.
	 */
	public function register( $key, $handler ) {

		$key = $this->sanitize_key( $key );

		$entry                 = new Data_Sync_Entry( $this->namespace, $key, $handler );
		$this->entries[ $key ] = $entry;

		$endpoint                = new Endpoint( $this->get_namespace_http(), $this->sanitize_url_key( $entry->key() ), $entry );
		$this->endpoints[ $key ] = $endpoint;

		add_action( 'rest_api_init', array( $endpoint, 'register_rest_route' ) );

		return $entry;
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
	 * @param $key string - The key for the endpoint.
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
	 * @param $key string - The key for the entry.
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
