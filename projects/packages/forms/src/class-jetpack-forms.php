<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Forms\ContactForm\Util;
use Automattic\Jetpack\Forms\Dashboard\Dashboard;

/**
 * Understands the Jetpack Forms package.
 */
class Jetpack_Forms {

	const PACKAGE_VERSION = '6.20.0';

	/**
	 * Load the contact form module.
	 */
	public static function load_contact_form() {
		Util::init();

		$wp_build_bootstrapped = self::maybe_bootstrap_wp_build();

		if ( $wp_build_bootstrapped && is_admin() ) {
			self::jetpack_forms_register_menu();
		}

		if ( self::is_feedback_dashboard_enabled() ) {
			$dashboard = new Dashboard();
			$dashboard->init();
		}

		if ( is_admin() && apply_filters_deprecated( 'tmp_grunion_allow_editor_view', array( true ), '0.30.5', '', 'This functionality will be removed in an upcoming version.' ) ) {
			add_action( 'current_screen', '\Automattic\Jetpack\Forms\ContactForm\Editor_View::add_hooks' );
		}

		add_action( 'init', '\Automattic\Jetpack\Forms\ContactForm\Util::register_pattern' );

		// Add hook to delete file attachments when a feedback post is deleted
		add_action( 'before_delete_post', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'delete_feedback_files' ) );

		// Enforces the availability of block support controls in the UI for classic themes.
		add_filter( 'wp_theme_json_data_default', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'add_theme_json_data_for_classic_themes' ) );
	}

	/**
	 * Get the plugin URL.
	 */
	public static function plugin_url() {
		return plugin_dir_url( __FILE__ );
	}

	/**
	 * Get the assets URL.
	 */
	public static function assets_url() {
		return plugin_dir_url( __DIR__ ) . 'assets';
	}

	/**
	 * Returns true if the feedback dashboard is enabled.
	 *
	 * @return boolean
	 */
	public static function is_feedback_dashboard_enabled() {
		/**
		 * Enable the new Jetpack Forms dashboard.
		 *
		 * @module contact-form
		 * @since 0.3.0
		 *
		 * @param bool false Should the new Jetpack Forms dashboard be enabled? Default to false.
		 */
		return apply_filters( 'jetpack_forms_dashboard_enable', true );
	}

	/**
	 * Returns true if the legacy menu item is retired.
	 *
	 * @return boolean
	 */
	public static function is_legacy_menu_item_retired() {
		return apply_filters( 'jetpack_forms_retire_legacy_menu_item', true );
	}

	/**
	 * Returns true if MailPoet integration is enabled.
	 *
	 * @return boolean
	 */
	public static function is_mailpoet_enabled() {
		/**
		 * Enable MailPoet integration.
		 *
		 * @param bool false Whether MailPoet integration be enabled. Default is false.
		 */
		return apply_filters( 'jetpack_forms_mailpoet_enable', true );
	}

	/**
	 * Returns true if Hostinger Reach integration is enabled.
	 *
	 * @return boolean
	 */
	public static function is_hostinger_reach_enabled() {
		/**
		 * Enable Hostinger Reach integration.
		 *
		 * @param bool false Whether Hostinger Reach integration be enabled. Default is false.
		 */
		return apply_filters( 'jetpack_forms_hostinger_reach_enable', false );
	}

	/**
	 * Returns true if the Integrations UI should be enabled.
	 *
	 * @return boolean
	 */
	public static function is_integrations_enabled() {
		/**
		 * Whether to enable the Integrations UI.
		 *
		 * @param bool true Whether to enable the Integrations UI. Default true.
		 */
		return apply_filters( 'jetpack_forms_is_integrations_enabled', true );
	}

	/**
	 * Attempt to load wp-build generated assets if they exist.
	 *
	 * @return bool
	 */
	private static function maybe_bootstrap_wp_build() {
		$build_entry = dirname( __DIR__ ) . '/build/index.php';

		if ( ! file_exists( $build_entry ) ) {
			return false;
		}

		require_once $build_entry;

		return true;
	}

	/**
	 * Register a menu entry that opens the wp-build single page inside wp-admin.
	 */
	private static function jetpack_forms_register_menu() {
		add_action(
			'admin_menu',
			static function () {
				$menu_slug = 'admin.php?page=jetpack-forms-wp-admin&p=' . rawurlencode( '/' );

				add_menu_page(
					__( 'Jetpack Forms', 'jetpack-forms' ),
					__( 'Forms', 'jetpack-forms' ),
					'edit_pages',
					$menu_slug,
					'',
					'dashicons-feedback',
					58
				);
			}
		);
	}
}
