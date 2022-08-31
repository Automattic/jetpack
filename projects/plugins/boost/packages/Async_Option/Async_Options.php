<?php

namespace Automattic\Jetpack\Packages\Async_Option;

class Async_Options {
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
	public function _print_options_script_tag() {
		$data = array(
			'rest_api' => array(
				'value' => rest_url( $this->registry->get_namespace_http() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			),
		);
		foreach ( $this->registry->all() as $option ) {
			$data[ $option->key() ] = array(
				'value' => $option->get(),
				'nonce' => $this->registry->get_endpoint( $option->key() )->create_nonce(),
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
