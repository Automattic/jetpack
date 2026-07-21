<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Forms\ContactForm\Feedback_Source;
use Automattic\Jetpack\Forms\ContactForm\Util;
use Automattic\Jetpack\Forms\Dashboard\Dashboard;
/**
 * Understands the Jetpack Forms package.
 */
class Jetpack_Forms {

	const PACKAGE_VERSION = '7.23.1';

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

		// Invalidate the source post IDs cache when a feedback post is permanently deleted.
		add_action( 'deleted_post', array( '\Automattic\Jetpack\Forms\ContactForm\Feedback', 'invalidate_source_ids_cache_on_delete' ), 10, 2 );

		// Enforces the availability of block support controls in the UI for classic themes.
		add_filter( 'wp_theme_json_data_default', array( '\Automattic\Jetpack\Forms\ContactForm\Contact_Form', 'add_theme_json_data_for_classic_themes' ) );

		// Initialize abilities registration for WordPress Abilities API (WP 6.9+)
		\Automattic\Jetpack\Forms\Abilities\Forms_Abilities::init();
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
	 * Returns true if webhooks are enabled.
	 *
	 * @return boolean
	 */
	public static function is_webhooks_enabled() {
		/**
		 * Whether to enable webhooks for Jetpack Forms.
		 *
		 * @param bool true Whether webhooks should be enabled. Default true.
		 */
		return apply_filters( 'jetpack_forms_webhooks_enabled', true );
	}

	/**
	 * Whether author-configured outbound destinations from a form source should be honored.
	 *
	 * Destinations declared in the form content (webhooks, the legacy postToUrl attribute and
	 * the Salesforce integration) carry submission data to an outbound URL, so they are only
	 * honored when whoever placed the form had an administrator-level capability:
	 *
	 * - For post/page forms (`single`, numeric source id) the source post's author must have
	 *   the `manage_options` capability. Editor/Author/Contributor-authored forms are dropped.
	 * - For block templates, block template parts and widgets the source id is not a numeric
	 *   post, so there is no author to check. Editing any of those surfaces already requires
	 *   the `edit_theme_options` capability — administrator-tier, strictly above the
	 *   capabilities an Editor/Author/Contributor holds — so their destinations are trusted.
	 *
	 * The source type is established server-side (from the signed JWT, or by re-rendering the
	 * real template/template part on the legacy path) and is not forgeable by the submitter.
	 *
	 * Returns false for any other unresolved source (non-numeric id of an unknown type, or a
	 * numeric id with no admin-capable author).
	 *
	 * @param int|string $source_id   The form source id: a post id for post/page forms, or a
	 *                                non-numeric value for widget or block-template sources.
	 * @param string     $source_type The form source type: single, widget, block_template or
	 *                                block_template_part. Defaults to 'single'.
	 * @return boolean
	 */
	public static function should_honor_content_destinations( $source_id, $source_type = 'single' ) {
		// Block templates, template parts and widgets can only be authored by users with the
		// administrator-tier `edit_theme_options` capability, so their destinations are trusted
		// even though the source id is not a numeric post.
		if ( in_array( $source_type, Feedback_Source::ADMIN_TIER_SOURCE_TYPES, true ) ) {
			return true;
		}

		if ( ! is_numeric( $source_id ) ) {
			return false;
		}

		$source_id = (int) $source_id;
		if ( $source_id <= 0 ) {
			return false;
		}

		$author_id = (int) get_post_field( 'post_author', $source_id );

		return $author_id > 0 && user_can( $author_id, 'manage_options' );
	}

	/**
	 * Returns true if the Integrations UI should be shown in the Forms dashboard.
	 *
	 * @since 6.22.0
	 *
	 * @return boolean
	 */
	public static function show_dashboard_integrations() {
		/**
		 * Whether to show Integrations UI in the Forms dashboard.
		 *
		 * @since 6.22.0
		 *
		 * @param bool true Whether to show the Integrations UI in the dashboard. Default true.
		 */
		return apply_filters( 'jetpack_forms_show_dashboard_integrations', true );
	}

	/**
	 * Returns true if the Integrations UI should be shown in the Form block editor.
	 *
	 * @since 6.22.0
	 *
	 * @return boolean
	 */
	public static function show_block_integrations() {
		/**
		 * Whether to show Integrations UI in the Form block editor.
		 *
		 * @since 6.22.0
		 *
		 * @param bool true Whether to show the Integrations UI in the editor. Default true.
		 */
		return apply_filters( 'jetpack_forms_show_block_integrations', true );
	}

	/**
	 * Returns true if integration icons should be shown (editor sidebar and integrations modal).
	 *
	 * @since 6.22.0
	 *
	 * @return boolean
	 */
	public static function show_integration_icons() {
		/**
		 * Whether to show integration icons in the UI.
		 *
		 * If set to false, the ActiveIntegrations component (editor sidebar) will be hidden
		 * and integration icons in the integrations modal will not be rendered.
		 *
		 * @since 6.22.0
		 *
		 * @param bool true Whether to show integration icons. Default true.
		 */
		return apply_filters( 'jetpack_forms_show_integration_icons', true );
	}
}
