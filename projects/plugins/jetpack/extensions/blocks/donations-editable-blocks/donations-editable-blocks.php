<?php
/**
 * New donations Block.
 *
 * @since   8.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations_Editable;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use Jetpack_Memberships;
use const Automattic\Jetpack\Extensions\Donations\FEATURE_NAME;

require_once __DIR__ . '/donations-view/donations-view.php';
require_once __DIR__ . '/amount/amount.php';

const BLOCK_NAME = 'donations-editable-blocks';
/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block( BLOCK_NAME );
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
		'oneTimeDonation' => array(
			'title'    => __( 'One-Time', 'jetpack' ),
			'class'    => 'donations__one-time-item',
			'interval' => 'one-time',
		),
		'monthlyDonation' => array(
			'title'    => __( 'Monthly', 'jetpack' ),
			'class'    => 'donations__monthly-item',
			'interval' => '1 month',
		),
		'annualDonation'  => array(
			'title'    => __( 'Yearly', 'jetpack' ),
			'class'    => 'donations__annual-item',
			'interval' => '1 year',
		),
	);

	$keys             = array_keys( $attr );
	$navigation_items = array_map(
		function ( $attribute, $index ) use ( $donations ) {
			return sprintf(
				'<div role="button" tabindex="%1$u" class="donations__nav-item" data-interval="%2$s">%3$s</div>',
				esc_attr( $index ),
				esc_attr( $donations[ $attribute ]['interval'] ),
				esc_html( $donations[ $attribute ]['title'] )
			);
		},
		$keys,
		array_keys( $keys )
	);

	$template = '
<div class="%1$s">
	<div class="donations__container">
		%2$s
		<div class="donations__content">
			%3$s
		</div>
	</div>
</div>';

	return sprintf(
		$template,
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$navigation_items
	);
}
