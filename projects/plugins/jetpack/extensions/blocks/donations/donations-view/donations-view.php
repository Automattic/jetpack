<?php
/**
 * Donations View Child Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations_Editable;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use Jetpack_Memberships;

const DONATIONS_VIEW_BLOCK_NAME = 'donations-view';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_donations_view_block() {
	Blocks::jetpack_register_block(
		DONATIONS_VIEW_BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_donations_view_block',
			'plan_check'      => false,
		)
	);
}

add_action( 'init', __NAMESPACE__ . '\register_donations_view_block' );

/**
 * Render callback.
 *
 * @param array  $attr Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_donations_view_block( $attr, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( DONATIONS_VIEW_BLOCK_NAME );

	require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

	// If stripe isn't connected don't show anything to potential donors - they can't actually make a donation.
	if ( ! Jetpack_Memberships::get_connected_account_id() ) {
		return '';
	}

	// If we don't have a plan id we don't display the donation view.
	if ( ! $attr['planId'] || $attr['planId'] < 0 ) {
		return '';
	}

	$donation_url = esc_url( Jetpack_Memberships::get_instance()->get_subscription_url( $attr['planId'] ) );

	return preg_replace( '/(donations__donate-button.*><a\b[^><]*)>/i', '$1 href="' . esc_url( $donation_url ) . '">', $content );
}
