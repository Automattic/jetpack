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
 * Reads and writes both address the stored opt-in, which is what WPCOM's `/sites/$site/option`
 * and Sync report too. An override such as our rollout sticker turns the dashboard on without
 * touching the opt-in and deliberately does not surface here: whether the dashboard actually
 * booted is `analytics.enabled` in script data.
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
				'type'         => 'boolean',
				'default'      => false,
				'show_in_rest' => true,
				'description'  => __( 'Whether the Premium Analytics dashboard is enabled for this site.', 'jetpack-premium-analytics-pkg' ),
			)
		);
	}
}
