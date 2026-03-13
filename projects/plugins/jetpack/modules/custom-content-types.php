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
 * Additional Search Queries: cpt, custom post types, portfolio, portfolios, testimonial, testimonials
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Redirect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! function_exists( 'jetpack_load_custom_post_types' ) ) {
	if ( class_exists( 'Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio' ) ) {
		// Temporarily require the file here to prevent possible deprecation notices for a short period of time.
		// @todo: Can remove this if check after the subsequent release.
		include __DIR__ . '/custom-post-types/portfolios.php';
	} else {
		/**
		 * Load Portfolio CPT.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		function jetpack_load_custom_post_types() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			include __DIR__ . '/custom-post-types/portfolios.php';
		}
	}
}

if ( ! function_exists( 'jetpack_custom_post_types_loaded' ) ) {

	if ( class_exists( 'Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio' ) ) {
		// Temporarily require the file here to prevent possible deprecation notices for a short period of time.
		// @todo: Can remove this if check after the subsequent release.
		add_action(
			'jetpack_modules_loaded',
			function () {
				Jetpack::enable_module_configurable( __FILE__ );
			}
		);
	} else {
		/**
		 * Make module configurable.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		function jetpack_custom_post_types_loaded() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			Jetpack::enable_module_configurable( __FILE__ );
		}
		add_action( 'jetpack_modules_loaded', 'jetpack_custom_post_types_loaded' );
	}
}

if ( ! function_exists( 'jetpack_cpt_settings_api_init' ) ) {

	if ( class_exists( 'Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio' ) ) {
		// Temporarily require the file here to prevent possible deprecation notices for a short period of time.
		// @todo: Can remove this if check after the subsequent release.
		add_action(
			'admin_init',
			function () {
				add_settings_section(
					'jetpack_cpt_section',
					'<span id="cpt-options">' . __( 'Your Custom Content Types', 'jetpack' ) . '</span>',
					function () {
						?>
						<p>
							<?php esc_html_e( 'Use these settings to display different types of content on your site.', 'jetpack' ); ?>
							<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( Redirect::get_url( 'jetpack-support-custom-content-types' ) ); ?>"><?php esc_html_e( 'Learn More', 'jetpack' ); ?></a>
						</p>
						<?php
					},
					'writing'
				);
			}
		);
	} else {
		/**
		 * Add Settings Section for CPT
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		function jetpack_cpt_settings_api_init() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			add_settings_section(
				'jetpack_cpt_section',
				'<span id="cpt-options">' . __( 'Your Custom Content Types', 'jetpack' ) . '</span>',
				'jetpack_cpt_section_callback',
				'writing'
			);
		}
		add_action( 'admin_init', 'jetpack_cpt_settings_api_init' );
	}
}

if ( ! function_exists( 'jetpack_cpt_section_callback' ) ) {
	/**
	 * Settings Description
	 *
	 * @deprecated 13.9 Moved to Classic Theme Helper package.
	 */
	function jetpack_cpt_section_callback() {
		_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
		?>
		<p>
			<?php esc_html_e( 'Use these settings to display different types of content on your site.', 'jetpack' ); ?>
			<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( Redirect::get_url( 'jetpack-support-custom-content-types' ) ); ?>"><?php esc_html_e( 'Learn More', 'jetpack' ); ?></a>
		</p>
		<?php
	}
}

if ( function_exists( 'jetpack_load_custom_post_types' ) ) {
	jetpack_load_custom_post_types();
}
