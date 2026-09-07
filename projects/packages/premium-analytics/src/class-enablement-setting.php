<?php
/**
 * Public entry point for hosts that expose the dashboard's opt-in setting.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Exposes the site's dashboard opt-in through core's `wp/v2/settings` route.
 *
 * This is the one thing the package has to serve while the dashboard is switched off, so hosts
 * register it outside their enablement checks. Everything else lives behind
 * {@see Dashboard_Support_Routes}, which only boots once the dashboard is already on.
 *
 * Reads and writes both address the stored opt-in, so this route reports the same value as any
 * other reader of the option. An override such as our rollout sticker turns the dashboard on
 * without touching the opt-in and deliberately does not surface here: whether the dashboard
 * actually booted is `analytics.enabled` in script data.
 *
 * Writing cannot take effect in the request that writes it: Jetpack resolves the flag once, on
 * `plugins_loaded`. Clients are expected to reload.
 *
 * @since $$next-version$$
 */
class Enablement_Setting {

	/**
	 * Site option holding the customer's own opt-in to the dashboard.
	 *
	 * Lives here rather than on {@see Analytics} so that registering the setting does not pull the
	 * whole dashboard class in behind it: this runs on REST requests of every kind, including ones
	 * with the dashboard switched off. Jetpack::is_premium_analytics_enabled() spells the name a
	 * third time, since it has to answer before this package is known to be loadable at all.
	 *
	 * @since $$next-version$$
	 */
	const ENABLED_OPTION = 'jetpack_premium_analytics_enabled';

	/**
	 * Preferences scope the dashboard stores its per-user state under. Mirrors
	 * `routes/dashboard/hooks/constants.ts`.
	 *
	 * @since $$next-version$$
	 */
	const PREFERENCES_SCOPE = 'jetpack-premium-analytics/dashboard';

	/**
	 * Preferences key the dashboard sets once a reader has been through the onboarding. Mirrors
	 * `routes/dashboard/hooks/constants.ts`.
	 *
	 * @since $$next-version$$
	 */
	const ONBOARDING_KEY = 'onboardingCompletedAt';

	/**
	 * Declare the setting so core's settings route exposes it.
	 *
	 * Call on `rest_api_init`: core builds the settings route from the registered settings at
	 * priority 99, so anything later would leave the option off the route's write schema. Both
	 * hosts may call this; a repeat call re-declares the same setting and is harmless.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function register() {
		register_setting(
			'general',
			self::ENABLED_OPTION,
			array(
				'type'              => 'boolean',
				'default'           => false,
				'show_in_rest'      => true,
				'sanitize_callback' => array( __CLASS__, 'sanitize_enabled' ),
				'description'       => __( 'Whether the Premium Analytics dashboard is enabled for this site.', 'jetpack-premium-analytics-pkg' ),
			)
		);
		add_action( 'update_option_' . self::ENABLED_OPTION, array( __CLASS__, 'reset_onboarding_on_reactivation' ), 10, 2 );
	}

	/**
	 * Store the opt-in as 0 or 1.
	 *
	 * Without this, switching the dashboard off stores `''`: core's settings controller hands
	 * `update_option()` a bare `false`, which reaches the options table as an empty string. The
	 * REST schema does not accept that as a boolean, so the next read reports `null` rather than
	 * `false`, and a later `null` write answers 500 `rest_invalid_stored_value`.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $value Value being written.
	 * @return int
	 */
	public static function sanitize_enabled( $value ) {
		return (int) rest_sanitize_boolean( $value );
	}

	/**
	 * Forget that the reader switching the dashboard back on has seen the onboarding.
	 *
	 * Someone who switched off and came back gets the tour again; a first activation, a
	 * switch-off, and everyone else's preference are left alone. Riding on the option write means
	 * only writes made while the setting is registered count, which is every product path: the
	 * classic Stats banner and menu, and the dashboard's own switch-off, all go through REST.
	 *
	 * The preference lives in core's persisted preferences user meta, whose client-side layer
	 * keeps a localStorage copy and takes whichever is newer, so `_modified` moves with the change.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $old_value Previous option value.
	 * @param mixed $value     New option value.
	 * @return void
	 */
	public static function reset_onboarding_on_reactivation( $old_value, $value ) {
		if ( (bool) $old_value || ! (bool) $value ) {
			return;
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return;
		}

		global $wpdb;
		$meta_key    = $wpdb->get_blog_prefix() . 'persisted_preferences';
		$preferences = get_user_meta( $user_id, $meta_key, true );

		if ( ! is_array( $preferences ) || ! isset( $preferences[ self::PREFERENCES_SCOPE ][ self::ONBOARDING_KEY ] ) ) {
			return;
		}

		unset( $preferences[ self::PREFERENCES_SCOPE ][ self::ONBOARDING_KEY ] );
		$preferences['_modified'] = gmdate( 'Y-m-d\TH:i:s\Z' );

		update_user_meta( $user_id, $meta_key, $preferences );
	}
}
