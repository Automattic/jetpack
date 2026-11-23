<?php
/**
 * Fixture promos, one per placement, for exercising the promo slot in a browser.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

const PROMO_FIXTURE_MODULE_ID = 'jetpack-premium-analytics/promo-fixture';

/**
 * Hooks the fixture registrant onto the promo registration action.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_promo_fixtures() {
	add_action( Promo_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_promo_fixtures' );
}

/**
 * Registers one promo per placement when the `jetpack_premium_analytics_register_promo_fixtures` filter says so.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_promo_fixtures() {
	/**
	 * Filters whether the fixture promos are registered. They show only while the `jetpack-stats-promos` flag is on too.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $register_fixtures Whether to register the fixtures. Default false.
	 */
	if ( ! apply_filters( 'jetpack_premium_analytics_register_promo_fixtures', false ) ) {
		return;
	}

	wp_register_script_module( PROMO_FIXTURE_MODULE_ID, plugins_url( 'promo-fixture-module.js', __FILE__ ), array( '@automattic/jetpack-premium-analytics-sdk' ), '1.0.0' );

	register_promo(
		'fixture/section-footer',
		array(
			'placement'    => 'section-footer',
			'target'       => 'traffic',
			'title'        => 'Fixture section footer promo',
			'description'  => 'Plain copy that Premium Analytics draws itself, with no script module.',
			'cta_label'    => 'Open the fixture',
			'cta_url'      => 'https://jetpack.com/',
			'is_available' => '__return_true',
		)
	);

	register_promo(
		'fixture/options-menu',
		array(
			'placement'    => 'options-menu',
			'cta_label'    => 'Fixture menu item',
			'cta_url'      => 'https://jetpack.com/',
			'dismissible'  => false,
			'is_available' => '__return_true',
		)
	);

	register_promo(
		'fixture/settings',
		array(
			'placement'     => 'settings',
			'title'         => 'Fixture settings promo',
			'description'   => 'Draws its own content through a script module.',
			'cta_label'     => 'Open the fixture',
			'cta_url'       => 'https://jetpack.com/',
			'render_module' => PROMO_FIXTURE_MODULE_ID,
			'is_available'  => '__return_true',
		)
	);
}
