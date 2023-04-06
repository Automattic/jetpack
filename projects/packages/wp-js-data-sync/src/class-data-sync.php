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
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;

final class Data_Sync {

	const PACKAGE_VERSION = '0.1.0';

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
				'value' => $entry->get(),
				'nonce' => $this->registry->get_endpoint( $key )->create_nonce(),
			);
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
	 * Register a new entry.
	 * If the entry is not an instance of Entry_Can_Get, a new Data_Sync_Option will be created.
	 *
	 * @param $key    string - The key to register the entry under.
	 * @param $schema Schema - The schema to use for the entry.
	 * @param $entry  Entry_Can_Get - The entry to register. If null, a new Data_Sync_Option will be created.
	 *
	 * @return void
	 */
	public function register( $key, $schema, $entry = null ) {
		if ( ! $entry instanceof Entry_Can_Get ) {
			$option_key = $this->namespace . '_' . $key;
			$entry      = new Data_Sync_Option( $option_key );
		}
		$this->registry->register( $key, new Data_Sync_Entry( $entry, $schema ) );
	}

}
