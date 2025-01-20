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
}

if ( ! function_exists( 'jetpack_custom_post_types_loaded' ) ) {
	/**
	 * Make module configurable.
	 */
	function jetpack_custom_post_types_loaded() {
		if ( class_exists( 'Jetpack' ) ) {
			Jetpack::enable_module_configurable( __FILE__ );
		}
	}
	add_action( 'jetpack_modules_loaded', 'jetpack_custom_post_types_loaded' );
}

if ( ! function_exists( 'jetpack_cpt_settings_api_init' ) ) {
	/**
	 * Add Settings Section for CPT
	 */
	function jetpack_cpt_settings_api_init() {
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

if ( function_exists( 'jetpack_load_custom_post_types' ) ) {

	jetpack_load_custom_post_types();

}
