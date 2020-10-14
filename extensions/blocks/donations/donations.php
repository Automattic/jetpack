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

	$donations = array(
		'one-time' => array_merge(
			array(
				'title' => __( 'One-Time', 'jetpack' ),
				'class' => 'donations__one-time-item',
			),
			$attr['oneTimeDonation']
		),
	);
	if ( $attr['monthlyDonation']['show'] ) {
		$donations['1 month'] = array_merge(
			array(
				'title' => __( 'Monthly', 'jetpack' ),
				'class' => 'donations__monthly-item',
			),
			$attr['monthlyDonation']
		);
	}
	if ( $attr['annualDonation']['show'] ) {
		$donations['1 year'] = array_merge(
			array(
				'title' => __( 'Yearly', 'jetpack' ),
				'class' => 'donations__annual-item',
			),
			$attr['annualDonation']
		);
	}

	$currency = $attr['currency'];

	$classes = 'wp-block-jetpack-donations';
	if ( ! empty( $attr['className'] ) ) {
		$classes .= ' ' . $attr['className'];
	}

	$nav        = '';
	$headings   = '';
	$amounts    = '';
	$extra_text = '';
	$buttons    = '';
	foreach ( $donations as $interval => $donation ) {
		$plan_id = intval( $donation['planId'] );
		$plan    = get_post( $plan_id );
		if ( ! $plan || is_wp_error( $plan ) ) {
			continue;
		}

		if ( count( $donations ) > 1 ) {
			if ( ! $nav ) {
				$nav .= '<div class="donations__nav">';
			}
			$nav .= sprintf(
				'<div role="button" tabindex="0" class="donations__nav-item" data-interval="%1$s">%2$s</div>',
				esc_attr( $interval ),
				$donation['title']
			);
		}
		$headings .= sprintf(
			'<h4 class="%1$s">%2$s</h4>',
			esc_attr( $donation['class'] ),
			$donation['heading']
		);
		$amounts  .= sprintf(
			'<div class="donations__amounts %s">',
			esc_attr( $donation['class'] )
		);
		foreach ( $donation['amounts'] as $amount ) {
			$amounts .= sprintf(
				'<div class="donations__amount" data-amount="%1$s" data-currency="%2$s">%3$s%4$s</div>',
				esc_attr( $amount ),
				esc_attr( $currency ),
				$currency,
				$amount
			);
		}
		$amounts    .= '</div>';
		$extra_text .= sprintf(
			'<p class="%1$s">%2$s</p>',
			esc_attr( $donation['class'] ),
			$donation['extraText']
		);
		$buttons    .= sprintf(
			'<a class="wp-block-button__link donations__donate-button %1$s" href="%2$s">%3$s</a>',
			esc_attr( $donation['class'] ),
			\Jetpack_Memberships::get_instance()->get_subscription_url( $plan_id ),
			$donation['buttonText']
		);
	}
	if ( $nav ) {
		$nav .= '</div>';
	}

	$custom_amount = '';
	if ( $attr['showCustomAmount'] ) {
		$custom_amount .= sprintf(
			'<p>%s</div>',
			$attr['customAmountText']
		);
		$custom_amount .= sprintf(
			'<div class="donations__amount donations__custom-amount">
				%1$s
				<div class="donations__amount-value" data-currency="%2$s"></div>
			</div>',
			$attr['currency'],
			$attr['currency']
		);
	}

	return sprintf(
		'
<div class="%1$s">
	<div className="donations__container">
	%2$s
	<div className="donations__content">
		<div className="donations__tab">
			%3$s
			<p>%4$s</p>
			%5$s
			%6$s
			<hr className="donations__separator">
			%7$s
			%8$s
		</div>
	</div>
</div>
',
		esc_attr( $classes ),
		$nav,
		$headings,
		$attr['chooseAmountText'],
		$amounts,
		$custom_amount,
		$extra_text,
		$buttons
	);
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
