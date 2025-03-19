<?php
/**
 * This is the main file for the Data_Sync package.
 *
 * It's responsible for setting up the registry and the endpoints.
 *
 * Setting up with something like this:
 *
 * ```
 *      class Widget_Status extends Data_Sync_Handler {}
 *      class Widget_Data extends Data_Sync_Handler {}
 *
 *      $instance = Data_Sync::setup( 'jetpack_boost', 'jetpack-boost' );
 *      $instance->register( 'widget_status', new Widget_Status() );
 *      $instance->register( 'widget_data', new Widget_Data() );
 *
 * ```
 *
 * This will to create two endpoints: `/wp-json/jetpack-boost/widget-status` and `/wp-json/jetpack-boost/widget-data`
 * and pass the following variables to the `jetpack-boost` script handle.
 *
 * Note that keys for URLs are always automatically transformed to kebab-case, so `widget_status` becomes `widget-status`,
 * and it's expected that keys are always in snake_case when referencing options.
 * They're only transformed to kebab-case when used in URLs.
 *
 * ```
 *    jetpack_boost = {
 *        rest_api: {
 *            value: 'https://example.com/wp-json/jetpack-boost',
 *            nonce: '1234567890'
 *        },
 *        widget_status: {
 *            value: 'active',
 *            nonce: '1234567890'
 *        },
 *        widget_data: {
 *            value: { ... },
 *            nonce: '1234567890'
 *        }
 *    }
 * ```
 *
 *
 * To access the data from WordPress, you can ask the registry for the entry:*
 * ```
 *    $registry = Registry::get_instance( 'jetpack_boost' );
 *    $entry = $registry->get( 'widget_status' );
 *    $entry->get(); // 'active'
 * ```
 *
 *
 * To make it easier to access the data, you should probably create a dedicated helper function:
 * ```
 *    function jetpack_boost_get_data( $key ) {
 *        $registry = Registry::get_instance( 'jetpack_boost' );
 *        $entry = $registry->get( $key );
 *        return $entry->get();
 *    }
 * ```
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Context;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;

final class Data_Sync {

	const PACKAGE_VERSION = '0.6.3';

	/**
	 * @var Registry
	 */
	private $registry;

	/**
	 * @var string Script Handle name to pass the variables to.
	 */
	private $script_handle;

	/**
	 * The Registry class is a singleton.
	 *
	 * @var Data_Sync[]
	 */
	private static $instance = array();
	/**
	 * @var string The namespace to use for the registry.
	 */
	private $namespace;

	public function __construct( $namespace ) {
		$this->namespace = $namespace;
		$this->registry  = new Registry( $namespace );
	}

	public static function get_instance( $namespace ) {
		if ( ! isset( self::$instance[ $namespace ] ) ) {
			self::$instance[ $namespace ] = new self( $namespace );
		}

		return self::$instance[ $namespace ];
	}

	/**
	 * Retrieve nonces for all action endpoints associated with a given entry.
	 *
	 * @param string $entry_key The key for the entry.
	 *
	 * @return array An associative array of action nonces.
	 */
	private function get_action_nonces_for_entry( $entry_key ) {
		// Assuming a method in Registry class to retrieve all action names for an entry
		$action_names = $this->registry->get_action_names_for_entry( $entry_key );
		$nonces       = array();

		foreach ( $action_names as $action_name ) {
			$nonce = $this->registry->get_action_nonce( $entry_key, $action_name );
			if ( $nonce ) {
				$nonces[ $action_name ] = $nonce;
			}
		}

		return $nonces;
	}

	/**
	 * Don't call this method directly.
	 * It's only public so that it can be called as a hook
	 *
	 * @return void
	 */
	// phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
	public function _print_options_script_tag() {
		$data = array(
			'rest_api' => array(
				'value' => rest_url( $this->registry->get_namespace_http() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			),
		);
		foreach ( $this->registry->all() as $key => $entry ) {

			$data[ $key ] = array(
				'value' => $entry->is( Lazy_Entry::class ) ? null : $entry->get(),
				'nonce' => $this->registry->get_endpoint( $key )->create_nonce(),
			);

			if ( DS_Utils::is_debug() ) {
				$data[ $key ]['log'] = $entry->get_parser()->get_log();
			}

			if ( DS_Utils::debug_disable( $key ) ) {
				unset( $data[ $key ]['value'] );
			}

			if ( $entry->is( Lazy_Entry::class ) ) {
				$data[ $key ]['lazy'] = true;
			}

			// Include nonces for action endpoints associated with this entry
			$action_nonces = $this->get_action_nonces_for_entry( $key );
			if ( ! empty( $action_nonces ) ) {
				$data[ $key ]['actions'] = $action_nonces;
			}
		}

		wp_localize_script( $this->script_handle, $this->namespace, $data );
	}

	public function attach_to_plugin( $script_handle, $plugin_page_hook ) {
		$this->script_handle = $script_handle;
		add_action( $plugin_page_hook, array( $this, '_print_options_script_tag' ) );
	}

	public function get_registry() {
		return $this->registry;
	}

	/**
	 * DataSync entries have to be registered before they can be used.
	 *
	 * Typically, entries are stored in WP Options, so this method
	 * is will default to registering entries as Data_Sync_Option.
	 *
	 * However, you can provide an `$entry` instance that subscribes Entry_Can_* methods.
	 * If you do, `Entry_Can_Get` interface is required, and all other Entry_Can_* interfaces are optional.
	 *
	 * @param string        $key    - The key to register the entry under.
	 * @param Parser        $parser - The parser to use for the entry.
	 * @param Entry_Can_Get $custom_entry_instance - The entry to register. If null, a new Data_Sync_Option will be created.
	 *
	 * @return void
	 */
	public function register( $key, $parser, $custom_entry_instance = null ) {
		$option_key = $this->namespace . '_' . $key;

		// If a custom entry instance is provided, and it implements Entry_Can_Get, use that.
		// Otherwise, this Entry will store data using Data_Sync_Option (wp_options).
		$entry = ( $custom_entry_instance instanceof Entry_Can_Get )
			? $custom_entry_instance
			: new Data_Sync_Option( $option_key );

		/*
		 * ## Adapter
		 * This `register` method is inteded to be a shorthand for the most common use case.
		 *
		 * Custom entries can implement various interfaces depending on whether they can set, merge, delete, etc.
		 * However, the Registry expects an object that implements Data_Sync_Entry.
		 * That's why we wrap the Entry in an Adapter - giving it a guaranteed interface.
		 *
		 * ## Customization
		 * Entries can be flexible because they're wrapped in an Adapter.
		 * But you can also create a class that implements `Data_Sync_Entry` directly if you need to.
		 * In that case, you'd need to use:
		 * ```php
		 *      $Data_Sync->get_registry()->register(...)` instead of `$Data_Sync->register(...)
		 * ```
		 */
		if ( method_exists( $parser, 'set_context' ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- Phan misses the method_exists(). See https://github.com/phan/phan/issues/1204.
			$parser->set_context( new Schema_Context( $key ) );
		}
		$entry_adapter = new Data_Sync_Entry_Adapter( $entry, $parser );
		$this->registry->register( $key, $entry_adapter );
	}

	/**
	 * Register a readonly entry.
	 *
	 * @param string   $key The key to register the entry under.
	 * @param Parser   $parser The parser to use for the entry.
	 * @param callable $callback The callback to use for the entry.
	 *
	 * @return void
	 */
	public function register_readonly(
		$key,
		$parser,
		$callback
	) {
		$this->register( $key, $parser, new Data_Sync_Readonly( $callback ) );
	}

	public function register_action(
		$key,
		$action_name,
		$request_schema,
		$instance
	) {
		$this->registry->register_action( $key, $action_name, $request_schema, $instance );
	}
}
