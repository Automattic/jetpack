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
 * Reads report whether the dashboard is on by any route in, not what the option holds: a sticker
 * we set overrides the opt-in without ever touching it, so reading the option alone would tell a
 * client the dashboard is off while the site is plainly running it. Writes still go to the option,
 * which is why switching a stickered site off reports back that it is still on.
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
	 * Declare the setting, and the filter that answers reads with the effective value.
	 *
	 * Call on `rest_api_init`: core builds the settings route from the registered settings at
	 * priority 99, so anything later would leave the option off the route's write schema. Safe to
	 * call more than once — both hosts may call it, and the callbacks are static, so WordPress
	 * collapses the repeats.
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
				'type'         => 'boolean',
				'default'      => false,
				'show_in_rest' => true,
				'description'  => __( 'Whether the Premium Analytics dashboard is enabled for this site.', 'jetpack-premium-analytics-pkg' ),
			)
		);

		add_filter( 'rest_pre_get_setting', array( __CLASS__, 'report_effective_value' ), 10, 2 );
	}

	/**
	 * Answer reads with whether the dashboard is on, rather than with the stored opt-in.
	 *
	 * Resolved inside the request rather than reused from boot: on WordPress.com Simple the host
	 * settles its gate on `plugins_loaded`, before public-api has switched to the target blog, so
	 * the boot-time answer belongs to the wrong site by the time a REST callback runs.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $value Value to serve for the setting, or null to fall through to the option.
	 * @param string $name  Setting being read.
	 * @return mixed
	 */
	public static function report_effective_value( $value, $name ) {
		if ( self::ENABLED_OPTION !== $name ) {
			return $value;
		}

		/** This filter is documented in projects/plugins/jetpack/class.jetpack.php */
		return (bool) apply_filters(
			'jetpack_premium_analytics_enabled',
			(bool) get_option( self::ENABLED_OPTION )
		);
	}
}
