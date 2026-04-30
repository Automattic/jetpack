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
use Automattic\Jetpack\Status\Request;
use Jetpack_Gutenberg;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
				'plan_check'      => true,
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
	if ( ! Request::is_frontend() ) {
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
			'<div class="wp-block-button donations__donate-button-wrapper %1$s"><a class="wp-block-button__link wp-element-button donations__donate-button %1$s" href="%2$s">%3$s</a></div>',
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

	$instance_id      = wp_unique_id( 'jp-donations-' );
	$instance_classes = $instance_id;
	if ( isset( $attr['tabsAppearance'] ) && 'buttons' === $attr['tabsAppearance'] ) {
		$instance_classes .= ' is-style-buttons';
	}
	$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $instance_classes ) );
	$custom_styles = build_custom_styles( $attr, '.' . $instance_id );

	return sprintf(
		'
<div %1$s>%9$s
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
		$wrapper_attrs,
		$nav,
		$headings,
		$choose_amount_text,
		$amounts,
		$custom_amount,
		$extra_text,
		$buttons,
		$custom_styles ? '<style>' . $custom_styles . '</style>' : ''
	);
}

/**
 * Build a CSS string scoping per-state and tab-level style rules to a single
 * block instance.
 *
 * @param array  $attr  Block attributes.
 * @param string $scope CSS class selector (with leading dot) unique to this instance.
 * @return string CSS rules joined into one string, or '' when no overrides are set.
 */
function build_custom_styles( $attr, $scope ) {
	$tab_padding    = isset( $attr['tabPadding'] ) && is_array( $attr['tabPadding'] ) ? $attr['tabPadding'] : array();
	$button_padding = isset( $attr['buttonPadding'] ) && is_array( $attr['buttonPadding'] ) ? $attr['buttonPadding'] : array();

	$groups = array(
		array(
			'selector'   => $scope . ' .donations__nav-item',
			'properties' => array(
				'font-size'      => $attr['tabFontSize'] ?? '',
				'padding-top'    => $tab_padding['top'] ?? '',
				'padding-right'  => $tab_padding['right'] ?? '',
				'padding-bottom' => $tab_padding['bottom'] ?? '',
				'padding-left'   => $tab_padding['left'] ?? '',
			),
		),
		array(
			'selector'   => $scope . ' .donations__nav-item.is-active',
			'properties' => array(
				'background' => $attr['activeTabBackgroundColor'] ?? '',
				'color'      => $attr['activeTabTextColor'] ?? '',
			),
		),
		array(
			'selector'   => $scope . ' .donations__nav-item:not(.is-active)',
			'properties' => array(
				'background' => $attr['inactiveTabBackgroundColor'] ?? '',
				'color'      => $attr['inactiveTabTextColor'] ?? '',
			),
		),
		array(
			'selector'   => $scope . ' .donations__amount.is-selected',
			'properties' => array(
				'background-color' => $attr['selectedAmountBackgroundColor'] ?? '',
				'color'            => $attr['selectedAmountTextColor'] ?? '',
			),
		),
		array(
			'selector'   => $scope . ' .donations__donate-button',
			'properties' => array(
				'font-size'      => $attr['buttonFontSize'] ?? '',
				'padding-top'    => $button_padding['top'] ?? '',
				'padding-right'  => $button_padding['right'] ?? '',
				'padding-bottom' => $button_padding['bottom'] ?? '',
				'padding-left'   => $button_padding['left'] ?? '',
			),
		),
	);

	$rules = array();
	foreach ( $groups as $group ) {
		$decls = array();
		foreach ( $group['properties'] as $property => $value ) {
			$safe = sanitize_css_value( $value );
			if ( '' !== $safe ) {
				$decls[] = $property . ':' . $safe;
			}
		}
		if ( $decls ) {
			$rules[] = $group['selector'] . '{' . implode( ';', $decls ) . '}';
		}
	}

	// User-set tab border color: applies to the default-style nav bottom
	// divider, the per-tab dividers, and the buttons-style pill borders.
	$tab_border_safe = sanitize_css_value( $attr['tabBorderColor'] ?? '' );
	if ( '' !== $tab_border_safe ) {
		$rules[] = $scope . ' .donations__nav,' . $scope . ' .donations__nav-item{border-color:' . $tab_border_safe . '}';
	}

	$button_alignment = $attr['buttonAlignment'] ?? '';
	if ( in_array( $button_alignment, array( 'left', 'center', 'right' ), true ) ) {
		$rules[] = $scope . ' .donations__donate-button-wrapper{text-align:' . $button_alignment . '}';
	} elseif ( 'full' === $button_alignment ) {
		$rules[] = $scope . ' .donations__donate-button-wrapper{display:block;width:100%}'
			. $scope . ' .donations__donate-button{display:block;width:100%;box-sizing:border-box;text-align:center}';
	}

	return implode( '', $rules );
}

/**
 * Sanitize a user-supplied CSS value (color, length, etc.) for safe inclusion
 * in a <style> element. Strips characters that could break out of the style
 * context (<, >, {, }, ;, quotes, backslash) and caps length, while leaving
 * valid hex / rgb() / hsl() / var() / named-color / px / rem / em values intact.
 *
 * @param mixed $value Raw attribute value.
 * @return string Sanitized value, or '' if rejected.
 */
function sanitize_css_value( $value ) {
	if ( ! is_string( $value ) || '' === $value ) {
		return '';
	}
	$value = trim( $value );
	if ( strlen( $value ) > 100 ) {
		return '';
	}
	if ( preg_match( '/[<>{};\\\\\'"]/', $value ) ) {
		return '';
	}
	return $value;
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
		'var Jetpack_DonationsBlock = ' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
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
