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

	const PACKAGE_VERSION = '5.1.0';

	/**
	 * Load the contact form module.
	 */
	public static function load_contact_form() {
		Util::init();

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
		$default                      = false; // Don't retire the legacy menu item by default.
		$largest_legacy_connection_id = 245807300; // The connection ID after which the legacy menu item is retired.

		$connection_id = defined( 'IS_WPCOM' ) && IS_WPCOM ? get_current_blog_id() : intval( \Jetpack_Options::get_option( 'id' ) );

		if ( $connection_id > $largest_legacy_connection_id ) {
			$default = true; // Retire the legacy menu item for connections after the specified ID.
		}

		// If the user has seen the migration announcement, also default to true.
		if ( ! $default && get_user_option( 'jetpack_forms_migration_announcement_seen' ) ) {
			$default = true;
		}

		return apply_filters( 'jetpack_forms_retire_legacy_menu_item', $default );
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
		return apply_filters( 'jetpack_forms_mailpoet_enable', false );
	}
}
