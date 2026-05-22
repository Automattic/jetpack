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
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Request;
use Automattic\Jetpack\Tracking;
use Jetpack;
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

	// `array_merge` lets the user-supplied attributes override only the keys
	// they actually set. Undefined keys (new blocks that have never been
	// edited) fall back to the defaults in the first array. User-cleared
	// keys (empty strings explicitly saved) win over defaults, so
	// "blank stays blank" and "never set" gets the default.
	// Treat `show !== false` as on, so legacy blocks (where `show` was never
	// set on oneTimeDonation) still render the one-time interval by default.
	$donations = array();
	if ( false !== ( $attr['oneTimeDonation']['show'] ?? true ) ) {
		$donations['one-time'] = array_merge(
			array(
				'planId'     => null,
				'title'      => __( 'One-Time', 'jetpack' ),
				'class'      => 'donations__one-time-item',
				'heading'    => $default_texts['oneTimeDonation']['heading'],
				'buttonText' => $default_texts['oneTimeDonation']['buttonText'],
			),
			$attr['oneTimeDonation']
		);
	}
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

	$choose_amount_text = $attr['chooseAmountText'] ?? $default_texts['chooseAmountText'];
	$custom_amount_text = $attr['customAmountText'] ?? $default_texts['customAmountText'];
	$currency           = $attr['currency'];

	// Drop intervals whose plan no longer resolves so we can compute the active tab
	// against the actually-rendered set, not the configured set.
	$valid_donations = array();
	foreach ( $donations as $interval => $donation ) {
		$plan = get_post( (int) $donation['planId'] );
		if ( $plan && ! is_wp_error( $plan ) ) {
			$valid_donations[ $interval ] = $donation;
		}
	}
	$donations          = $valid_donations;
	$rendered_intervals = array_keys( $donations );

	// Effective default = configured defaultInterval if it survived plan validation,
	// otherwise the first rendered interval (one-time → monthly → annual).
	$default_interval = $attr['defaultInterval'] ?? null;
	if ( ! in_array( $default_interval, $rendered_intervals, true ) ) {
		$default_interval = $rendered_intervals[0] ?? null;
	}
	$tab_content_class_map = array(
		'one-time' => 'is-one-time',
		'1 month'  => 'is-monthly',
		'1 year'   => 'is-annual',
	);
	$tab_content_class     = $default_interval ? $tab_content_class_map[ $default_interval ] : '';

	$nav        = '';
	$headings   = '';
	$amounts    = '';
	$extra_text = '';
	$buttons    = '';
	foreach ( $donations as $interval => $donation ) {
		$plan_id = (int) $donation['planId'];

		if ( count( $donations ) > 1 ) {
			if ( ! $nav ) {
				$nav .= '<div class="donations__nav">';
			}
			$is_active_class = $interval === $default_interval ? ' is-active' : '';
			$nav            .= sprintf(
				'<div role="button" tabindex="0" class="donations__nav-item%3$s" data-interval="%1$s">%2$s</div>',
				esc_attr( $interval ),
				esc_html( $donation['title'] ),
				esc_attr( $is_active_class )
			);
		}
		$heading_text = wp_kses_post( $donation['heading'] ?? '' );
		if ( '' !== trim( $heading_text ) ) {
			$headings .= sprintf(
				'<h4 class="%1$s">%2$s</h4>',
				esc_attr( $donation['class'] ),
				$heading_text
			);
		}
		$default_index_attr = '';
		if ( isset( $donation['defaultAmountIndex'] ) && is_numeric( $donation['defaultAmountIndex'] ) ) {
			$default_index_attr = sprintf( ' data-default-index="%d"', (int) $donation['defaultAmountIndex'] );
		}
		$amounts .= sprintf(
			'<div class="donations__amounts %s"%s>',
			esc_attr( $donation['class'] ),
			$default_index_attr
		);
		foreach ( $donation['amounts'] as $amount ) {
			$amounts .= sprintf(
				'<div class="donations__amount" data-amount="%1$s">%2$s</div>',
				esc_attr( $amount ),
				esc_html( \Jetpack_Currencies::format_price( $amount, $currency ) )
			);
		}
		$amounts        .= '</div>';
		$extra_text_html = wp_kses_post( $donation['extraText'] ?? $default_texts['extraText'] );
		if ( '' !== trim( $extra_text_html ) ) {
			$extra_text .= sprintf(
				'<p class="%1$s">%2$s</p>',
				esc_attr( $donation['class'] ),
				$extra_text_html
			);
		}
		$buttons .= sprintf(
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
		$custom_amount_html = wp_kses_post( $custom_amount_text );
		if ( '' !== trim( $custom_amount_html ) ) {
			$custom_amount .= sprintf( '<p>%s</p>', $custom_amount_html );
		}
		$default_custom_amount = $attr['customAmountPlaceholder']
			?? ( \Jetpack_Memberships::SUPPORTED_CURRENCIES[ $currency ] ?? 1 ) * 100;
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
	$wrapper_attr_array = array( 'class' => $instance_classes );
	if ( $default_interval ) {
		$wrapper_attr_array['data-default-interval'] = $default_interval;
	}
	$wrapper_attr_array = array_merge( $wrapper_attr_array, build_security_data_attrs( $attr, $currency ) );
	$wrapper_attrs      = get_block_wrapper_attributes( $wrapper_attr_array );
	$custom_styles      = build_custom_styles( $attr, '.' . $instance_id );

	$choose_amount_html  = wp_kses_post( $choose_amount_text );
	$choose_amount_block = '' !== trim( $choose_amount_html ) ? '<p>' . $choose_amount_html . '</p>' : '';

	return sprintf(
		'
<div %1$s>%9$s
	<div class="donations__container">
		%2$s
		<div class="donations__content">
			<div class="donations__tab %10$s">
				%3$s
				%4$s
				%5$s
				%6$s
				<div class="donations__range-error"></div>
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
		$choose_amount_block,
		$amounts,
		$custom_amount,
		$extra_text,
		$buttons,
		$custom_styles ? '<style>' . $custom_styles . '</style>' : '',
		esc_attr( $tab_content_class )
	);
}

/**
 * Build data-attributes array for security (min/max amount) constraints.
 *
 * Extracted so it can be tested independently of the full render pipeline.
 *
 * @since 15.9
 *
 * @param array  $attr     Block attributes.
 * @param string $currency Currency code (e.g. 'USD').
 * @return array Associative array of data-attribute name => value.
 */
function build_security_data_attrs( $attr, $currency ) {
	$attrs      = array();
	$min_amount = isset( $attr['minimumAmount'] ) ? (float) $attr['minimumAmount'] : null;
	$max_amount = isset( $attr['maximumAmount'] ) ? (float) $attr['maximumAmount'] : null;
	if ( null !== $min_amount ) {
		$attrs['data-min-amount'] = $min_amount;
		$attrs['data-min-error']  = sprintf(
			/* translators: %s: minimum donation amount formatted with currency symbol */
			__( 'The minimum donation amount is %s.', 'jetpack' ),
			\Jetpack_Currencies::format_price( (string) $min_amount, $currency )
		);
	}
	if ( null !== $max_amount ) {
		$attrs['data-max-amount'] = $max_amount;
		$attrs['data-max-error']  = sprintf(
			/* translators: %s: maximum donation amount formatted with currency symbol */
			__( 'The maximum donation amount is %s.', 'jetpack' ),
			\Jetpack_Currencies::format_price( (string) $max_amount, $currency )
		);
	}
	$stripe_min                     = \Jetpack_Memberships::SUPPORTED_CURRENCIES[ $currency ] ?? 1;
	$attrs['data-stripe-min-error'] = sprintf(
		/* translators: %s: payment processor minimum donation amount formatted with currency symbol */
		_x( 'The minimum donation amount is %s.', 'payment processor minimum', 'jetpack' ),
		\Jetpack_Currencies::format_price( (string) $stripe_min, $currency )
	);
	return $attrs;
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
			'selector'   => $scope . ' .donations__amount.is-selected',
			'properties' => array(
				// Override only the outer ring color; the inner 1px white separator stays put.
				'box-shadow' => isset( $attr['selectedAmountOutlineColor'] ) && '' !== $attr['selectedAmountOutlineColor']
					? '0 0 0 1px #fff,0 0 0 3px ' . $attr['selectedAmountOutlineColor']
					: '',
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

	$content_alignment = $attr['contentAlignment'] ?? '';
	if ( in_array( $content_alignment, array( 'left', 'center', 'right' ), true ) ) {
		$rules[]     = $scope . ' .donations__content{text-align:' . $content_alignment . '}';
		$justify_map = array(
			'left'   => 'flex-start',
			'center' => 'center',
			'right'  => 'flex-end',
		);
		$rules[]     = $scope . ' .donations__amounts{justify-content:' . $justify_map[ $content_alignment ] . '}';
	}

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
		$rules[] = $scope . ' .donations__nav,' . $scope . ' .donations__nav-item,' . $scope . ' .donations__nav-item.is-active{border-color:' . $tab_border_safe . '}';
	}

	$button_radius_decls = build_radius_decls( $attr['buttonBorderRadius'] ?? null );
	if ( $button_radius_decls ) {
		$rules[] = $scope . ' .donations__donate-button{' . implode( ';', $button_radius_decls ) . '}';
	}

	// User-set amount tile font size, border (BorderBoxControl shape) and
	// border radius (BorderRadiusControl shape). Applies to all amount tiles
	// (preset + custom); selected-state colors above only kick in when an
	// amount has the is-selected class.
	$amount_decls = array();
	$amount_font  = sanitize_css_value( $attr['amountFontSize'] ?? '' );
	if ( '' !== $amount_font ) {
		$amount_decls[] = 'font-size:' . $amount_font;
	}
	$amount_decls = array_merge( $amount_decls, build_border_decls( $attr['amountBorder'] ?? null ) );
	$amount_decls = array_merge( $amount_decls, build_radius_decls( $attr['amountBorderRadius'] ?? null ) );
	if ( $amount_decls ) {
		$rules[] = $scope . ' .donations__amount{' . implode( ';', $amount_decls ) . '}';
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
 * Convert a uniform-or-split BorderBoxControl value into individual CSS declarations.
 * Uniform shape: { color, style, width }. Split shape: { top: {...}, right: ..., etc. }.
 *
 * @param mixed $border BorderBoxControl value (or null).
 * @return array List of CSS declaration strings (e.g. "border-color:#abc"), already sanitized.
 */
function build_border_decls( $border ) {
	if ( ! is_array( $border ) ) {
		return array();
	}
	$decls    = array();
	$sides    = array( 'top', 'right', 'bottom', 'left' );
	$is_split = false;
	foreach ( $sides as $side ) {
		if ( isset( $border[ $side ] ) ) {
			$is_split = true;
			break;
		}
	}
	if ( $is_split ) {
		foreach ( $sides as $side ) {
			$sb = $border[ $side ] ?? null;
			if ( ! is_array( $sb ) ) {
				continue;
			}
			foreach ( array( 'color', 'style', 'width' ) as $prop ) {
				$safe = sanitize_css_value( $sb[ $prop ] ?? '' );
				if ( '' !== $safe ) {
					$decls[] = 'border-' . $side . '-' . $prop . ':' . $safe;
				}
			}
		}
	} else {
		foreach ( array( 'color', 'style', 'width' ) as $prop ) {
			$safe = sanitize_css_value( $border[ $prop ] ?? '' );
			if ( '' !== $safe ) {
				$decls[] = 'border-' . $prop . ':' . $safe;
			}
		}
	}
	return $decls;
}

/**
 * Convert a uniform-or-per-corner BorderRadiusControl value into CSS declarations.
 * Uniform shape: a string like "8px". Per-corner shape:
 * { topLeft, topRight, bottomRight, bottomLeft } each with string values.
 *
 * @param mixed $radius BorderRadiusControl value (or null).
 * @return array List of CSS declaration strings.
 */
function build_radius_decls( $radius ) {
	if ( is_string( $radius ) && '' !== $radius ) {
		$safe = sanitize_css_value( $radius );
		return '' !== $safe ? array( 'border-radius:' . $safe ) : array();
	}
	if ( ! is_array( $radius ) ) {
		return array();
	}
	$corners = array(
		'topLeft'     => 'border-top-left-radius',
		'topRight'    => 'border-top-right-radius',
		'bottomRight' => 'border-bottom-right-radius',
		'bottomLeft'  => 'border-bottom-left-radius',
	);
	$decls   = array();
	foreach ( $corners as $key => $css_prop ) {
		$safe = sanitize_css_value( $radius[ $key ] ?? '' );
		if ( '' !== $safe ) {
			$decls[] = $css_prop . ':' . $safe;
		}
	}
	return $decls;
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

/**
 * Record a Tracks event when a post containing the Donations block transitions
 * to "publish" status. Fires once per donations block in the post, with the
 * block's configuration snapshot as event properties.
 *
 * Admin-driven event only (no donor data). Does not fire on regular updates of
 * an already-published post, on autosaves, or on revisions.
 *
 * @since $$next-version$$
 *
 * @param string  $new_status New post status.
 * @param string  $old_status Previous post status.
 * @param WP_Post $post       Post being transitioned.
 * @return void
 */
function record_block_published_event( $new_status, $old_status, $post ) {
	if ( 'publish' !== $new_status || 'publish' === $old_status ) {
		return;
	}
	if ( ! $post instanceof WP_Post ) {
		return;
	}
	if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
		return;
	}
	$block_name = Blocks::get_block_name( __DIR__ );
	if ( ! has_block( $block_name, $post ) ) {
		return;
	}

	$donation_blocks = collect_donation_blocks( parse_blocks( $post->post_content ), $block_name );
	if ( empty( $donation_blocks ) ) {
		return;
	}

	require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
	$stripe_connected = \Jetpack_Memberships::has_connected_account();
	$block_count      = count( $donation_blocks );

	foreach ( $donation_blocks as $index => $block ) {
		$props = build_block_published_event_props( $block, $post, $index, $block_count, $stripe_connected );
		record_published_event( 'donations_block_published', $props );
	}
}
add_action( 'transition_post_status', __NAMESPACE__ . '\record_block_published_event', 10, 3 );

/**
 * Walk a parsed block tree and return a flat list of Donations blocks (including
 * nested ones inside columns / groups / patterns).
 *
 * @since $$next-version$$
 *
 * @param array  $blocks     Parsed blocks from parse_blocks().
 * @param string $block_name Donations block name (e.g. 'jetpack/donations').
 * @return array List of parsed blocks matching $block_name.
 */
function collect_donation_blocks( $blocks, $block_name ) {
	$matches = array();
	foreach ( $blocks as $block ) {
		if ( isset( $block['blockName'] ) && $block_name === $block['blockName'] ) {
			$matches[] = $block;
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			$matches = array_merge( $matches, collect_donation_blocks( $block['innerBlocks'], $block_name ) );
		}
	}
	return $matches;
}

/**
 * Build the property bag for a jetpack_donations_block_published Tracks event.
 *
 * Extracted so it can be tested independently of the WordPress hook plumbing.
 *
 * @since $$next-version$$
 *
 * @param array   $block            Parsed block (with 'attrs' key).
 * @param WP_Post $post             Post being published.
 * @param int     $index            0-based position of this block within the post's donation blocks.
 * @param int     $block_count      Total count of donations blocks in the post.
 * @param bool    $stripe_connected Whether the site currently has a connected Stripe account.
 * @return array Tracks event properties.
 */
function build_block_published_event_props( $block, $post, $index, $block_count, $stripe_connected ) {
	$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();

	$one_time_show = ! isset( $attrs['oneTimeDonation']['show'] ) || false !== $attrs['oneTimeDonation']['show'];
	$monthly_show  = ! empty( $attrs['monthlyDonation']['show'] );
	$yearly_show   = ! empty( $attrs['annualDonation']['show'] );

	$default_interval  = $attrs['defaultInterval'] ?? 'one-time';
	$interval_to_freq  = array(
		'one-time' => 'one_time',
		'1 month'  => 'monthly',
		'1 year'   => 'yearly',
	);
	$default_frequency = $interval_to_freq[ $default_interval ] ?? $default_interval;
	$enabled_count     = (int) $one_time_show + (int) $monthly_show + (int) $yearly_show;
	$tabs_appearance   = $attrs['tabsAppearance'] ?? 'tabs';

	return array(
		'feature'                   => 'donations',
		'surface'                   => 'server',
		'stripe_connected'          => (bool) $stripe_connected,
		'post_id'                   => (int) $post->ID,
		'post_type'                 => (string) $post->post_type,
		'block_index_in_post'       => (int) $index,
		'block_count_in_post'       => (int) $block_count,
		'currency'                  => isset( $attrs['currency'] ) ? (string) $attrs['currency'] : null,
		'default_frequency'         => $default_frequency,
		'enabled_frequencies_count' => $enabled_count,
		'show_one_time'             => $one_time_show,
		'show_monthly'              => $monthly_show,
		'show_yearly'               => $yearly_show,
		'show_custom_amount'        => ! empty( $attrs['showCustomAmount'] ),
		'has_min_amount'            => isset( $attrs['minimumAmount'] ),
		'has_max_amount'            => isset( $attrs['maximumAmount'] ),
		'has_custom_styles'         => has_custom_styles( $attrs ),
		'tabs_appearance'           => (string) $tabs_appearance,
	);
}

/**
 * Detect whether the block carries any of the customizable style attributes
 * we ship for the RSM project (so we can measure adoption of the new options).
 *
 * @since $$next-version$$
 *
 * @param array $attrs Block attributes.
 * @return bool Whether any style override is set.
 */
function has_custom_styles( $attrs ) {
	$style_keys = array(
		'tabFontSize',
		'tabPadding',
		'activeTabBackgroundColor',
		'activeTabTextColor',
		'buttonPadding',
	);
	foreach ( $style_keys as $key ) {
		if ( isset( $attrs[ $key ] ) && '' !== $attrs[ $key ] && array() !== $attrs[ $key ] ) {
			return true;
		}
	}
	return false;
}

/**
 * Send a Donations Tracks event using whichever pipeline is available for the
 * current environment (WPCOM Simple sites vs. WoA / connected Jetpack sites).
 *
 * Mirrors the dual-path pattern used by the Map block. No-op on environments
 * that have neither path available, so this stays safe on unconnected sites.
 *
 * @since $$next-version$$
 *
 * @param string $event_name Event name WITHOUT the `jetpack_` prefix (the Tracking class adds it).
 * @param array  $props      Tracks event properties.
 * @return void
 */
function record_published_event( $event_name, $props ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_lib( 'tracks/client' );
		tracks_record_event( wp_get_current_user(), 'jetpack_' . $event_name, $props );
		return;
	}
	if ( ( new Host() )->is_woa_site() && Jetpack::is_connection_ready() ) {
		$tracking = new Tracking();
		$tracking->record_user_event( $event_name, $props );
	}
}
