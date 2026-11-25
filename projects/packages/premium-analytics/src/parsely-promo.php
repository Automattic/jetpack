<?php
/**
 * The Upgrade to Parse.ly card on the Stats Settings page.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/promos.php';
require_once __DIR__ . '/parsely-prompts.php';
require_once __DIR__ . '/parsely-signup-url.php';

/**
 * Registers the Upgrade to Parse.ly card.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_parsely_promo() {
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
}
