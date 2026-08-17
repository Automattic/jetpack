<?php
/**
 * Automattician-only controls for Jetpack feature flags.
 *
 * The jetpack-feature-flags package is a registry: it resolves every flag
 * through the `jetpack_feature_flag_enabled` filter and deliberately stores no
 * state of its own. Nothing on WordPress.com answered that filter, so a flag
 * could only be flipped by shipping a code change or a sandbox patch.
 *
 * This feature adds the missing control surface, on Simple and Atomic both:
 * a Tools -> Feature Flags screen listing the registered flags with a
 * three-state control each, plus a row for forcing a flag the local registry
 * has never heard of.
 *
 * Two properties are load-bearing:
 *
 * - The *screen* is Automattician-only and fails closed. Without the wpcom
 *   platform primitives that identify an Automattician, nobody sees it.
 * - The *overrides* are site-wide and are NOT re-gated on the Automattician
 *   check. That is the point: an override has to change what the site actually
 *   does, logged-out visitors included, or it cannot be used to test a flag
 *   end to end. It also means an override changes what the site's owner sees,
 *   which is why the screen says so in as many words.
 *
 * Strings here are intentionally not translated. This is internal Automattician
 * tooling, and putting its debug copy in front of GlotPress volunteers would
 * waste their time.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * Option holding the site's flag overrides, as a `flag name => bool` map.
 *
 * Stored non-autoloaded and deleted outright when the last override is removed,
 * so the overwhelming majority of sites — which will never open this screen —
 * carry no row and pay nothing for it.
 */
const WPCOM_FEATURE_FLAGS_OVERRIDES_OPTION = 'wpcom_feature_flag_overrides';

/**
 * Nonce action guarding the override form.
 */
const WPCOM_FEATURE_FLAGS_NONCE_ACTION = 'wpcom-feature-flags-save';

/**
 * Admin page slug.
 */
const WPCOM_FEATURE_FLAGS_PAGE_SLUG = 'wpcom-feature-flags';

/**
 * Capability required on top of the Automattician gate.
 *
 * Overrides change site behaviour, so hold the screen to the same bar as any
 * other site-wide setting rather than leaning on the gate alone.
 */
const WPCOM_FEATURE_FLAGS_CAPABILITY = 'manage_options';

/**
 * Register the hooks this feature needs.
 *
 * @return void
 */
function wpcom_feature_flags_init() {
	add_filter( 'jetpack_feature_flag_enabled', 'wpcom_feature_flags_filter_enabled', 10, 2 );
	add_action( 'admin_menu', 'wpcom_feature_flags_register_admin_page' );
}

/**
 * Whether the current visitor is an Automattician.
 *
 * Mirrors the platform split already used by do_not_track_a11ns() in
 * wpcom-wpadmin-page-view.php: on Simple the platform's own is_automattician()
 * is authoritative, and on Atomic the a8c proxy is what identifies us. Both
 * branches fail closed when their primitive is missing.
 *
 * A support session reaches an Atomic site through the same proxy, but it is a
 * Happiness Engineer acting on the site owner's behalf rather than an
 * Automattician testing unreleased work, so it is excluded.
 *
 * @return bool Whether the current visitor is an Automattician.
 */
function wpcom_feature_flags_is_a11n() {
	if ( ( new Host() )->is_wpcom_simple() ) {
		return function_exists( 'is_automattician' ) && (bool) is_automattician( get_current_user_id() );
	}

	if ( ! Constants::is_true( 'AT_PROXIED_REQUEST' ) ) {
		return false;
	}

	return ! wpcom_feature_flags_is_support_session();
}

/**
 * Whether this request looks like a wpcomsh support session.
 *
 * Guarded with class_exists because the detector ships in wpcomsh, so it only
 * exists on Atomic.
 *
 * @return bool Whether this is probably a support session.
 */
function wpcom_feature_flags_is_support_session() {
	return class_exists( 'WPCOMSH_Support_Session_Detect' )
		&& WPCOMSH_Support_Session_Detect::is_probably_support_session();
}

/**
 * Whether the current user may read and change this site's flag overrides.
 *
 * @return bool Whether the current user may manage flag overrides.
 */
function wpcom_feature_flags_current_user_can_manage() {
	return wpcom_feature_flags_is_a11n() && current_user_can( WPCOM_FEATURE_FLAGS_CAPABILITY );
}

/**
 * Return this site's flag overrides.
 *
 * @return array<string, bool> Map of flag name to forced value.
 */
function wpcom_feature_flags_get_overrides() {
	$stored = get_option( WPCOM_FEATURE_FLAGS_OVERRIDES_OPTION );

	if ( ! is_array( $stored ) ) {
		return array();
	}

	return wpcom_feature_flags_sanitize_overrides( $stored );
}

/**
 * Persist this site's flag overrides, replacing whatever was stored.
 *
 * @param array<string, bool> $overrides Map of flag name to forced value.
 * @return void
 */
function wpcom_feature_flags_save_overrides( array $overrides ) {
	$overrides = wpcom_feature_flags_sanitize_overrides( $overrides );

	if ( empty( $overrides ) ) {
		delete_option( WPCOM_FEATURE_FLAGS_OVERRIDES_OPTION );

		return;
	}

	update_option( WPCOM_FEATURE_FLAGS_OVERRIDES_OPTION, $overrides, false );
}

/**
 * Drop anything from an override map that could not have come from the form.
 *
 * The screen accepts a hand-typed flag name, and the option is read on requests
 * that have nothing to do with the screen, so both directions are sanitized.
 *
 * @param array $overrides Untrusted override map.
 * @return array<string, bool> Sanitized override map, sorted by flag name.
 */
function wpcom_feature_flags_sanitize_overrides( array $overrides ) {
	$sanitized = array();

	foreach ( $overrides as $name => $enabled ) {
		if ( ! is_string( $name ) || ! wpcom_feature_flags_is_valid_flag_name( $name ) ) {
			continue;
		}

		if ( ! is_scalar( $enabled ) ) {
			continue;
		}

		$sanitized[ $name ] = (bool) $enabled;
	}

	ksort( $sanitized );

	return $sanitized;
}

/**
 * Whether a string is shaped like a feature flag name.
 *
 * The same pattern the jetpack-feature-flags package documents and enforces at
 * lint time with the Jetpack.FeatureFlags.FeatureFlagName sniff. Registration
 * does not check it at runtime, so this screen has to.
 *
 * @param string $name Candidate flag name.
 * @return bool Whether the name is valid.
 */
function wpcom_feature_flags_is_valid_flag_name( $name ) {
	return (bool) preg_match( '/^[a-z0-9][a-z0-9_-]*$/', $name );
}

/**
 * Turn the form's three-state controls into an override map.
 *
 * "default" means the absence of an override rather than an override to the
 * flag's current default, so a flag left alone keeps following whatever the
 * code that registered it decides later.
 *
 * @param array $states Map of flag name to 'on', 'off', or 'default'.
 * @return array<string, bool> Override map.
 */
function wpcom_feature_flags_overrides_from_states( array $states ) {
	$overrides = array();

	foreach ( $states as $name => $state ) {
		if ( ! is_string( $name ) || ! is_string( $state ) ) {
			continue;
		}

		if ( 'on' === $state ) {
			$overrides[ $name ] = true;
		} elseif ( 'off' === $state ) {
			$overrides[ $name ] = false;
		}
	}

	return $overrides;
}

/**
 * Answer the feature flag package's resolution filter with this site's overrides.
 *
 * Deliberately not gated on wpcom_feature_flags_is_a11n(): overrides are
 * site-wide, so they have to apply to every visitor, including logged-out ones.
 *
 * @param bool   $enabled Whether the flag is enabled.
 * @param string $name    Flag name.
 * @return bool Whether the flag is enabled.
 */
function wpcom_feature_flags_filter_enabled( $enabled, $name ) {
	$overrides = wpcom_feature_flags_get_overrides();

	if ( ! is_string( $name ) || ! array_key_exists( $name, $overrides ) ) {
		return $enabled;
	}

	return $overrides[ $name ];
}

/**
 * Register the Tools -> Feature Flags screen for Automatticians.
 *
 * @return string|false The resulting page's hook suffix, or false when the
 *                      current user may not manage flag overrides.
 */
function wpcom_feature_flags_register_admin_page() {
	if ( ! wpcom_feature_flags_current_user_can_manage() ) {
		return false;
	}

	return add_submenu_page(
		'tools.php',
		'Feature Flags',
		'Feature Flags',
		WPCOM_FEATURE_FLAGS_CAPABILITY,
		WPCOM_FEATURE_FLAGS_PAGE_SLUG,
		'wpcom_feature_flags_render_admin_page'
	);
}

/**
 * Apply a submitted override form.
 *
 * Re-checks the Automattician gate, the capability, and the nonce: the screen's
 * absence from the menu is not authorization on its own.
 *
 * @param array $request Unslashed request data.
 * @return bool Whether the overrides were saved.
 */
function wpcom_feature_flags_handle_save( array $request ) {
	if ( ! wpcom_feature_flags_current_user_can_manage() ) {
		return false;
	}

	$nonce = isset( $request['_wpnonce'] ) && is_string( $request['_wpnonce'] ) ? $request['_wpnonce'] : '';

	if ( ! wp_verify_nonce( $nonce, WPCOM_FEATURE_FLAGS_NONCE_ACTION ) ) {
		return false;
	}

	$states = isset( $request['flag_state'] ) && is_array( $request['flag_state'] ) ? $request['flag_state'] : array();

	$custom_name = isset( $request['custom_flag_name'] ) && is_string( $request['custom_flag_name'] )
		? strtolower( trim( $request['custom_flag_name'] ) )
		: '';

	if ( '' !== $custom_name ) {
		$states[ $custom_name ] = isset( $request['custom_flag_state'] ) && is_string( $request['custom_flag_state'] )
			? $request['custom_flag_state']
			: 'on';
	}

	wpcom_feature_flags_save_overrides( wpcom_feature_flags_overrides_from_states( $states ) );

	return true;
}

/**
 * Render the Tools -> Feature Flags screen.
 *
 * @return void
 */
function wpcom_feature_flags_render_admin_page() {
	if ( ! wpcom_feature_flags_current_user_can_manage() ) {
		wp_die( 'You do not have permission to manage this site&#8217;s Jetpack feature flags.' );
	}

	$saved = false;

	if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- wpcom_feature_flags_handle_save() verifies the nonce and sanitizes every value it stores.
		$saved = wpcom_feature_flags_handle_save( wp_unslash( $_POST ) );
	}

	require_once __DIR__ . '/admin-page.php';

	wpcom_feature_flags_print_admin_page( $saved );
}
