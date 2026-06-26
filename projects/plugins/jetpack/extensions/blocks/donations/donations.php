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
				'render_callback'       => __NAMESPACE__ . '\render_block',
				'render_email_callback' => __NAMESPACE__ . '\render_email',
				'plan_check'            => true,
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

	$display_mode     = $attr['displayMode'] ?? 'inline';
	$instance_id      = wp_unique_id( 'jp-donations-' );
	$instance_classes = $instance_id;
	if ( isset( $attr['tabsAppearance'] ) && 'buttons' === $attr['tabsAppearance'] ) {
		$instance_classes .= ' is-style-buttons';
	}
	if ( 'modal' === $display_mode ) {
		$instance_classes .= ' is-display-modal';
		if ( ! empty( $attr['triggerSticky'] ) ) {
			$instance_classes .= ' is-sticky';
		}
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

	if ( 'modal' === $display_mode ) {
		$trigger_text     = $attr['triggerButtonText'] ?? $default_texts['triggerButtonText'];
		$trigger_icon_key = $attr['triggerIcon'] ?? 'heart';
		$trigger_svg      = get_trigger_icon_svg( $trigger_icon_key );
		$modal_id         = $instance_id . '-modal';

		return sprintf(
			'
<div %1$s>%9$s
	<button
		class="donations__trigger-button wp-block-button__link wp-element-button"
		aria-haspopup="dialog"
		aria-controls="%11$s"
	>%12$s%10$s</button>
	<div
		id="%11$s"
		class="donations__modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="%10$s"
		hidden
	>
		<div class="donations__modal-dialog">
			<button class="donations__modal-close" aria-label="%13$s">&#x2715;</button>
			<div class="donations__modal-content">
				<div class="donations__container">
					%2$s
					<div class="donations__content">
						<div class="donations__tab %14$s">
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
			esc_html( $trigger_text ),
			esc_attr( $modal_id ),
			$trigger_svg,
			esc_attr__( 'Close', 'jetpack' ),
			esc_attr( $tab_content_class )
		);
	}

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
 * WooCommerce Email Editor render callback for the Donations block.
 *
 * Builds a dedicated email version of the block from its attributes (rather than
 * post-processing the interactive frontend markup) so customizations — per
 * interval heading, supporting text and button label — are preserved. Each
 * interval is rendered as an email-safe table section with a CTA button drawn by
 * the Button block's own email renderer.
 *
 * @param string $block_content     The rendered block content (unused; we rebuild from attributes).
 * @param array  $parsed_block      The parsed block data.
 * @param object $rendering_context The email rendering context.
 *
 * @return string
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) {
	if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] )
		|| ! function_exists( '\Automattic\Jetpack\Extensions\Button\render_email' )
		|| ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
		return '';
	}

	$attr          = $parsed_block['attrs'];
	$default_texts = get_default_texts();

	$url = get_permalink();
	if ( ! is_string( $url ) || '' === $url ) {
		$url = is_string( $attr['fallbackLinkUrl'] ?? null ) && '' !== $attr['fallbackLinkUrl'] ? $attr['fallbackLinkUrl'] : '#';
	}

	$alignment   = in_array( $attr['contentAlignment'] ?? '', array( 'left', 'center', 'right' ), true ) ? $attr['contentAlignment'] : 'left';
	$table_style = sprintf( 'width:100%%;max-width:%dpx;border-collapse:collapse;', get_email_target_width( $rendering_context ) );

	$sections = '';
	foreach ( array(
		'oneTimeDonation' => true,
		'monthlyDonation' => false,
		'annualDonation'  => false,
	) as $key => $default_show ) {
		$interval = is_array( $attr[ $key ] ?? null ) ? $attr[ $key ] : array();
		if ( false === ( $interval['show'] ?? $default_show ) ) {
			continue;
		}

		$heading = wp_kses_post( $interval['heading'] ?? $default_texts[ $key ]['heading'] );
		$extra   = wp_kses_post( $interval['extraText'] ?? $default_texts['extraText'] );

		$content = '';
		if ( '' !== trim( wp_strip_all_tags( $heading ) ) ) {
			$content .= sprintf(
				'<p style="margin:0 0 4px;font-size:18px;font-weight:700;line-height:1.3;text-align:%s;">%s</p>',
				esc_attr( $alignment ),
				$heading
			);
		}
		if ( '' !== trim( wp_strip_all_tags( $extra ) ) ) {
			$content .= sprintf(
				'<p style="margin:0 0 14px;font-size:15px;line-height:1.5;text-align:%s;">%s</p>',
				esc_attr( $alignment ),
				$extra
			);
		}
		$content .= render_email_donate_button( $interval['buttonText'] ?? $default_texts[ $key ]['buttonText'], $url, $attr, $rendering_context );

		$is_first   = '' === $sections;
		$cell_style = sprintf(
			'text-align:%1$s;padding:%2$s;%3$s',
			esc_attr( $alignment ),
			$is_first ? '0 0 24px' : '24px 0',
			$is_first ? '' : 'border-top:1px solid #e0e0e0;'
		);
		$sections  .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			$content,
			array( 'style' => $table_style ),
			array( 'style' => $cell_style )
		);
	}

	return $sections;
}

/**
 * Render a single donation CTA as an email-safe button via the Button block's
 * email renderer, carrying over the donation block's button styling.
 *
 * @param string $text              Button label.
 * @param string $url               Button destination.
 * @param array  $attr              Donations block attributes.
 * @param object $rendering_context The email rendering context.
 * @return string
 */
function render_email_donate_button( $text, $url, $attr, $rendering_context ) {
	$text = trim( wp_strip_all_tags( (string) $text ) );

	$button_attrs = array(
		'text' => '' !== $text ? $text : __( 'Donate', 'jetpack' ),
		'url'  => $url,
	);

	if ( ! empty( $attr['buttonFontSize'] ) && is_string( $attr['buttonFontSize'] ) ) {
		$button_attrs['customFontSize'] = $attr['buttonFontSize'];
	}
	if ( isset( $attr['buttonBorderRadius'] ) && is_string( $attr['buttonBorderRadius'] ) ) {
		$radius = (int) $attr['buttonBorderRadius'];
		if ( $radius > 0 ) {
			$button_attrs['borderRadius'] = $radius;
		}
	}

	return \Automattic\Jetpack\Extensions\Button\render_email(
		'',
		array( 'attrs' => $button_attrs ),
		$rendering_context
	);
}

/**
 * Resolve the target content width (in px) from the email rendering context,
 * falling back to a sensible default.
 *
 * @param object $rendering_context The email rendering context.
 * @return int Width in pixels.
 */
function get_email_target_width( $rendering_context ) {
	$target_width = 600;
	if ( is_object( $rendering_context ) && method_exists( $rendering_context, 'get_layout_width_without_padding' ) ) {
		$width = $rendering_context->get_layout_width_without_padding();
		if ( is_string( $width ) && preg_match( '/(\d+)px/', $width, $matches ) ) {
			$parsed = (int) $matches[1];
			if ( $parsed > 0 ) {
				$target_width = $parsed;
			}
		}
	}
	return $target_width;
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

	// Pop-up display mode: wire up trigger-button alignment via text-align on
	// the wrapper so the inline-flex button responds to the alignment toolbar.
	if ( 'modal' === ( $attr['displayMode'] ?? 'inline' ) ) {
		if ( in_array( $content_alignment, array( 'left', 'center', 'right' ), true ) ) {
			$rules[] = $scope . '{text-align:' . $content_alignment . '}';
		}
	}

	// Wrapper border (In-page mode only). Compound selector (.wp-block-jetpack-donations.jp-donations-N)
	// has specificity 0,2,0 and wins over the default single-class rule (0,1,0) in common.scss.
	if ( 'modal' !== ( $attr['displayMode'] ?? 'inline' ) ) {
		$wrapper_border_decls = array_merge(
			build_border_decls( $attr['blockBorder'] ?? null ),
			build_radius_decls( $attr['blockBorderRadius'] ?? null )
		);
		if ( $wrapper_border_decls ) {
			$rules[] = '.wp-block-jetpack-donations' . $scope . '{' . implode( ';', $wrapper_border_decls ) . '}';
		}
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
		'chooseAmountText'  => __( 'Choose an amount', 'jetpack' ),
		'customAmountText'  => __( 'Or enter a custom amount', 'jetpack' ),
		'extraText'         => __( 'Your contribution is appreciated.', 'jetpack' ),
		'triggerButtonText' => __( 'Donate', 'jetpack' ),
		'oneTimeDonation'   => array(
			'heading'    => __( 'Make a one-time donation', 'jetpack' ),
			'buttonText' => __( 'Donate', 'jetpack' ),
		),
		'monthlyDonation'   => array(
			'heading'    => __( 'Make a monthly donation', 'jetpack' ),
			'buttonText' => __( 'Donate monthly', 'jetpack' ),
		),
		'annualDonation'    => array(
			'heading'    => __( 'Make a yearly donation', 'jetpack' ),
			'buttonText' => __( 'Donate yearly', 'jetpack' ),
		),
	);
}

/**
 * Return inline SVG markup for a trigger button icon.
 *
 * Path data sourced from icons.js ICON_SVG_PATHS — keep in sync.
 *
 * @param string $icon_key Icon key (e.g. 'coffee', 'heart', 'gift').
 * @return string SVG HTML string, or '' when key is 'none' or unknown.
 */
function get_trigger_icon_svg( $icon_key ) {
	$paths = array(
		'heart'      => array( 'd' => 'M16.5 4.5c2.206 0 4 1.794 4 4 0 4.67-5.543 8.94-8.5 11.023C9.043 17.44 3.5 13.17 3.5 8.5c0-2.206 1.794-4 4-4 1.298 0 2.522.638 3.273 1.706L12 7.953l1.227-1.746c.75-1.07 1.975-1.707 3.273-1.707m0-1.5c-1.862 0-3.505.928-4.5 2.344C11.005 3.928 9.362 3 7.5 3 4.462 3 2 5.462 2 8.5c0 5.72 6.5 10.438 10 12.85 3.5-2.412 10-7.13 10-12.85C22 5.462 19.538 3 16.5 3z' ),
		'gift'       => array( 'd' => 'M15.333 4C16.6677 4 17.75 5.0823 17.75 6.41699V6.75C17.75 7.20058 17.6394 7.62468 17.4473 8H18.5C19.2767 8 19.9154 8.59028 19.9922 9.34668L20 9.5V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.72334 20 4.08461 19.4097 4.00781 18.6533L4 18.5V9.5L4.00781 9.34668C4.07949 8.64069 4.64069 8.07949 5.34668 8.00781L5.5 8H6.55273C6.36065 7.62468 6.25 7.20058 6.25 6.75V6.41699C6.25 5.0823 7.3323 4 8.66699 4C10.0436 4.00011 11.2604 4.68183 12 5.72559C12.7396 4.68183 13.9564 4.00011 15.333 4ZM5.5 18.5H11.25V9.5H5.5V18.5ZM12.75 18.5H18.5V9.5H12.75V18.5ZM8.66699 5.5C8.16073 5.5 7.75 5.91073 7.75 6.41699V6.75C7.75 7.44036 8.30964 8 9 8H11.2461C11.2021 6.61198 10.0657 5.50017 8.66699 5.5ZM15.333 5.5C13.9343 5.50017 12.7979 6.61198 12.7539 8H15C15.6904 8 16.25 7.44036 16.25 6.75V6.41699C16.25 5.91073 15.8393 5.5 15.333 5.5Z' ),
		'star'       => array( 'd' => 'M11.776 4.454a.25.25 0 01.448 0l2.069 4.192a.25.25 0 00.188.137l4.626.672a.25.25 0 01.139.426l-3.348 3.263a.25.25 0 00-.072.222l.79 4.607a.25.25 0 01-.362.263l-4.138-2.175a.25.25 0 00-.232 0l-4.138 2.175a.25.25 0 01-.363-.263l.79-4.607a.25.25 0 00-.071-.222L4.754 9.881a.25.25 0 01.139-.426l4.626-.672a.25.25 0 00.188-.137l2.069-4.192z' ),
		'thumbs-up'  => array( 'd' => 'm3 12 1 8h1.5l-1-8H3Zm15.8-2h-4.4l.8-3.6c.3-1.3-.7-2.4-1.9-2.4h-.2c-.6 0-1.2.3-1.6.8l-5 6.6c-.3.4-.4.8-.4 1.2v.2l.7 5.4v.2c.2.9 1 1.5 1.9 1.5h8.2c.9 0 1.7-.6 1.9-1.4l1.8-6c.4-1.3-.6-2.6-1.9-2.6Zm.5 2.1-1.8 6c0 .2-.3.4-.5.4H8.8c-.3 0-.5-.2-.5-.4l-.7-5.4v-.4l5-6.6c0-.1.2-.2.4-.2h.2c.3 0 .6.3.5.6l-.8 3.6c-.1.4 0 .9.3 1.3s.7.6 1.2.6h4.4c.3 0 .6.3.5.6Z' ),
		'smiley'     => array( 'd' => 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5 14.67 11 15.5 11zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z' ),
		'coffee'     => array( 'd' => 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4zM9 1v2M12 1v2M15 1v2' ),
		'tip-jar'    => array( 'd' => 'M9 3h6c0-1.1-.9-2-2-2H11C9.9 1 9 1.9 9 3zm7 0H8c-.55 0-1 .45-1 1v1.5c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 3.5H9V19c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V6.5zm-3 1.5h2v1.5l-1 1.5-1-1.5V8z' ),
		'hand-heart' => array( 'd' => 'M15.5 2.1c-1.1 0-2 .6-2.5 1.4-.5-.9-1.4-1.4-2.5-1.4C8.8 2.1 7.5 3.4 7.5 5c0 2.5 4.5 5.9 5.5 6.6 1-.7 5.5-4.1 5.5-6.6 0-1.6-1.3-2.9-3-2.9zM9 14H7l-2 7h14l-2-7h-2l-1 3H10l-1-3z' ),
		'people'     => array(
			'd'         => 'M15.5 9.5a1 1 0 100-2 1 1 0 000 2zm0 1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-2.25 6v-2a2.75 2.75 0 00-2.75-2.75h-4A2.75 2.75 0 003.75 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5zm7-2v2h-1.5v-2c0-.69-.56-1.25-1.25-1.25H15v-1.5h2.5A2.75 2.75 0 0120.25 15zM9.5 8.5a1 1 0 11-2 0 1 1 0 012 0zm1.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			'fill-rule' => 'evenodd',
		),
	);

	if ( ! isset( $paths[ $icon_key ] ) || 'none' === $icon_key ) {
		return '';
	}

	$icon        = $paths[ $icon_key ];
	$extra_attrs = isset( $icon['fill-rule'] ) ? ' fill-rule="' . esc_attr( $icon['fill-rule'] ) . '"' : '';

	return sprintf(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" class="donations__trigger-icon"><path d="%s"%s/></svg>',
		esc_attr( $icon['d'] ),
		$extra_attrs
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
 * @since 15.9
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
 * @since 15.9
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
 * @since 15.9
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
 * @since 15.9
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
 * @since 15.9
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
