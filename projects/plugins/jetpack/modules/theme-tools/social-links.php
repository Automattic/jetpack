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

if ( ! class_exists( 'Social_Links' ) ) {

	/**
	 * Social_Links main class.
	 *
	 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
	 */
	class Social_Links {

		/**
		 * The links the user set for each service.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @var array
		 */
		private $links;

		/**
		 * A Publicize object.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @var Publicize
		 */
		private $publicize;

		/**
		 * An array with all services that are supported by both Publicize and the
		 * currently active theme.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @var array
		 */
		private $services = array();

		/**
		 * An array of the services the theme supports
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @var array
		 */
		private $theme_supported_services = array();

		/**
		 * Constructor.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 */
		public function __construct() {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::setup' );
			Automattic\Jetpack\Classic_Theme_Helper\Social_Links::setup();
		}

		/**
		 * Init the admin setup.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 */
		public function admin_setup() {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::admin_setup' );
			Automattic\Jetpack\Classic_Theme_Helper\Social_Links::admin_setup();
		}

		/**
		 * Compares the currently saved links with the connected services and removes
		 * links from services that are no longer connected.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @return void
		 */
		public function check_links() {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::check_links' );
			Automattic\Jetpack\Classic_Theme_Helper\Social_Links::check_links();
		}

		/**
		 * Add social link dropdown to the Customizer.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
		 */
		public function customize_register( $wp_customize ) {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::customize_register' );
			Automattic\Jetpack\Classic_Theme_Helper\Social_Links::customize_register( $wp_customize );
		}

		/**
		 * Sanitizes social links.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @param array $option The incoming values to be sanitized.
		 * @return array
		 */
		public function sanitize_link( $option ) {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::sanitize_link' );
			return Automattic\Jetpack\Classic_Theme_Helper\Social_Links::sanitize_link( $option );
		}

		/**
		 * Returns whether there are any social links set.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @return bool
		 */
		public function has_social_links() {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::has_social_links' );
			return Automattic\Jetpack\Classic_Theme_Helper\Social_Links::has_social_links();
		}

		/**
		 * Return available social links.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @return array
		 */
		public function get_social_links() {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::get_social_links' );
			return Automattic\Jetpack\Classic_Theme_Helper\Social_Links::get_social_links();
		}

		/**
		 * Short-circuits get_option and get_theme_mod calls.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @param string $link The incoming value to be replaced.
		 * @return string $link The social link that we've got.
		 */
		public function get_social_link_filter( $link ) {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::get_social_link_filter' );
			return Automattic\Jetpack\Classic_Theme_Helper\Social_Links::get_social_link_filter( $link );
		}

		/**
		 * Puts together an array of choices for a specific service.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 * @param string $service The social service.
		 * @return array An associative array with profile links and display names.
		 */
		private function get_customize_select( $service ) {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::get_customize_select' );
			return Automattic\Jetpack\Classic_Theme_Helper\Social_Links::get_customize_select( $service );
		}

		/**
		 * Back-compat function for versions prior to 4.0.
		 *
		 * @deprecated $$next-version$$ Moved to Classic Theme Helper package.
		 */
		private function is_customize_preview() {
			_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Social_Links::is_customize_preview' );
			return Automattic\Jetpack\Classic_Theme_Helper\Social_Links::is_customize_preview();
		}
	}

	Automattic\Jetpack\Classic_Theme_Helper\Social_Links::setup();
} // - end if ( ! class_exists( 'Social_Links' )
