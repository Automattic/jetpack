<?php
/**
 * Donations Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'donations';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			'plan_check'      => true,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Donations block dynamic rendering.
 *
 * @param array  $attr    Array containing the Donations block attributes.
 * @param string $content String containing the Donations block content.
 *
 * @return string
 */
function render_block( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'thickbox' ) );

	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
	add_thickbox();

	$donations = array(
		'one-time' => $attr['oneTimeDonation'],
		'monthly'  => $attr['monthlyDonation'],
		'annual'   => $attr['annualDonation'],
	);
	foreach ( $donations as $interval => $donation ) {
		if ( ! $donation['show'] ) {
			continue;
		}
		$plan_id = intval( $donation['planId'] );
		$plan    = get_post( $plan_id );
		if ( ! $plan || is_wp_error( $plan ) ) {
			continue;
		}

		$url     = \Jetpack_Memberships::get_instance()->get_subscription_url( $plan_id );
		$content = preg_replace( '/(donations__donate-button donations__' . $interval . '-item")/i', '$1 href="' . esc_url( $url ) . '"', $content );
	}

	return $content;
}
