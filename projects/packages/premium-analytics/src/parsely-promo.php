<?php
/**
 * The Upgrade to Parse.ly prompts in the Stats dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/promos.php';
require_once __DIR__ . '/parsely-prompts.php';
require_once __DIR__ . '/parsely-signup-url.php';

/**
 * Arranges for the Upgrade to Parse.ly prompts to be registered.
 *
 * Their copy is translated, and the package boots on `plugins_loaded`, before the textdomain
 * can load. The script data filter that publishes the promos runs later than `init`, so waiting
 * costs them nothing.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_parsely_promos() {
	if ( did_action( 'init' ) ) {
		register_parsely_promos();

		return;
	}

	add_action( 'init', __NAMESPACE__ . '\\register_parsely_promos' );
}

/**
 * Registers the Upgrade to Parse.ly prompts.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_parsely_promos() {
	register_promo(
		'parsely/settings-upgrade',
		array(
			'placement'    => 'settings',
			'title'        => __( 'Parse.ly', 'jetpack-premium-analytics-pkg' ),
			'description'  => __( 'Grow with Parse.ly, the favorite analytics provider for professional brands and media companies. See which stories hold attention, where readers came from, and what they read next, in real time.', 'jetpack-premium-analytics-pkg' ),
			'cta_label'    => __( 'Upgrade to Parse.ly', 'jetpack-premium-analytics-pkg' ),
			'cta_url'      => parsely_signup_url(),
			'cta_variant'  => 'secondary',
			'dismissible'  => false,
			'is_available' => __NAMESPACE__ . '\\offers_parsely_prompts',
		)
	);

	register_promo(
		'parsely/menu-upgrade',
		array(
			'placement'    => 'options-menu',
			'cta_label'    => __( 'Upgrade to Parse.ly', 'jetpack-premium-analytics-pkg' ),
			'cta_url'      => parsely_signup_url(),
			'dismissible'  => false,
			'is_available' => __NAMESPACE__ . '\\offers_parsely_prompts',
		)
	);
}
