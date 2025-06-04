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
use WP_Post;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {

	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
	if ( \Jetpack_Memberships::should_enable_monetize_blocks_in_editor() ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => __NAMESPACE__ . '\render_block',
			)
		);
	}
	// Add a meta field to the user to track if the donation warning has been dismissed.
	\register_meta(
		'user',
		'jetpack_donation_warning_dismissed',
		array(
			'type'         => 'boolean',
			'single'       => true,
			'show_in_rest' => true,
			'default'      => false,
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
		$parsed = parse_blocks( $content );
		if ( ! empty( $parsed[0] ) ) {
			// Inject the link of the current post from the server side as the fallback link to make sure the donations block
			// points to the correct post when it's inserted from the synced pattern (aka “My Pattern”).
			$post_link                             = get_permalink();
			$parsed[0]['attrs']['fallbackLinkUrl'] = $post_link;
			$content                               = \render_block( $parsed[0] );
			if ( preg_match( '/<a\s+class="jetpack-donations-fallback-link"\s+href="([^"]*)"/', $content, $matches ) ) {
				$content = str_replace( $matches[1], $post_link, $content );
			}
		}

		return $content;
	}

	require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

	// If stripe isn't connected don't show anything to potential donors - they can't actually make a donation.
	if ( ! \Jetpack_Memberships::has_connected_account() ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-currencies.php';

	$default_texts = get_default_texts();

	$donations = array(
		'one-time' => array_merge(
			array(
				'planId'     => null,
				'title'      => __( 'One-Time', 'jetpack' ),
				'class'      => 'donations__one-time-item',
				'heading'    => $default_texts['oneTimeDonation']['heading'],
				'buttonText' => $default_texts['oneTimeDonation']['buttonText'],
			),
			$attr['oneTimeDonation']
		),
	);
	if ( $attr['monthlyDonation']['show'] ) {
		$donations['1 month'] = array_merge(
			array(
				'planId'     => null,
				'title'      => __( 'Monthly', 'jetpack' ),
				'class'      => 'donations__monthly-item',
				'heading'    => $default_texts['monthlyDonation']['heading'],
				'buttonText' => $default_texts['monthlyDonation']['buttonText'],
			),
			$attr['monthlyDonation']
		);
	}
	if ( $attr['annualDonation']['show'] ) {
		$donations['1 year'] = array_merge(
			array(
				'planId'     => null,
				'title'      => __( 'Yearly', 'jetpack' ),
				'class'      => 'donations__annual-item',
				'heading'    => $default_texts['annualDonation']['heading'],
				'buttonText' => $default_texts['annualDonation']['buttonText'],
			),
			$attr['annualDonation']
		);
	}

	$choose_amount_text = isset( $attr['chooseAmountText'] ) && ! empty( $attr['chooseAmountText'] ) ? $attr['chooseAmountText'] : $default_texts['chooseAmountText'];
	$custom_amount_text = isset( $attr['customAmountText'] ) && ! empty( $attr['customAmountText'] ) ? $attr['customAmountText'] : $default_texts['customAmountText'];
	$currency           = $attr['currency'];
	$nav                = '';
	$headings           = '';
	$amounts            = '';
	$extra_text         = '';
	$buttons            = '';
	foreach ( $donations as $interval => $donation ) {
		$plan_id = (int) $donation['planId'];
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
				esc_html( $donation['title'] )
			);
		}
		$headings .= sprintf(
			'<h4 class="%1$s">%2$s</h4>',
			esc_attr( $donation['class'] ),
			wp_kses_post( $donation['heading'] )
		);
		$amounts  .= sprintf(
			'<div class="donations__amounts %s">',
			esc_attr( $donation['class'] )
		);
		foreach ( $donation['amounts'] as $amount ) {
			$amounts .= sprintf(
				'<div class="donations__amount" data-amount="%1$s">%2$s</div>',
				esc_attr( $amount ),
				esc_html( \Jetpack_Currencies::format_price( $amount, $currency ) )
			);
		}
		$amounts    .= '</div>';
		$extra_text .= sprintf(
			'<p class="%1$s">%2$s</p>',
			esc_attr( $donation['class'] ),
			wp_kses_post( $donation['extraText'] ?? $default_texts['extraText'] )
		);
		$buttons    .= sprintf(
			'<a class="wp-block-button__link donations__donate-button %1$s" href="%2$s">%3$s</a>',
			esc_attr( $donation['class'] ),
			esc_url( \Jetpack_Memberships::get_instance()->get_subscription_url( $plan_id ) ),
			wp_kses_post( $donation['buttonText'] )
		);
	}
	if ( $nav ) {
		$nav .= '</div>';
	}

	$custom_amount = '';
	if ( $attr['showCustomAmount'] ) {
		$custom_amount        .= sprintf(
			'<p>%s</p>',
			wp_kses_post( $custom_amount_text )
		);
		$default_custom_amount = ( \Jetpack_Memberships::SUPPORTED_CURRENCIES[ $currency ] ?? 1 ) * 100;
		$custom_amount        .= sprintf(
			'<div class="donations__amount donations__custom-amount">
				%1$s
				<div class="donations__amount-value" data-currency="%2$s" data-empty-text="%3$s"></div>
			</div>',
			esc_html( \Jetpack_Currencies::CURRENCIES[ $currency ]['symbol'] ?? '¤' ),
			esc_attr( $currency ),
			esc_attr( \Jetpack_Currencies::format_price( $default_custom_amount, $currency, false ) )
		);
	}

	return sprintf(
		'
<div class="%1$s">
	<div class="donations__container">
		%2$s
		<div class="donations__content">
			<div class="donations__tab">
				%3$s
				<p>%4$s</p>
				%5$s
				%6$s
				<hr class="donations__separator">
				%7$s
				%8$s
			</div>
		</div>
	</div>
</div>
',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$nav,
		$headings,
		$choose_amount_text,
		$amounts,
		$custom_amount,
		$extra_text,
		$buttons
	);
}

/**
 * Get the default texts for the block.
 *
 * @return array
 */
function get_default_texts() {
	return array(
		'chooseAmountText' => __( 'Choose an amount', 'jetpack' ),
		'customAmountText' => __( 'Or enter a custom amount', 'jetpack' ),
		'extraText'        => __( 'Your contribution is appreciated.', 'jetpack' ),
		'oneTimeDonation'  => array(
			'heading'    => __( 'Make a one-time donation', 'jetpack' ),
			'buttonText' => __( 'Donate', 'jetpack' ),
		),
		'monthlyDonation'  => array(
			'heading'    => __( 'Make a monthly donation', 'jetpack' ),
			'buttonText' => __( 'Donate monthly', 'jetpack' ),
		),
		'annualDonation'   => array(
			'heading'    => __( 'Make a yearly donation', 'jetpack' ),
			'buttonText' => __( 'Donate yearly', 'jetpack' ),
		),
	);
}

/**
 * Make default texts available to the editor.
 */
function load_editor_scripts() {
	// Only relevant to the editor right now.
	if ( ! is_admin() ) {
		return;
	}

	$data = array(
		'defaultTexts' => get_default_texts(),
	);

	wp_add_inline_script(
		'jetpack-blocks-editor',
		'var Jetpack_DonationsBlock = ' . wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\load_editor_scripts', 11 );

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
	if ( function_exists( 'amp_is_canonical' ) && \amp_is_canonical() && has_block( Blocks::get_block_name( __DIR__ ), $post->post_content ) ) {
		return true;
	}
	return $skip;
}
add_filter( 'amp_skip_post', __NAMESPACE__ . '\amp_skip_post', 10, 3 );
