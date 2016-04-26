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
			'connectionStatus' => Jetpack::is_development_mode() ? 'dev' : (bool) Jetpack::is_active(),
			'connectUrl' => Jetpack::init()->build_connect_url( false, true ),
			'currentVersion' => JETPACK__VERSION,
			'happinessGravIds' => jetpack_get_happiness_gravatar_ids(),
		) );
	}
}

/*
 * List of happiness Gravatar IDs
 *
 * @todo move to functions.global.php when available
 * @since 4.1.0
 * @return array
 */
function jetpack_get_happiness_gravatar_ids() {
	return array(
		'724cd8eaaa1ef46e4c38c4213ee1d8b7',
		'623f42e878dbd146ddb30ebfafa1375b',
		'561be467af56cefa58e02782b7ac7510',
		'd8ad409290a6ae7b60f128a0b9a0c1c5',
		'790618302648bd80fa8a55497dfd8ac8',
		'6e238edcb0664c975ccb9e8e80abb307',
		'4e6c84eeab0a1338838a9a1e84629c1a',
		'9d4b77080c699629e846d3637b3a661c',
		'4626de7797aada973c1fb22dfe0e5109',
		'190cf13c9cd358521085af13615382d5',
		'0d6982875acab8158ccc8b77aa67251a',
		'f7006d10e9f7dd7bea89a001a2a2fd59',
		'16acbc88e7aa65104ed289d736cb9698',
		'4d5ad4219c6f676ea1e7d40d2e8860e8',
	);
}
