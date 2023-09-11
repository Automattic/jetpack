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

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;

final class Data_Sync {

	const PACKAGE_VERSION = '0.2.2';

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

			if ( $entry->is( Lazy_Entry::class ) ) {
				$data[ $key ]['lazy'] = true;
			}
		}

		wp_localize_script( $this->script_handle, $this->namespace, $data );
	}

	/**
	 * Create a new instance of the Data_Sync class.
	 *
	 * @param $namespace     string - Each registry should have a unique name, typically plugin name, like `jetpack_boost`
	 * @param $script_handle string - The script handle name to pass the variables to, typically the same as the plugin name,
	 *                       but with a dash instead of underscore, like `jetpack-boost`
	 * @param $plugin_page   string   - The slug name of the plugin page. If null, it will be assumed to be the same as the
	 *                       registry name, formatted as a http parameter. `jetpack_boost` -> `jetpack-boost`
	 * @param $parent_page   string   - The slug name for the parent menu (or the file name of a standard WordPress admin page).
	 *                       Defaults to `admin`
	 *
	 * @return Data_Sync - A new instance of the Data_Sync class.
	 */
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
	 * @param $key    string - The key to register the entry under.
	 * @param $schema Schema - The schema to use for the entry.
	 * @param $entry  Entry_Can_Get - The entry to register. If null, a new Data_Sync_Option will be created.
	 *
	 * @return void
	 */
	public function register( $key, $schema, $custom_entry_instance = null ) {
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
		$entry_adapter = new Data_Sync_Entry_Adapter( $entry, $schema );
		$this->registry->register( $key, $entry_adapter );
	}

}
