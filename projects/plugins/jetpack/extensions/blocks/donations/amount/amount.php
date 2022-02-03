<?php
/**
 * Donations Amount Child Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations_Editable;

use Automattic\Jetpack\Blocks;
use Jetpack_Currencies;
use Jetpack_Gutenberg;
use Jetpack_Memberships;

const DONATIONS_AMOUNT_BLOCK_NAME = 'donations-amount';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_donations_amount_block() {
	Blocks::jetpack_register_block(
		DONATIONS_AMOUNT_BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_amount_block',
		)
	);
}

add_action( 'init', __NAMESPACE__ . '\register_donations_amount_block' );

/**
 * Render callback.
 *
 * @param array $attr Array containing the block attributes.
 *
 * @return string
 */
function render_amount_block( $attr ) {
	jetpack_require_lib( 'class-jetpack-currencies' );

	Jetpack_Gutenberg::load_styles_as_required( DONATIONS_AMOUNT_BLOCK_NAME );

	if ( $attr['disabled'] ) {
		$default_custom_amount = Jetpack_Memberships::SUPPORTED_CURRENCIES[ $attr['currency'] ] * 100;
		return sprintf(
			'<div class="donations__amount donations__custom-amount">
				%1$s
				<div class="donations__amount-value" data-currency="%2$s" data-empty-text="%3$s"></div>
			</div>',
			esc_html( Jetpack_Currencies::CURRENCIES[ $attr['currency'] ]['symbol'] ),
			esc_attr( $attr['currency'] ),
			esc_attr( Jetpack_Currencies::format_price( $default_custom_amount, $attr['currency'], false ) )
		);
	}

	return sprintf(
		'<div class="donations__amount" data-amount="%1$s">%2$s</div>',
		esc_attr( $attr['amount'] ),
		esc_html( Jetpack_Currencies::format_price( $attr['amount'], $attr['currency'] ) )
	);
}
