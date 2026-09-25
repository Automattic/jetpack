<?php
/**
 * The Ads section of the Premium Analytics dashboard on the WordPress.com platform.
 *
 * Simple runs no Jetpack plugin, so the module registrant skips the platform and this file decides
 * for both: the plan must include WordAds, and the site must have it on (Atomic: the WordAds module;
 * Simple: the WordAds approval stickers), as classic Stats does.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Register the Ads section on a site whose plan includes WordAds and that has WordAds on, unless
 * another owner already holds the `ads` slug: an older dashboard package still registering the section itself.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_wordads_section( $registry ) {
	if ( ! function_exists( 'wpcom_site_has_feature' ) || ! wpcom_site_has_feature( 'wordads' ) ) {
		return;
	}

	// Classic Stats shows its Ads tab only while WordAds is on, not to every plan that could use it.
	if ( ! wpcom_premium_analytics_wordads_is_enabled() ) {
		return;
	}

	$dashboard_name = \Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

	if ( wpcom_premium_analytics_dashboard_has_section_slug( $registry, $dashboard_name, 'ads' ) ) {
		return;
	}

	\Automattic\Jetpack\PremiumAnalytics\register_dashboard_section(
		$dashboard_name,
		'wordads/ads',
		array(
			'label'               => __( 'Ads', 'jetpack-mu-wpcom' ),
			'title'               => __( 'Ads performance', 'jetpack-mu-wpcom' ),
			'order'               => 50,
			'is_available'        => array( \Automattic\Jetpack\PremiumAnalytics\Capabilities::class, 'current_user_can_view_ad_reports' ),
			// Only the chart supports dates, so it owns the control. No Ads widget
			// supports comparison.
			'date_filter_options' => array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			'default_layout'      => 'Automattic\\Jetpack\\PremiumAnalytics\\get_ads_section_default_layout',
		)
	);
}

/**
 * Whether the site is using WordAds, read as classic Stats in wp-admin reads it: the
 * approval stickers on Simple, the WordAds module on Atomic.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function wpcom_premium_analytics_wordads_is_enabled() {
	if ( ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
		// The stickers the sites API's has_wordads() reads on Simple. Without the
		// stickers API the plan feature alone decides, rather than no site getting the tab.
		return ! function_exists( 'has_any_blog_stickers' )
			|| (bool) has_any_blog_stickers( array( 'wordads-approved', 'wordads-approved-misfits' ), get_current_blog_id() );
	}

	// Atomic runs the Jetpack plugin, where Odyssey Stats reads the WordAds module. Not
	// `available_only`: the module list is not loaded on every request that hydrates the registry.
	return ( new \Automattic\Jetpack\Modules() )->is_active( 'wordads', false );
}

/**
 * Whether a section with the slug is registered on the dashboard.
 *
 * Reads the registry through the slug lookup when the package offers it, and through the full
 * list otherwise: the package and this file ship on different cadences.
 *
 * @since $$next-version$$
 *
 * @param object $registry       The registry being hydrated.
 * @param string $dashboard_name Dashboard identifier.
 * @param string $slug           Section slug.
 * @return bool
 */
function wpcom_premium_analytics_dashboard_has_section_slug( $registry, $dashboard_name, $slug ) {
	if ( method_exists( $registry, 'get_registered_by_slug' ) ) {
		return null !== $registry->get_registered_by_slug( $dashboard_name, $slug );
	}

	foreach ( $registry->get_all_registered( $dashboard_name ) as $section ) {
		if ( $section->slug === $slug ) {
			return true;
		}
	}

	return false;
}

// After the package's own sections (priority 10), so an existing `ads` slug is found and left alone.
add_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section', 20 );
