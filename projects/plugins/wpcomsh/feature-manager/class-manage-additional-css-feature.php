<?php
/**
 * Manage Additional CSS feature for Atomic sites.
 *
 * @package WPCOMSH
 */

namespace WPCOMSH_Feature_Manager;

/**
 * Class Manage_Additional_CSS_Feature
 *
 * Responsible with removing the Additional CSS feature on Free Atomic Sites and adding a Nudge.
 *
 * @package WPCOMSH_Feature_Manager
 */
class Manage_Additional_CSS_Feature {
	/**
	 * Disable the Core custom CSS and the Jetpack custom CSS module.
	 */
	public static function maybe_disable_custom_css() {
		// Do not run if Jetpack is not enabled.
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			return;
		}

		// Do not execute for older versions of Jetpack.
		if ( version_compare( JETPACK__VERSION, '9.9-alpha', '<' ) ) {
			return;
		}

		if ( wpcom_site_has_feature( \WPCOM_Features::CUSTOM_DESIGN ) ) {
			return;
		}

		self::deactivate_module();
		\add_filter( 'jetpack_customize_enable_additional_css_nudge', '__return_true' );
	}

	/**
	 * Disable Jetpack CUSTOM CSS module and re-register the admin menu Appearance > Additional CSS
	 */
	public static function deactivate_module() {
		\add_filter(
			'jetpack_get_available_modules',
			array( __CLASS__, 'remove_jetpack_custom_get_available_modules' )
		);

		\add_filter( 'jetpack_available_modules', array( __CLASS__, 'remove_jetpack_custom_css' ) );

		\add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ) );
	}

	/**
	 * Handle our admin menu item and legacy page declaration.
	 */
	public static function admin_menu() {
		// Add in our legacy page to support old bookmarks and such.
		\add_submenu_page( null, __( 'CSS', 'wpcomsh' ), __( 'Additional CSS', 'wpcomsh' ), 'edit_theme_options', 'editcss', array( __CLASS__, 'admin_page' ) );

		// Add in our new page slug that will redirect to the customizer.
		$hook = \add_theme_page( __( 'CSS', 'wpcomsh' ), __( 'Additional CSS', 'wpcomsh' ), 'edit_theme_options', 'editcss-customizer-redirect', array( __CLASS__, 'admin_page' ) );
		\add_action( "load-{$hook}", array( __CLASS__, 'customizer_redirect' ) );
	}

	/**
	 * Empty placeholder for the menu link.
	 */
	public static function admin_page() { }

	/**
	 * Handle the redirect for the customizer.  This is necessary because
	 * we can't directly add customizer links to the admin menu.
	 *
	 * There is a core patch in trac that would make this unnecessary.
	 *
	 * @link https://core.trac.wordpress.org/ticket/39050
	 */
	public static function customizer_redirect() {
		\wp_safe_redirect(
			self::customizer_link(
				array(
					'return_url' => wp_get_referer(),
				)
			)
		);
		exit;
	}

	/**
	 * Build the URL to deep link to the Customizer.
	 *
	 * You can modify the return url via $args.
	 *
	 * @param array $args Array of parameters.
	 * @return string
	 */
	public static function customizer_link( $args = array() ) {
		$unslashed_url    = ! isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : null;
		$return_url_array = null === $unslashed_url ? array() : array( 'return_url' => rawurlencode( $unslashed_url ) );

		$args = \wp_parse_args( $args, $return_url_array );

		return \add_query_arg(
			array(
				array(
					'autofocus' => array(
						'section' => 'custom_css',
					),
				),
				'return' => esc_url( $args['return_url'] ),
			),
			\admin_url( 'customize.php' )
		);
	}

	/**
	 * Remove the custom-css module from the active modules in order to disable it entirely.
	 *
	 * @param array $modules A list of active modules.
	 *
	 * @return array
	 */
	public static function remove_jetpack_custom_get_available_modules( $modules ) {

		unset( $modules['custom-css'] );

		return $modules;
	}

	/**
	 * Remove Jetpack's custom-css module from active modules.
	 *
	 * @param array $active_modules The current Jetpack active modules.
	 *
	 * @return array
	 */
	public static function remove_jetpack_custom_css( $active_modules ) {
		return array_filter(
			$active_modules,
			static function ( $module ) {
				return 'custom-css' !== $module;
			}
		);
	}
}
