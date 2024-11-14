<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Theme Tools: Social Links.
 *
 * This feature will only be activated for themes that declare their support.
 * This can be done by adding code similar to the following during the
 * 'after_setup_theme' action:
 *
 * add_theme_support( 'social-links', array(
 *     'facebook', 'twitter', 'linkedin', 'tumblr',
 * ) );
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

if ( ! function_exists( 'jetpack_theme_supports_social_links' ) ) {
	/**
	 * Init Social_Links if the theme declares support.
	 */
	function jetpack_theme_supports_social_links() {
			// @phan-suppress-next-line PhanNoopNew
			new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links();
	}
	if ( ! ( new Host() )->is_wpcom_platform() ) {
		add_action( 'init', 'jetpack_theme_supports_social_links', 30 );
	}
}

if ( ! class_exists( 'Social_Links' ) ) {

	/**
	 * Social_Links main class.
	 *
	 * @deprecated 13.8 Moved to Classic Theme Helper package.
	 */
	class Social_Links {

		/**
		 * Constructor.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 */
		public function __construct() {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->__construct' );
			// @phan-suppress-next-line PhanNoopNew
			new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links();
		}

		/**
		 * Init the admin setup.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 */
		public function admin_setup() {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->admin_setup' );
			$social_links_instance = new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links();
			$social_links_instance->admin_setup();
		}

		/**
		 * Compares the currently saved links with the connected services and removes
		 * links from services that are no longer connected.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 * @return void
		 */
		public function check_links() {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->check_links' );
			$social_links_instance = new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links();
			$social_links_instance->check_links();
		}

		/**
		 * Add social link dropdown to the Customizer.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
		 */
		public function customize_register( $wp_customize ) {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->customize_register' );
			$social_links_instance = new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links();
			$social_links_instance->customize_register( $wp_customize );
		}

		/**
		 * Sanitizes social links.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 * @param array $option The incoming values to be sanitized.
		 * @return array
		 */
		public function sanitize_link( $option ) {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->sanitize_link' );
			return ( new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links() )->sanitize_link( $option );
		}

		/**
		 * Returns whether there are any social links set.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 * @return bool
		 */
		public function has_social_links() {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->has_social_links' );
			return ( new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links() )->has_social_links();     }

		/**
		 * Return available social links.
		 *
		 * @return array
		 */
		public function get_social_links() {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->get_social_links' );
			return ( new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links() )->get_social_links();
		}

		/**
		 * Short-circuits get_option and get_theme_mod calls.
		 *
		 * @deprecated 13.8 Moved to Classic Theme Helper package.
		 * @param string $link The incoming value to be replaced.
		 * @return string $link The social link that we've got.
		 */
		public function get_social_link_filter( $link ) {
			_deprecated_function( __METHOD__, '13.8', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links->get_social_link_filter' );
			return ( new \Automattic\Jetpack\Classic_Theme_Helper\Social_Links() )->get_social_link_filter( $link );
		}
	}

} // - end if ( ! class_exists( 'Social_Links' )
