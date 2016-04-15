<?php
include_once( 'class.jetpack-admin-page.php' );

// Builds the landing page and its menu
class Jetpack_React_Page extends Jetpack_Admin_Page {
	protected $dont_show_if_not_active = false;

	function get_page_hook() {
		$title = _x( 'Jetpack 4', 'The menu item label', 'jetpack' );

		// Add the main admin Jetpack menu
		add_menu_page( 'Jetpack 4', $title, 'jetpack_admin_page', 'jetpack', array( $this, 'render' ), 'div' );

		// also create the submenu
		return add_submenu_page( 'jetpack', $title, $title, 'jetpack_admin_page', 'jetpack' );
	}

	function add_page_actions( $hook ) {
		// Add landing page specific underscore templates
		/**
		 * Filters the js_templates callback value
		 *
		 * @since 3.6.0
		 *
		 * @param array array( $this, 'js_templates' ) js_templates callback.
		 * @param string $hook Specific admin page.
		 */
		// @todo is that filter still relevant?
//		add_action( "admin_footer-$hook", apply_filters( 'jetpack_landing_page_js_templates_callback', array( $this, 'js_templates' ), $hook ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_admin_menu', $hook );

		// Place the Jetpack menu item on top and others in the order they
		// appear
		add_filter( 'custom_menu_order',         '__return_true' );
		add_filter( 'menu_order',                array( $this, 'jetpack_menu_order' ) );

		add_action( 'jetpack_notices_update_settings', array( $this, 'show_notices_update_settings' ), 10, 1 );
	}

	function jetpack_menu_order( $menu_order ) {
		$jp_menu_order = array();

		foreach ( $menu_order as $index => $item ) {
			if ( $item != 'jetpack' )
				$jp_menu_order[] = $item;

			if ( $index == 0 )
				$jp_menu_order[] = 'jetpack';
		}

		return $jp_menu_order;
	}

	function page_render() { ?>
		<div id="jp-plugin-container"></div>
	<?php }

	function page_admin_scripts() {
		// Enqueue jp.js and localize it
		wp_enqueue_script( 'react-plugin', plugins_url( '_inc/build/admin.js', JETPACK__PLUGIN_FILE ), array(), time(), true );
		wp_enqueue_style( 'dops-css', plugins_url( '_inc/build/dops-style.css', JETPACK__PLUGIN_FILE ), array(), time() );
		wp_enqueue_style( 'components-css', plugins_url( '_inc/build/style.min.css', JETPACK__PLUGIN_FILE ), array(), time() );
		// Add objects to be passed to the initial state of the app
		wp_localize_script( 'react-plugin', 'Initial_State', array(
			'WP_API_root' => esc_url_raw( rest_url() ),
			'WP_API_nonce' => wp_create_nonce( 'wp_rest' ),
			'isSiteConnected' => (bool) Jetpack::is_active()
		) );
	}
}
