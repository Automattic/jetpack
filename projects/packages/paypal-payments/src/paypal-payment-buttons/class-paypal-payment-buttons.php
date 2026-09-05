<?php
/**
 * PayPal Payment Buttons block lets users embed a PayPal button to sell products on their site.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Class PayPal_Payment_Buttons
 *
 * @package Automattic\Jetpack\PaypalPayments
 */
class PayPal_Payment_Buttons {
	/**
	 * The block full slugname.
	 *
	 * @var string
	 */
	public const BLOCK_NAME = 'jetpack/paypal-payment-buttons';

	/**
	 * PayPal partner attribution ID used for tracking.
	 *
	 * @var string
	 */
	public const PAYPAL_PARTNER_ATTRIBUTION_ID = 'WooNCPS_Ecom_Wordpress';

	/**
	 * Feature flag gating the API-managed buttons: the connection wizard, the
	 * wpcom/v2/paypal REST routes, and the Payment Links admin page.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public const API_MANAGED_BUTTONS_FLAG = 'paypal-payments-api-managed-buttons';

	/**
	 * Front-end style handle, side-loaded from the sibling style.css by
	 * `Assets::register_script` and handed to the block as its `style` arg.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public const STYLE_HANDLE = 'jetpack-block-paypal-payment-buttons';

	/**
	 * Register the feature flags this package owns.
	 *
	 * Call it from every bootstrap before `init`, so the flag exists on every
	 * request type that reads it (REST, admin, WP-CLI).
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public static function register_feature_flags() {
		Feature_Flags::register(
			self::API_MANAGED_BUTTONS_FLAG,
			array(
				'default'     => false,
				'description' => 'Create and manage PayPal payment buttons from the editor through the PayPal API, instead of pasting button code.',
				'owner'       => 'paypal-payments',
			)
		);
	}

	/**
	 * Whether the API-managed buttons are enabled on this site.
	 *
	 * Rendering is deliberately not gated on this: a button created while the
	 * flag was on must keep rendering after it is turned off.
	 *
	 * @since $$next-version$$
	 * @return bool
	 */
	public static function is_api_managed_enabled() {
		return Feature_Flags::is_enabled( self::API_MANAGED_BUTTONS_FLAG );
	}

	/**
	 * Expose the flag to the block editor under the same name.
	 *
	 * Jetpack hooks this on `jetpack_block_editor_feature_flags`; the standalone
	 * plugin calls it while building its own editor state.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $flags Feature flags keyed by name.
	 * @return array
	 */
	public static function add_editor_feature_flags( $flags ) {
		if ( ! is_array( $flags ) ) {
			$flags = array();
		}

		$flags[ self::API_MANAGED_BUTTONS_FLAG ] = self::is_api_managed_enabled();

		return $flags;
	}

	/**
	 * Validates and sanitizes a script URL to ensure it's from an allowed PayPal domain.
	 *
	 * @param string $url The URL to validate and sanitize.
	 * @return string|false The sanitized URL, or false if URL is not from an allowed PayPal domain.
	 */
	public static function sanitize_paypal_script_url( $url ) {
		if ( empty( $url ) ) {
			return false;
		}

		$parsed_url = wp_parse_url( $url );
		if ( ! $parsed_url || empty( $parsed_url['host'] ) ) {
			return false;
		}

		// Normalize the host
		$host = strtolower( $parsed_url['host'] );
		$host = rtrim( $host, '.' );

		// Only allow specific PayPal domains
		$allowed_hosts = array(
			'www.paypal.com',
			'paypal.com',
			'www.sandbox.paypal.com',
			'sandbox.paypal.com',
		);

		if ( ! in_array( $host, $allowed_hosts, true ) ) {
			return false;
		}

		// Rebuild the URL with HTTPS
		$sanitized_url = 'https://' . $host;

		if ( isset( $parsed_url['path'] ) ) {
			$sanitized_url .= $parsed_url['path'];
		}
		if ( isset( $parsed_url['query'] ) ) {
			// If we have escaped ampersands in the query string, we need to unescape them.
			$sanitized_url .= '?' . str_replace( '&amp;', '&', $parsed_url['query'] );
		}

		return $sanitized_url;
	}

	/**
	 * Append the partner attribution (BN) code to a PayPal payment URL.
	 *
	 * Every route a merchant can use to hand a payment link to a buyer — the
	 * rendered button, the copy buttons in the editor and admin, the emailed
	 * link — has to carry the same `at_code`, or the resulting sales aren't
	 * attributed to us. `add_query_arg()` replaces an existing `at_code`, so
	 * this is safe to apply to a URL that already has one.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $url A PayPal payment URL.
	 * @return string The URL with the attribution code, or the original URL if it isn't a PayPal URL.
	 */
	public static function add_partner_attribution( $url ) {
		$sanitized = self::sanitize_paypal_script_url( $url );

		if ( false === $sanitized ) {
			return $url;
		}

		return add_query_arg( 'at_code', self::PAYPAL_PARTNER_ATTRIBUTION_ID, $sanitized );
	}

	/**
	 * Side-load the front-end stylesheet and register it under STYLE_HANDLE.
	 *
	 * The block.json `style` field can't do this. Its metadata is read from src/ in the
	 * Jetpack plugin, and a `file:` path there also makes core register the editor
	 * bundle a second time under its own generated handle, so the whole bundle is
	 * parsed twice on every editor screen. Pass the handle to jetpack_register_block()
	 * as `style` instead -- the podcast-episode block does the same.
	 *
	 * Called by both bootstraps: the standalone plugin registers the block itself and
	 * never goes through register_block().
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public static function register_block_style() {
		Assets::register_script(
			self::STYLE_HANDLE,
			'../../dist/paypal-payment-buttons/style.js',
			__FILE__,
			array(
				'css_path' => '../../dist/paypal-payment-buttons/style.css',
			)
		);
	}

	/**
	 * Registers the block for use in Gutenberg
	 * This is done via an action so that we can disable
	 * registration if we need to.
	 */
	public static function register_block() {
		self::register_block_style();

		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => array( __CLASS__, 'render_block' ),
				'plan_check'      => true,
				'style'           => self::STYLE_HANDLE,
			)
		);
	}

	/**
	 * Render the block.
	 *
	 * Supports both API-managed buttons (V2) and legacy paste-code buttons (V1).
	 * API-managed buttons use the payment_url from the PayPal Pay Links & Buttons API.
	 * Legacy buttons use scriptSrc/hostedButtonId from the paste-code workflow.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content The block content.
	 * @return string|void The rendered block HTML.
	 */
	public static function render_block( $attributes, $content ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$api_managed = ! empty( $attributes['isApiManaged'] );

		// ─── V2: API-managed button ───
		if ( $api_managed ) {
			return self::render_api_managed_button( $attributes );
		}

		// ─── V1: Legacy paste-code button ───
		return self::render_legacy_button( $attributes );
	}

	/**
	 * Render an API-managed button created via the Pay Links & Buttons API.
	 *
	 * Generates a styled form that links to the PayPal payment page.
	 * The BN code is included as a query parameter for revenue attribution.
	 *
	 * @since 0.7.0
	 *
	 * @param array $attributes The block attributes.
	 * @return string|void The rendered button HTML.
	 */
	/**
	 * Currency symbols for frontend price formatting.
	 * Matches the JS CURRENCY_SYMBOLS map in paypal-button-preview.js.
	 *
	 * @var array
	 */
	private static $currency_symbols = array(
		'USD' => '$',
		'EUR' => '€',
		'GBP' => '£',
		'JPY' => '¥',
		'CAD' => 'CA$',
		'AUD' => 'A$',
		'CHF' => 'CHF',
		'CNY' => '¥',
		'INR' => '₹',
		'BRL' => 'R$',
		'MXN' => 'MX$',
		'HKD' => 'HK$',
		'NZD' => 'NZ$',
		'SGD' => 'S$',
		'SEK' => 'kr',
		'NOK' => 'kr',
		'DKK' => 'kr',
		'PLN' => 'zł',
		'CZK' => 'Kč',
		'HUF' => 'Ft',
		'ILS' => '₪',
		'MYR' => 'RM',
		'PHP' => '₱',
		'TWD' => 'NT$',
		'THB' => '฿',
	);

	/**
	 * Format a price with its currency symbol.
	 *
	 * @param string $price    The price value.
	 * @param string $currency The ISO currency code.
	 * @return string Formatted price string (e.g., "$29.99").
	 */
	public static function format_price( $price, $currency ) {
		$symbol = self::$currency_symbols[ $currency ] ?? $currency;
		return $symbol . $price;
	}

	/**
	 * Official PayPal two-tone wordmark SVG for inline button rendering.
	 *
	 * Sourced from paypalobjects.com/paypal-ui/logos/svg/paypal-color.svg
	 * (wordmark paths only). Navy (#003087) for "Pay", blue (#0070E0) for "Pal".
	 *
	 * @return string SVG markup.
	 */
	private static function get_paypal_logo_svg() {
		// Uses currentColor so the wordmark inherits the button's text color,
		// guaranteeing contrast on both light and dark backgrounds.
		return '<svg class="jetpack-paypal-button__logo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="50 8 118 36" aria-hidden="true" focusable="false">'
			. '<path fill="currentColor" d="M62.56 28.672a10.111 10.111 0 0 0 9.983-8.56c.78-4.967-3.101-9.303-8.6-9.303H55.08a.689.689 0 0 0-.69.585l-3.95 25.072a.643.643 0 0 0 .634.742h4.69a.689.689 0 0 0 .688-.585l1.162-7.365a.689.689 0 0 1 .689-.586h4.257Zm3.925-8.786c-.29 1.836-1.709 3.189-4.425 3.189h-3.474l1.053-6.68h3.411c2.81.006 3.723 1.663 3.435 3.496v-.005Z"/>'
			. '<path fill="currentColor" d="M92.863 18.706H88.41a.69.69 0 0 0-.69.585l-.144.924s-3.457-3.775-9.575-1.225c-3.51 1.461-5.194 4.48-5.91 6.69 0 0-2.277 6.718 2.87 10.417 0 0 4.771 3.556 10.145-.22l-.093.589a.642.642 0 0 0 .634.742h4.451a.689.689 0 0 0 .69-.585l2.708-17.175a.643.643 0 0 0-.634-.742Zm-6.547 9.492a4.996 4.996 0 0 1-4.996 4.276 4.513 4.513 0 0 1-1.397-.205c-1.92-.616-3.015-2.462-2.7-4.462a4.996 4.996 0 0 1 5.014-4.277c.474-.005.946.065 1.398.206 1.913.614 3.001 2.46 2.686 4.462h-.005Z"/>'
			. '<path fill="currentColor" d="m109.205 19.131-5.367 9.059-2.723-8.992a.69.69 0 0 0-.664-.492h-4.842a.516.516 0 0 0-.496.689l4.88 15.146-4.413 7.138a.517.517 0 0 0 .442.794h5.217a.858.858 0 0 0 .741-.418l13.632-22.552a.516.516 0 0 0-.446-.789h-5.215a.858.858 0 0 0-.746.417Z"/>'
			. '<path fill="currentColor" d="M126.672 28.672a10.115 10.115 0 0 0 9.992-8.56c.779-4.967-3.101-9.303-8.602-9.303h-8.86a.69.69 0 0 0-.689.585l-3.962 25.079a.637.637 0 0 0 .365.683.64.64 0 0 0 .269.06h4.691a.69.69 0 0 0 .689-.586l1.163-7.365a.688.688 0 0 1 .689-.586l4.255-.007Zm3.925-8.786c-.29 1.836-1.709 3.189-4.426 3.189h-3.473l1.054-6.68h3.411c2.808.006 3.723 1.663 3.434 3.496v-.005Z"/>'
			. '<path fill="currentColor" d="M156.974 18.706h-4.448a.69.69 0 0 0-.689.585l-.146.924s-3.456-3.775-9.574-1.225c-3.509 1.461-5.194 4.48-5.911 6.69 0 0-2.276 6.718 2.87 10.417 0 0 4.772 3.556 10.146-.22l-.093.589a.637.637 0 0 0 .365.683c.084.04.176.06.269.06h4.451a.686.686 0 0 0 .689-.586l2.709-17.175a.657.657 0 0 0-.148-.518.632.632 0 0 0-.49-.224Zm-6.546 9.492a4.986 4.986 0 0 1-4.996 4.276 4.513 4.513 0 0 1-1.399-.205c-1.921-.616-3.017-2.462-2.702-4.462a4.996 4.996 0 0 1 4.996-4.277c.475-.005.947.064 1.399.206 1.933.614 3.024 2.46 2.707 4.462h-.005Z"/>'
			. '<path fill="currentColor" d="m161.982 11.387-3.962 25.079a.637.637 0 0 0 .365.683c.084.04.176.06.269.06h4.689a.688.688 0 0 0 .689-.586l3.963-25.079a.637.637 0 0 0-.146-.517.645.645 0 0 0-.488-.225h-4.69a.69.69 0 0 0-.689.585Z"/>'
			. '</svg>';
	}

	/**
	 * Render an API-managed PayPal payment button on the frontend.
	 *
	 * @param array $attributes The block attributes.
	 * @return string|void The rendered button HTML.
	 */
	private static function render_api_managed_button( $attributes ) {
		$resource_id         = $attributes['resourceId'] ?? '';
		$payment_url         = $attributes['paymentLink'] ?? '';
		$product_name        = $attributes['productName'] ?? '';
		$price               = $attributes['price'] ?? '';
		$currency            = $attributes['currencyCode'] ?? 'USD';
		$product_description = $attributes['productDescription'] ?? '';
		$image_url           = $attributes['imageUrl'] ?? '';
		$variants_enabled    = ! empty( $attributes['variantsEnabled'] );
		$variants            = $attributes['variants'] ?? null;
		$show_qr_code        = $attributes['showQrCode'] ?? true;
		$format              = $attributes['format'] ?? 'BUTTON';

		// Validate — only known format values are accepted.
		if ( ! in_array( $format, array( 'BUTTON', 'LINK', 'QR' ), true ) ) {
			$format = 'BUTTON';
		}

		if ( empty( $resource_id ) || empty( $payment_url ) ) {
			return;
		}

		// Validate the payment URL is from a legitimate PayPal domain.
		$sanitized_payment_url = self::sanitize_paypal_script_url( $payment_url );
		if ( false === $sanitized_payment_url ) {
			return;
		}

		self::register_hooks();

		// QR script needed for BUTTON (toggle) and QR (standalone) formats.
		if ( 'LINK' !== $format ) {
			if ( 'QR' === $format || $show_qr_code ) {
				self::enqueue_qr_script();
			}
		}

		// Append BN code for revenue attribution tracking.
		$action_url = esc_url( self::add_partner_attribution( $sanitized_payment_url ) );

		// ─── LINK format: plain anchor ───────────────────────────────────
		if ( 'LINK' === $format ) {
			$wrapper_attributes = get_block_wrapper_attributes();
			$link_label         = ! empty( $product_name )
				? $product_name
				: __( 'Pay with PayPal', 'jetpack-paypal-payments' );

			return sprintf(
				'<div %1$s><a href="%2$s" class="jetpack-paypal-button__paypal-link" target="_blank" rel="noopener noreferrer">%3$s<span class="screen-reader-text">%4$s</span></a></div>',
				$wrapper_attributes,
				$action_url,
				esc_html( $link_label ),
				esc_html__( '(opens in a new tab)', 'jetpack-paypal-payments' )
			);
		}

		// ─── QR format: standalone auto-rendering QR canvas ──────────────
		if ( 'QR' === $format ) {
			$wrapper_attributes = get_block_wrapper_attributes();
			$download_label     = esc_html__( 'Download QR Code', 'jetpack-paypal-payments' );
			$copy_label         = esc_html__( 'Copy Link', 'jetpack-paypal-payments' );
			$copied_label       = esc_attr__( 'Copied!', 'jetpack-paypal-payments' );
			$product_label      = ! empty( $product_name )
				? sprintf(
					'<p class="jetpack-paypal-button__qr-product-name">%s</p>',
					esc_html( $product_name )
				)
				: '';

			return sprintf(
				'<div %1$s>
	<div class="jetpack-paypal-button jetpack-paypal-button--qr-format">
		%2$s
		<div class="jetpack-paypal-button__qr-standalone">
			<canvas class="jetpack-paypal-button__qr-canvas jetpack-paypal-button__qr-canvas--standalone" data-qr-url="%3$s"></canvas>
			<div class="jetpack-paypal-button__qr-link">
				<input type="text" readonly class="jetpack-paypal-button__qr-link-input" value="%3$s" />
				<button type="button" class="jetpack-paypal-button__qr-copy" data-copy-label="%4$s" data-copied-label="%5$s">%4$s</button>
			</div>
			<button type="button" class="jetpack-paypal-button__qr-download">%6$s</button>
		</div>
		<p class="jetpack-paypal-button__attribution">%7$s</p>
	</div>
</div>',
				$wrapper_attributes,
				$product_label,
				esc_attr( $action_url ),
				$copy_label,
				$copied_label,
				$download_label,
				esc_html__( 'Powered by PayPal', 'jetpack-paypal-payments' )
			);
		}

		// ─── BUTTON format (default): existing full button card ──────────

		// Product image (WordPress-side only, not sent to PayPal).
		$image_html = '';
		if ( ! empty( $image_url ) ) {
			$image_html = sprintf(
				'<div class="jetpack-paypal-button__product-image"><img src="%s" alt="%s" /></div>',
				esc_url( $image_url ),
				esc_attr( $product_name )
			);
		}

		// Build product info section.
		$description_html = '';
		if ( ! empty( $product_description ) ) {
			$description_html = sprintf(
				'<span class="jetpack-paypal-button__product-description">%s</span>',
				esc_html( $product_description )
			);
		}

		// PayPal drops the product-level amount once the options have their own
		// prices, but the block keeps whatever the merchant typed. Ignore it.
		if ( $variants_enabled && PayPal_Attribute_Mapper::variants_have_pricing( $variants ) ) {
			$price = '';
		}

		// Headline price: the product price, or the cheapest option when there is none.
		$price_html = '';
		if ( ! empty( $price ) ) {
			$price_html = sprintf(
				'<span class="jetpack-paypal-button__product-price">%s</span>',
				esc_html( self::format_price( $price, $currency ) )
			);
		} elseif ( $variants_enabled ) {
			$lowest = self::get_lowest_variant_price( $variants );
			if ( null !== $lowest ) {
				$price_html = sprintf(
					'<span class="jetpack-paypal-button__product-price">%s</span>',
					esc_html(
						sprintf(
							/* translators: %s: formatted price, e.g. "$29.99" */
							__( 'From %s', 'jetpack-paypal-payments' ),
							self::format_price( $lowest, $currency )
						)
					)
				);
			}
		}

		// Build variant options display.
		$variants_html = '';
		if ( $variants_enabled && ! empty( $variants['dimensions'] ) && is_array( $variants['dimensions'] ) ) {
			$variant_groups = array();
			foreach ( $variants['dimensions'] as $dimension ) {
				$dim_name = esc_html( $dimension['name'] ?? '' );
				if ( empty( $dim_name ) || empty( $dimension['options'] ) ) {
					continue;
				}

				$options_html = array();
				foreach ( $dimension['options'] as $option ) {
					$label = esc_html( $option['label'] ?? '' );
					if ( empty( $label ) ) {
						continue;
					}

					// Show the option's price, unless it repeats the product price above.
					$option_price = '';
					if ( ! empty( $option['unit_amount']['value'] ) && $option['unit_amount']['value'] !== $price ) {
						$option_price = ' <span class="jetpack-paypal-button__variant-price">'
							. esc_html( self::format_price( $option['unit_amount']['value'], $currency ) )
							. '</span>';
					}

					$options_html[] = '<span class="jetpack-paypal-button__variant-option">'
						. $label . $option_price . '</span>';
				}

				if ( ! empty( $options_html ) ) {
					$variant_groups[] = '<div class="jetpack-paypal-button__variant-group">'
						. '<span class="jetpack-paypal-button__variant-name">' . $dim_name . ':</span> '
						. implode( '', $options_html )
						. '</div>';
				}
			}

			if ( ! empty( $variant_groups ) ) {
				$variants_html = '<div class="jetpack-paypal-button__variants">'
					. '<p class="jetpack-paypal-button__variants-label">'
					. esc_html__( 'Options available — select at checkout:', 'jetpack-paypal-payments' )
					. '</p>'
					. implode( '', $variant_groups )
					. '</div>';
			}
		}

		// QR code toggle section (conditionally rendered for BUTTON format).
		$qr_html = '';
		if ( $show_qr_code ) {
			$qr_show     = esc_attr__( 'Show Link or QR Code', 'jetpack-paypal-payments' );
			$qr_hide     = esc_attr__( 'Hide Link or QR Code', 'jetpack-paypal-payments' );
			$qr_download = esc_html__( 'Download QR Code', 'jetpack-paypal-payments' );
			$copy_label  = esc_attr__( 'Copy Link', 'jetpack-paypal-payments' );
			$qr_html     = '<div class="jetpack-paypal-button__qr-section">'
				. '<button type="button" class="jetpack-paypal-button__qr-toggle" data-show-label="' . $qr_show . '" data-hide-label="' . $qr_hide . '" aria-expanded="false">' . $qr_show . '</button>'
				. '<div class="jetpack-paypal-button__qr-wrapper" style="display:none;">'
				. '<div class="jetpack-paypal-button__qr-content">'
				. '<canvas class="jetpack-paypal-button__qr-canvas" data-qr-url="' . esc_attr( $action_url ) . '"></canvas>'
				. '<div class="jetpack-paypal-button__qr-link">'
				. '<input type="text" readonly class="jetpack-paypal-button__qr-link-input" value="' . esc_attr( $action_url ) . '" />'
				. '<button type="button" class="jetpack-paypal-button__qr-copy" data-copy-label="' . $copy_label . '" data-copied-label="' . esc_attr__( 'Copied!', 'jetpack-paypal-payments' ) . '">' . $copy_label . '</button>'
				. '</div>'
				. '</div>'
				. '<button type="button" class="jetpack-paypal-button__qr-download">' . $qr_download . '</button>'
				. '</div></div>';
		}

		$wrapper_attributes = get_block_wrapper_attributes();

		return sprintf(
			'<div %9$s>
	<div class="jetpack-paypal-button">
		%10$s
		<div class="jetpack-paypal-button__product">
			<div class="jetpack-paypal-button__product-info">
				<span class="jetpack-paypal-button__product-name">%1$s</span>
				%2$s
			</div>
			%3$s
		</div>
		%7$s
		<div class="jetpack-paypal-button__buttons">
			<a href="%4$s" class="jetpack-paypal-button__checkout-link wp-element-button" target="_blank" rel="noopener noreferrer">
				<span class="jetpack-paypal-button__button-text">%5$s</span>
				%12$s
				<span class="screen-reader-text">%11$s</span>
			</a>
		</div>
		<p class="jetpack-paypal-button__attribution">%6$s</p>
		%8$s
	</div>
</div>',
			esc_html( $product_name ),
			$description_html,
			$price_html,
			$action_url,
			esc_html__( 'Buy Now With', 'jetpack-paypal-payments' ),
			esc_html__( 'Powered by PayPal', 'jetpack-paypal-payments' ),
			$variants_html,
			$qr_html,
			$wrapper_attributes,
			$image_html,
			esc_html__( 'PayPal (opens in a new tab)', 'jetpack-paypal-payments' ),
			self::get_paypal_logo_svg()
		);
	}

	/**
	 * Find the cheapest per-option price in the primary dimension.
	 *
	 * PayPal only prices the primary dimension, so an amount left on any other
	 * dimension is not a price a buyer can pay and must not become the headline.
	 *
	 * @since $$next-version$$
	 *
	 * @param array|null $variants Variants structure from the block attributes.
	 * @return string|null The lowest option price, or null when none are priced.
	 */
	private static function get_lowest_variant_price( $variants ) {
		if ( ! is_array( $variants ) || empty( $variants['dimensions'] ) || ! is_array( $variants['dimensions'] ) ) {
			return null;
		}

		$lowest = null;

		foreach ( $variants['dimensions'] as $dimension ) {
			if ( empty( $dimension['primary'] ) || empty( $dimension['options'] ) || ! is_array( $dimension['options'] ) ) {
				continue;
			}

			foreach ( $dimension['options'] as $option ) {
				$value = is_array( $option ) ? trim( (string) ( $option['unit_amount']['value'] ?? '' ) ) : '';
				if ( '' === $value || ! is_numeric( $value ) ) {
					continue;
				}

				if ( null === $lowest || (float) $value < (float) $lowest ) {
					$lowest = $value;
				}
			}
		}

		return $lowest;
	}

	/**
	 * Render a legacy paste-code button (V1 backward compatibility).
	 *
	 * @param array $attributes The block attributes.
	 * @return string|void The rendered button HTML.
	 */
	private static function render_legacy_button( $attributes ) {
		$button_type      = $attributes['buttonType'] ?? '';
		$script_src       = $attributes['scriptSrc'] ?? '';
		$hosted_button_id = $attributes['hostedButtonId'] ?? '';
		$button_text      = $attributes['buttonText'] ?? '';

		if ( empty( $button_type ) || empty( $hosted_button_id ) ) {
			return;
		}

		// For stacked buttons, we need both scriptSrc and hostedButtonId
		if ( 'stacked' === $button_type && empty( $script_src ) ) {
			return;
		}

		// For single buttons, we need buttonText
		if ( 'single' === $button_type && empty( $button_text ) ) {
			return;
		}

		if ( 'stacked' === $button_type ) {
			// Sanitize the script URL to ensure it's from an allowed PayPal domain
			$sanitized_url = self::sanitize_paypal_script_url( $script_src );
			if ( false === $sanitized_url ) {
				return;
			}

			// We can't include the version number here. If we do, it is appended to the URL and causes a 400 response.
			wp_enqueue_script( 'paypal-payment-buttons-block-head', $sanitized_url, array(), null, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			add_filter(
				'script_loader_tag',
				function ( $tag, $handle, $src ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					if ( 'paypal-payment-buttons-block-head' === $handle ) {
						// Add namespace to avoid conflicts with other PayPal SDK versions
						if ( false === strpos( $tag, 'data-namespace' ) ) {
							$tag = preg_replace( '/(\s+)src=([\'"])/', '$1 data-namespace="paypal_payment_buttons" src=$2', $tag );
						}
						// Add partner attribution ID
						if ( false === strpos( $tag, 'data-paypal-partner-attribution-id' ) ) {
							$tag = preg_replace( '/(\s+)src=([\'"])/', '$1 data-paypal-partner-attribution-id="' . self::PAYPAL_PARTNER_ATTRIBUTION_ID . '" src=$2', $tag );
						}
					}
					return $tag;
				},
				10,
				3
			);

			// Generate the button HTML and inline script
			$container_id = 'paypal-container-' . $hosted_button_id;
			$button_html  = '<div id="' . esc_attr( $container_id ) . '"></div>';

			$inline_script = sprintf(
				'(window.paypal_payment_buttons || window.paypal).HostedButtons({
					hostedButtonId: %s,
				}).render(%s);',
				wp_json_encode( $hosted_button_id, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ),
				wp_json_encode( '#' . $container_id, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP )
			);

			wp_add_inline_script( 'paypal-payment-buttons-block-head', $inline_script );

			return $button_html;
		}

		// Single button type - generate the complete form HTML
		if ( 'single' === $button_type ) {
			self::register_hooks();

			$payment_id          = esc_attr( $hosted_button_id );
			$button_text_escaped = esc_attr( $button_text );
			$action_url          = esc_url( 'https://www.paypal.com/ncp/payment/' . $payment_id . '?at_code=' . self::PAYPAL_PARTNER_ATTRIBUTION_ID );

			$button_html = sprintf(
				'<style>.pp-%1$s{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style>
<div>
<form action="%2$s" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
  <input class="pp-%1$s" type="submit" value="%3$s" />
  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
  <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section>
</form>
</div>',
				$payment_id,
				$action_url,
				$button_text_escaped
			);

			return $button_html;
		}
	}

	/**
	 * Load editor styles for the block.
	 * These are loaded via enqueue_block_assets to ensure proper loading in the editor iframe context.
	 */
	public static function load_editor_styles() {
		$handle = 'jp-paypal-payments-ncps-blocks';

		Assets::register_script(
			$handle,
			'../../dist/paypal-payment-buttons/editor.js',
			__FILE__,
			array(
				'css_path'   => '../../dist/paypal-payment-buttons/editor.css',
				'textdomain' => 'jetpack-paypal-payments',
			)
		);
		wp_enqueue_style( $handle );
	}

	/**
	 * Loads scripts
	 */
	public static function load_editor_scripts() {
		Assets::register_script(
			'jp-paypal-payments-ncps-blocks',
			'../../dist/paypal-payment-buttons/editor.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-paypal-payments',
				'enqueue'    => true,
				// Editor styles are loaded separately, see load_editor_styles().
				'css_path'   => null,
			)
		);
	}

	/**
	 * Add display to the allowed styles.
	 *
	 * @see https://developer.wordpress.org/reference/hooks/safe_style_css/
	 *
	 * @param array $safe_styles The allowed styles.
	 * @return array The allowed styles.
	 */
	public static function add_style_display( array $safe_styles ): array {
		$safe_styles[] = 'display';
		return $safe_styles;
	}

	/**
	 * Register hooks (idempotent — safe to call from multiple block renders).
	 */
	public static function register_hooks() {
		static $registered = false;
		if ( $registered ) {
			return;
		}
		$registered = true;

		add_filter( 'safe_style_css', array( __CLASS__, 'add_style_display' ) );
	}

	/**
	 * Enqueue the QR code frontend script on pages containing the block.
	 *
	 * Called from render_api_managed_button() so the script is only loaded
	 * when a PayPal payment button is actually present on the page.
	 *
	 * @since 0.9.0
	 * @return void
	 */
	private static function enqueue_qr_script() {
		static $enqueued = false;
		if ( $enqueued ) {
			return;
		}
		$enqueued = true;

		Assets::register_script(
			'jetpack-paypal-qr-code',
			'../../dist/paypal-payment-buttons/qr-code.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-paypal-payments',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Initialize PayPal Payment Buttons API integration hooks.
	 *
	 * Registers REST API routes for PayPal OAuth connection management
	 * and button CRUD operations.
	 *
	 * @since 0.7.0
	 * @return void
	 */
	public static function init_api() {
		add_action( 'init', array( __CLASS__, 'register_standalone_script_stubs' ), 1 );
		self::init_rest_api();
		add_action( 'init', array( __CLASS__, 'init_jetpack_sharing' ) );
		add_action( 'init', array( PayPal_Email_Sender::class, 'maybe_init' ) );
	}

	/**
	 * Register just the PayPal REST routes.
	 *
	 * For hosts that already provide the Jetpack runtime -- the Jetpack plugin --
	 * and therefore must not get the standalone script stubs.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public static function init_rest_api() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	/**
	 * Register the PayPal REST routes when the API-managed buttons are enabled.
	 *
	 * The flag is read here rather than in init_rest_api() so a filter added
	 * after the bootstrap ran still decides.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public static function register_rest_routes() {
		if ( ! self::is_api_managed_enabled() ) {
			return;
		}

		PayPal_REST_Controller::register_routes();
	}

	/**
	 * Integrate with Jetpack Sharing (Sharedaddy) if available.
	 *
	 * Ensures sharing buttons appear on pages containing the PayPal
	 * payment button block. Gracefully no-ops when Jetpack or the
	 * Sharedaddy module is not active.
	 *
	 * @since 0.9.0
	 * @since $$next-version$$ Public, runs on `init`, and no-ops unless the API-managed buttons are enabled.
	 * @return void
	 */
	public static function init_jetpack_sharing() {
		// Only register if Jetpack + Sharedaddy are active.
		if (
			! self::is_api_managed_enabled()
			|| ! class_exists( 'Jetpack' )
			|| ! method_exists( 'Jetpack', 'is_module_active' )
			|| ! \Jetpack::is_module_active( 'sharedaddy' )
		) {
			return;
		}

		add_filter( 'sharing_show', array( __CLASS__, 'enable_sharing_on_payment_pages' ), 10, 2 );
	}

	/**
	 * Enable Jetpack Sharing buttons on pages containing the PayPal block.
	 *
	 * Callback for the 'sharing_show' filter. Returns true if the current
	 * post contains the PayPal payment buttons block, otherwise passes
	 * through the existing value unchanged.
	 *
	 * @param bool     $show Whether to show sharing buttons.
	 * @param \WP_Post $post The current post object.
	 * @return bool Whether to show sharing buttons.
	 */
	public static function enable_sharing_on_payment_pages( $show, $post = null ) {
		if ( $show ) {
			return $show; // Already enabled by another filter — don't interfere.
		}

		if ( ! $post instanceof \WP_Post ) {
			return $show;
		}

		if ( has_block( 'jetpack/paypal-payment-buttons', $post ) ) {
			return true;
		}

		return $show;
	}

	/**
	 * Initialize admin dashboard hooks.
	 *
	 * Registers the Payment Links admin page for managing
	 * all merchant payment links from wp-admin.
	 *
	 * @since 0.9.0
	 * @since $$next-version$$ Defers to `init` and no-ops unless the API-managed buttons are enabled.
	 */
	public static function init_admin() {
		add_action(
			'init',
			static function () {
				// Read the flag before naming the classes, so neither is autoloaded while it is off.
				if ( ! self::is_api_managed_enabled() ) {
					return;
				}

				PayPal_Admin_Page::maybe_init();
				PayPal_Email_Sender::maybe_init();
			}
		);
	}

	/**
	 * Register empty script stubs for Jetpack dependencies that may not be available
	 * when the plugin runs outside the full Jetpack monorepo (e.g., WordPress Playground).
	 *
	 * The wp_script_is() guard ensures this is a no-op inside the full Jetpack plugin
	 * where the real handle is already registered by the Assets package.
	 *
	 * @since 0.8.0
	 * @return void
	 */
	public static function register_standalone_script_stubs() {
		/*
		 * The Jetpack plugin registers the real handle from Script_Data on wp_loaded,
		 * which fires after init. Registering a stub first therefore wins, and the
		 * editor is left without window.JetpackScriptData.
		 */
		if ( class_exists( 'Jetpack' ) ) {
			return;
		}

		if ( ! wp_script_is( 'jetpack-script-data', 'registered' ) ) {
			wp_register_script( 'jetpack-script-data', false, array(), '1.0.0', false );
		}
	}
}
