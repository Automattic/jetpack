<?php
/**
 * Public functions for registering Jetpack Forms integrations.
 *
 * Loaded through Composer's `files` autoloader so the functions exist as soon as the
 * autoloader runs, well before plugins execute. A plugin can therefore call
 * jetpack_forms_register_integration() from anywhere — at file scope, on any hook — without
 * knowing or caring whether Jetpack Forms has finished loading.
 *
 * This file must only define functions. It is executed before WordPress has loaded, so
 * calling add_action() or any other WordPress function here would fatal.
 *
 * @package automattic/jetpack-forms
 */

use Automattic\Jetpack\Forms\Integrations\Integration_Registry;

if ( ! function_exists( 'jetpack_forms_register_integration' ) ) {
	/**
	 * Register an integration with Jetpack Forms.
	 *
	 * The integration appears in the Forms integrations modal, in the block editor and in the
	 * Forms dashboard, and can act on new responses.
	 *
	 * Call this whenever you like. Registration only records the definition; it does not
	 * depend on load order, and the order integrations are registered in carries no meaning.
	 *
	 * Supported `$args`:
	 *
	 * - type (string)                    : 'service' or 'plugin'. Default 'service'.
	 * - title (string)                   : Name shown on the integration card.
	 * - subtitle (string)                : One-line description shown under the title.
	 * - active_tooltip (string)          : Tooltip shown when the integration is active.
	 * - icon_url (string)                : Absolute URL to an icon.
	 * - enabled_by_default (bool)        : Whether new forms enable it. Default false.
	 * - file (string)                    : For 'plugin' types, the plugin file path.
	 * - settings_url (string)            : Relative admin URL for the integration's settings.
	 * - marketing_redirect_slug (string) : Redirect slug used for marketing links.
	 * - is_available (callable)          : Returns whether the integration should appear at
	 *                                      all. Use this for feature flags and licensing; a
	 *                                      unavailable integration is absent rather than
	 *                                      disabled. Default: always available.
	 * - status_callback (callable)       : Receives the base status array and returns it with
	 *                                      the integration's own connection state merged in.
	 * - on_submission (callable)         : Called after a response is stored, with the
	 *                                      integration's settings for that form.
	 * - settings_attribute (string)      : Only for integrations that predate the shared
	 *                                      `integrations` block attribute. Names a top-level
	 *                                      block attribute to use instead. New integrations
	 *                                      should omit this and get namespaced storage.
	 * - editor_script (string)           : Handle of a registered script to enqueue in the
	 *                                      block editor, which should call
	 *                                      registerFormsIntegration() to supply the card UI.
	 * - dashboard_script (string)        : Same, for the Forms dashboard.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Unique slug for the integration.
	 * @param array  $args Integration definition.
	 * @return bool Whether the integration was registered.
	 */
	function jetpack_forms_register_integration( $slug, array $args = array() ) {
		return Integration_Registry::register( $slug, $args );
	}
}

if ( ! function_exists( 'jetpack_forms_unregister_integration' ) ) {
	/**
	 * Remove a previously registered integration.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Integration slug.
	 * @return void
	 */
	function jetpack_forms_unregister_integration( $slug ) {
		Integration_Registry::unregister( $slug );
	}
}
