<?php
/**
 * Donations Block.
 *
 * @since 8.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use Jetpack_Memberships;

require_once __DIR__ . '/donations-view/donations-view.php';
require_once __DIR__ . '/amount/amount.php';
require_once __DIR__ . '/custom-amount/custom-amount.php';

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
			'attributes'      => array(
				'oneTimeDonation' => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'monthlyDonation' => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'annualDonation'  => array(
					'type'    => 'boolean',
					'default' => true,
				),
			),
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

	require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

	// If stripe isn't connected don't show anything to potential donors - they can't actually make a donation.
	if ( ! Jetpack_Memberships::get_connected_account_id() ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'thickbox' ) );
	add_thickbox();

	jetpack_require_lib( 'class-jetpack-currencies' );

	$donations = array(
		array(
			'title'    => __( 'One-Time', 'jetpack' ),
			'class'    => 'donations__one-time-item',
			'interval' => 'one-time',
		),
	);

	if ( $attr['monthlyDonation'] ) {
		$donations[] = array(
			'title'    => __( 'Monthly', 'jetpack' ),
			'class'    => 'donations__monthly-item',
			'interval' => '1 month',
		);
	}

	if ( $attr['annualDonation'] ) {
		$donations[] = array(
			'title'    => __( 'Yearly', 'jetpack' ),
			'class'    => 'donations__annual-item',
			'interval' => '1 year',
		);
	}

	$navigation_items = array_map(
		function ( $donation, $index ) {
			return sprintf(
				'<div role="button" tabindex="%1$u" class="donations__nav-item" data-interval="%2$s">%3$s</div>',
				esc_attr( $index ),
				esc_attr( $donation['interval'] ),
				esc_html( $donation['title'] )
			);
		},
		$donations,
		array_keys( $donations )
	);

	$template = '
<div class="%1$s">
	<div class="donations__container">
		<div class="donations__nav">
			%2$s
		</div>
		<div class="donations__content">
			%3$s
		</div>
	</div>
</div>';

	return sprintf(
		$template,
		esc_attr( Blocks::classes( 'donations', $attr ) ),
		implode( "\n", $navigation_items ),
		$content
	);
}

/**
 * Determine if AMP should be disabled on posts having Donations blocks.
 *
 * @param bool    $skip    Skipped.
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post.
 *
 * @return bool Whether to skip the post from AMP.
 */
function amp_skip_post( $skip, $post_id, $post ) {
	// When AMP is on standard mode, there are no non-AMP posts to link to where the donation can be completed, so let's
	// prevent the post from being available in AMP.
	if ( function_exists( 'amp_is_canonical' ) && \amp_is_canonical() && has_block(
		\Automattic\Jetpack\Extensions\Donations\BLOCK_NAME,
		$post->post_content
	) ) {
		return true;
	}

	return $skip;
}

add_filter( 'amp_skip_post', __NAMESPACE__ . '\amp_skip_post', 10, 3 );
