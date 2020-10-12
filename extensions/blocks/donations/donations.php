<?php
/**
 * Donations Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'donations';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
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
	// Keep content as-is if rendered in other contexts than frontend (i.e. feed, emails, API, etc.).
	if ( ! jetpack_is_frontend() ) {
		return $content;
	}

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'thickbox' ) );

	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
	add_thickbox();

	$donations = array();
	foreach (
		array(
			'one-time' => $attr['oneTimeDonation'],
			'monthly'  => $attr['monthlyDonation'],
			'annual'   => $attr['annualDonation'],
		) as $interval => $donation
	) {
		if ( ! $donation['show'] ) {
			continue;
		}
		$donations[ $interval ] = $donation;
	}

	/*
	$tabs = '';
	if ( count( $donations ) > 1 ) {
		$tabs .= '<div className="donations__nav">';
		foreach ( $donations as $interval => $donation ) {
			$tabs .= '<div role="button" tabIndex={ 0 } className="donations__nav-item" data-interval="' . $interval . '">' . $interval . '</div>
		}
		$tabs .= '</div>';
	}
	*/

	foreach ( $donations as $interval => $donation ) {
		if ( ! $donation['show'] ) {
			continue;
		}
		$plan_id = (int) $donation['planId'];
		$plan    = get_post( $plan_id );
		if ( ! $plan || is_wp_error( $plan ) ) {
			continue;
		}

		$url     = \Jetpack_Memberships::get_instance()->get_subscription_url( $plan_id );
		$content = preg_replace( '/(donations__donate-button donations__' . $interval . '-item")/i', '$1 href="' . esc_url( $url ) . '"', $content );
	}

	return $content;
}

/**
 * Determine if AMP should be disabled on posts having Donations blocks.
 *
 * @param bool    $skip Skipped.
 * @param int     $post_id Post ID.
 * @param WP_Post $post Post.
 *
 * @return bool Whether to skip the post from AMP.
 */
function amp_skip_post( $skip, $post_id, $post ) {
	// When AMP is on standard mode, there are no non-AMP posts to link to where the donation can be completed, so let's
	// prevent the post from being available in AMP.
	if ( function_exists( 'amp_is_canonical' ) && \amp_is_canonical() && has_block( 'jetpack/donations', $post->post_content ) ) {
		return true;
	}
	return $skip;
}
add_filter( 'amp_skip_post', __NAMESPACE__ . '\amp_skip_post', 10, 3 );
