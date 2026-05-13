<?php
/**
 * Action hooks for the Jetpack PayPal Payments package.
 *
 * The package is loaded by both the standalone PayPal Payment Buttons
 * plugin and the Jetpack plugin. Registering the WP Abilities API surface
 * here ensures the abilities are visible from both contexts without each
 * consumer needing to wire them up separately.
 *
 * Registration is gated by the `jetpack_wp_abilities_enabled` filter
 * inside `Registrar::init()` (default false), so this call is safe to
 * make unconditionally while rollout stays opt-in per site.
 *
 * @package automattic/jetpack-paypal-payments
 */

use Automattic\Jetpack\PayPal_Payments\Abilities\PayPal_Payments_Abilities;

if ( function_exists( 'add_action' ) ) {
	add_action(
		'init',
		array( PayPal_Payments_Abilities::class, 'init' ),
		20
	);
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['init'][20][] = array(
		'accepted_args' => 0,
		'function'      => array( PayPal_Payments_Abilities::class, 'init' ),
	);
}
