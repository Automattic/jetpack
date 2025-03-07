<?php
/**
 * Module Name: Custom content types
 * Module Description: Display different types of content on your site with custom content types.
 * First Introduced: 3.1
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Writing
 * Sort Order: 34
 * Feature: Writing
 * Additional Search Queries: cpt, custom post types, portfolio, portfolios, testimonial, testimonials, nova
 *
 * @package automattic/jetpack-classic-theme-helper
 */

use Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio;
use Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Host;

if ( ! function_exists( 'jetpack_load_custom_post_types' ) ) {
	/**
	 * Load Portfolio, Testimonial, and Nova CPT.
	 */
	function jetpack_load_custom_post_types() {
		include __DIR__ . '/custom-post-types/class-jetpack-portfolio.php';
		include __DIR__ . '/custom-post-types/class-jetpack-testimonial.php';
		include __DIR__ . '/custom-post-types/class-nova-restaurant.php';
	}
	add_action( 'init', array( '\Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio', 'init' ) );
	register_activation_hook( __FILE__, array( '\Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio', 'activation_post_type_support' ) );
	add_action( 'jetpack_activate_module_custom-content-types', array( '\Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio', 'activation_post_type_support' ) );

	add_action( 'init', array( '\Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial', 'init' ) );
	register_activation_hook( __FILE__, array( '\Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial', 'activation_post_type_support' ) );
	add_action( 'jetpack_activate_module_custom-content-types', array( '\Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial', 'activation_post_type_support' ) );

	add_action( 'init', array( '\Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant', 'init' ) );

	add_action( 'rest_api_init', 'register_rest_route_custom_content_types' );

}

if ( ! function_exists( 'jetpack_custom_post_types_loaded' ) ) {
	/**
	 * Pass the active status to the front-end in it's initial state.
	 */
	function jetpack_custom_post_types_loaded() {
		// Ensure we're only adding this script on the Jetpack settings page.
		if ( ! isset( $_GET['page'] ) || 'jetpack' !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- We are not processing any data here.
			return;
		}
		$initial_state = 'var CUSTOM_CONTENT_TYPE__INITIAL_STATE; typeof CUSTOM_CONTENT_TYPE__INITIAL_STATE === "object" || (CUSTOM_CONTENT_TYPE__INITIAL_STATE = JSON.parse(decodeURIComponent("' . rawurlencode(
			wp_json_encode(
				array(
					'active'                   => classic_theme_helper_cpt_should_be_active(),
					'over_ride'                => false,
					'should_show_testimonials' => Jetpack_Testimonial::site_should_display_testimonials() ? true : false,
					'should_show_portfolios'   => Jetpack_Portfolio::site_should_display_portfolios() ? true : false,
				)
			)
		) . '")));';

			// Create a global variable with the custom content type feature status so that the value is available
			// earlier than the API method above allows, preventing delayed loading of the settings card.
			wp_register_script( 'custom-content-types-data', '', array(), '0.1.0', true );
			wp_enqueue_script( 'custom-content-types-data' );
			wp_add_inline_script(
				'custom-content-types-data',
				$initial_state,
				'before'
			);
	}
	add_action( 'init', 'jetpack_custom_post_types_loaded' );
}
if ( ! function_exists( 'register_rest_route_custom_content_types' ) ) {
	/**
	 * Register the REST route for the custom content types.
	 */
	function register_rest_route_custom_content_types() {

		register_rest_route(
			'jetpack/v4',
			'/feature/custom-content-types',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'get_custom_content_type_details',
				'permission_callback' => 'custom_content_require_admin_privilege_callback',
			)
		);
	}
}

/**
 * Get the custom content type details.
 *
 * @return WP_REST_Response
 */
function get_custom_content_type_details() {

	$active                    = classic_theme_helper_cpt_should_be_active();
	$over_ride                 = false;
	$name                      = 'Custom Content Types';
	$description               = 'Display different types of content on your site with custom content types.';
	$additional_search_queries = 'cpt, custom post types, portfolio, portfolios, testimonial, testimonials';

	return rest_ensure_response(
		array(
			'custom-content-types' => array(
				'active'                    => $active,
				'over_ride'                 => $over_ride,
				'name'                      => $name,
				'description'               => $description,
				'additional_search_queries' => $additional_search_queries,
			),
		)
	);
}

/**
 * Check if the current user has the required capability.
 *
 * @return bool|WP_Error True if the request is made by ad administrator, WP_Error otherwise.
 */
function custom_content_require_admin_privilege_callback() {
	if ( current_user_can( 'manage_options' ) ) {
		return true;
	}

	return new WP_Error(
		'rest_forbidden',
		esc_html__( 'You are not allowed to perform this action.', 'jetpack-classic-theme-helper' ),
		array( 'status' => rest_authorization_required_code() )
	);
}

/**
 * Check if the custom content types should be active.
 *
 * @return bool
 */
function classic_theme_helper_cpt_should_be_active() {
	if ( ! Jetpack_Testimonial::site_should_display_testimonials() && ! Jetpack_Portfolio::site_should_display_portfolios() ) {
		return false;
	}
	return true;
}

if ( ! function_exists( 'jetpack_cpt_settings_api_init' ) ) {
	/**
	 * Add Settings Section for CPT
	 */
	function jetpack_cpt_settings_api_init() {
		if ( ! classic_theme_helper_cpt_should_be_active() ) {
			return;
		}

		add_settings_section(
			'jetpack_cpt_section',
			'<span id="cpt-options">' . __( 'Your Custom Content Types', 'jetpack-classic-theme-helper' ) . '</span>',
			'jetpack_cpt_section_callback',
			'writing'
		);
	}
	if ( ( new Host() )->is_wpcom_simple() ) {
		add_action( 'admin_init', 'jetpack_cpt_settings_api_init', 15 );
	} else {
		add_action( 'admin_init', 'jetpack_cpt_settings_api_init' );
	}
}

if ( ! function_exists( 'jetpack_cpt_section_callback' ) ) {
	/**
	 * Settings Description
	 */
	function jetpack_cpt_section_callback() {
		if ( class_exists( 'Redirect' ) ) {
			?>
			<p>
				<?php esc_html_e( 'Use these settings to display different types of content on your site.', 'jetpack-classic-theme-helper' ); ?>
				<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( Redirect::get_url( 'jetpack-support-custom-content-types' ) ); ?>"><?php esc_html_e( 'Learn More', 'jetpack-classic-theme-helper' ); ?></a>
			</p>
			<?php
		}
	}
}

/**
 * Remove Custom Content Types from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 * @todo Remove this function once the module file is removed from the Jetpack plugin.
 * @return array
 */
function remove_custom_content_types_module_list( $items ) {
	if ( isset( $items['custom-content-types'] ) ) {
		unset( $items['custom-content-types'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'remove_custom_content_types_module_list' );

if ( function_exists( 'jetpack_load_custom_post_types' ) ) {

	jetpack_load_custom_post_types();

}
