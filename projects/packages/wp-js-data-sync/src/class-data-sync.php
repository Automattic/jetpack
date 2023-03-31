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

class Data_Sync {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * @var Registry
	 */
	protected $registry;

	/**
	 * @var string Script Handle name to pass the variables to.
	 */
	protected $script_handle;

	public function __construct( $script_handle, Registry $registry ) {
		$this->script_handle = $script_handle;
		$this->registry      = $registry;
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
		foreach ( $this->registry->all() as $entry ) {
			$key          = $entry->key();
			$data[ $key ] = array(
				'value' => $entry->get(),
				'nonce' => $this->registry->get_endpoint( $key )->create_nonce(),
			);
		}

		wp_localize_script( $this->script_handle, $this->registry->get_namespace(), $data );
	}

	/**
	 * Tell WordPress to print script tags in the specified plugin page
	 *
	 * @param string $plugin_page The slug name of the plugin page.
	 * @param string $parent_page The slug name for the parent menu (or the file name of a standard
	 *                            WordPress admin page).
	 *
	 * @return void
	 */
	public function add_to_plugin_page( $plugin_page, $parent_page ) {
		$plugin_page_hook = get_plugin_page_hook( $plugin_page, $parent_page );
		add_action( $plugin_page_hook, array( $this, '_print_options_script_tag' ) );
	}

	/**
	 * Create a new instance of the Data_Sync class.
	 *
	 * @param $registry_name string - Each registry should have a unique name, typically plugin name, like `jetpack_boost`
	 * @param $script_handle string - The script handle name to pass the variables to, typically the same as the plugin name,
	 *                       but with a dash instead of underscore, like `jetpack-boost`
	 * @param $plugin_page   string   - The slug name of the plugin page. If null, it will be assumed to be the same as the
	 *                       registry name, formatted as a http parameter. `jetpack_boost` -> `jetpack-boost`
	 * @param $parent_page   string   - The slug name for the parent menu (or the file name of a standard WordPress admin page).
	 *                       Defaults to `admin`
	 *
	 * @return Data_Sync - A new instance of the Data_Sync class.
	 */
	public static function setup( $registry_name, $script_handle, $plugin_page = null, $parent_page = 'admin' ) {

		$registry = Registry::get_instance( $registry_name );

		/**
		 * The plugin page slug can be anything, but makes setup easier to read by making assumptions.
		 * This assumes that the plugin page string is going to match the registry namespace,
		 * formatted as a http parameter. (kebab case)
		 *
		 * Example:
		 * Registry with namespace:  `jetpack_boost` should be
		 * automatically attached to `admin.php?page=jetpack-boost`
		 */
		if ( $plugin_page === null ) {
			$plugin_page = $registry->get_namespace_http();
		}

		$instance = new self( $script_handle, $registry );
		$instance->add_to_plugin_page( $plugin_page, $parent_page );

		return $instance;
	}

}
