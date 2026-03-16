<?php
/**
 * PayPal Payment Buttons block lets users embed a PayPal button to sell products on their site.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;

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
			$sanitized_url .= '?' . $parsed_url['query'];
		}

		return $sanitized_url;
	}

	/**
	 * Registers the block for use in Gutenberg
	 * This is done via an action so that we can disable
	 * registration if we need to.
	 */
	public static function register_block() {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => array( __CLASS__, 'render_block' ),
				'plan_check'      => true,
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
		'RUB' => '₽',
	);

	/**
	 * Format a price with its currency symbol.
	 *
	 * @param string $price    The price value.
	 * @param string $currency The ISO currency code.
	 * @return string Formatted price string (e.g., "$29.99").
	 */
	public static function format_price( $price, $currency ) {
		$symbol = isset( self::$currency_symbols[ $currency ] ) ? self::$currency_symbols[ $currency ] : $currency;
		return $symbol . $price;
	}

	/**
	 * PayPal logo SVG markup for frontend button rendering.
	 * Matches the inline SVG from paypal-button-preview.js.
	 *
	 * @return string SVG markup.
	 */
	private static function get_paypal_logo_svg() {
		return '<svg class="jetpack-paypal-button__logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101 32" width="80" height="20" aria-label="PayPal">'
			. '<path d="M12.5 4.7h-7c-.5 0-.9.3-1 .8L1.6 25c0 .3.2.6.6.6h3.3c.5 0 .9-.3 1-.8l.8-5.4c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6C16.7 5.5 14.9 4.7 12.5 4.7zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.4.5.5 1.2.2 2z" fill="#253B80"/>'
			. '<path d="M35.2 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.4-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.6 1.3.5 2.1z" fill="#253B80"/>'
			. '<path d="M55.1 11.3h-3.4c-.3 0-.6.2-.8.4l-4.5 6.6-1.9-6.4c-.1-.4-.5-.6-.9-.6h-3.3c-.4 0-.7.4-.5.7l3.6 10.5-3.4 4.8c-.3.4 0 .9.4.9h3.3c.3 0 .6-.1.8-.4l10.9-15.7c.3-.4 0-.8-.3-.8z" fill="#253B80"/>'
			. '<path d="M67.4 4.7h-7c-.5 0-.9.3-1 .8L56.5 25c0 .3.2.6.6.6h3.5c.3 0 .6-.2.7-.6l.8-5.2c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6-1.1-1.2-2.9-1.9-5.2-1.9zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.3.5.4 1.2.2 2z" fill="#179BD7"/>'
			. '<path d="M90.1 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.3-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.5 1.3.5 2.1z" fill="#179BD7"/>'
			. '<path d="M95.1 5.2l-3 19.9c0 .3.2.6.6.6h2.9c.5 0 .9-.3 1-.8L99.5 5.5c0-.3-.2-.6-.6-.6h-3.2c-.2 0-.5.1-.6.3z" fill="#179BD7"/>'
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
		$button_text         = $attributes['buttonText'] ?? __( 'Pay Now', 'jetpack-paypal-payments' );
		$button_type         = $attributes['buttonType'] ?? 'stacked';
		$product_description = $attributes['productDescription'] ?? '';
		$image_url           = $attributes['imageUrl'] ?? '';

		if ( empty( $resource_id ) || empty( $payment_url ) ) {
			return;
		}

		// Validate the payment URL is from a legitimate PayPal domain.
		$sanitized_payment_url = self::sanitize_paypal_script_url( $payment_url );
		if ( false === $sanitized_payment_url ) {
			return;
		}

		self::register_hooks();
		self::enqueue_qr_script();

		// Append BN code for revenue attribution tracking.
		$action_url = esc_url(
			add_query_arg( 'at_code', self::PAYPAL_PARTNER_ATTRIBUTION_ID, $sanitized_payment_url )
		);

		$is_stacked = 'stacked' === $button_type;

		// Build product image.
		$image_html = '';
		if ( ! empty( $image_url ) ) {
			$sanitized_image = esc_url( $image_url );
			if ( $sanitized_image ) {
				$image_html = sprintf(
					'<div class="jetpack-paypal-button__image"><img src="%s" alt="%s" loading="lazy" /></div>',
					$sanitized_image,
					esc_attr( $product_name )
				);
			}
		}

		// Build product info section.
		$description_html = '';
		if ( ! empty( $product_description ) ) {
			$description_html = sprintf(
				'<span class="jetpack-paypal-button__product-description">%s</span>',
				esc_html( $product_description )
			);
		}

		$price_html = '';
		if ( ! empty( $price ) ) {
			$price_html = sprintf(
				'<span class="jetpack-paypal-button__product-price">%s</span>',
				esc_html( self::format_price( $price, $currency ) )
			);
		}

		// Build debit/credit secondary button (stacked layout only).
		$debit_button_html = '';
		if ( $is_stacked ) {
			$debit_button_html = sprintf(
				'<a href="%s" class="jetpack-paypal-button__debit-link" target="_blank" rel="noopener noreferrer">%s</a>',
				$action_url,
				esc_html__( 'Debit or Credit Card', 'jetpack-paypal-payments' )
			);
		}

		$paypal_logo = self::get_paypal_logo_svg();

		return sprintf(
			'<div class="wp-block-jetpack-paypal-payment-buttons">
	<div class="jetpack-paypal-button">
		%10$s
		<div class="jetpack-paypal-button__product">
			<div class="jetpack-paypal-button__product-info">
				<span class="jetpack-paypal-button__product-name">%1$s</span>
				%2$s
			</div>
			%3$s
		</div>
		<div class="jetpack-paypal-button__buttons jetpack-paypal-button__buttons--%4$s">
			<a href="%5$s" class="jetpack-paypal-button__paypal-link" target="_blank" rel="noopener noreferrer">
				%6$s
				<span class="jetpack-paypal-button__button-text">%7$s</span>
			</a>
			%8$s
		</div>
		<p class="jetpack-paypal-button__attribution">%9$s</p>
		<div class="jetpack-paypal-button__qr-section">
			<button type="button" class="jetpack-paypal-button__qr-toggle" data-show-label="%11$s" data-hide-label="%12$s" aria-expanded="false">%11$s</button>
			<div class="jetpack-paypal-button__qr-wrapper" style="display:none;">
				<canvas class="jetpack-paypal-button__qr-canvas"></canvas>
				<button type="button" class="jetpack-paypal-button__qr-download">%13$s</button>
			</div>
		</div>
	</div>
</div>',
			esc_html( $product_name ),
			$description_html,
			$price_html,
			esc_attr( $button_type ),
			$action_url,
			$paypal_logo,
			esc_html( $button_text ),
			$debit_button_html,
			esc_html__( 'Powered by PayPal', 'jetpack-paypal-payments' ),
			$image_html,
			esc_attr__( 'Show QR Code', 'jetpack-paypal-payments' ),
			esc_attr__( 'Hide QR Code', 'jetpack-paypal-payments' ),
			esc_html__( 'Download QR Code', 'jetpack-paypal-payments' )
		);
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

			$script_url = esc_url( $sanitized_url );
			// We can't include the version number here. If we do, it is appended to the URL and causes a 400 response.
			wp_enqueue_script( 'paypal-payment-buttons-block-head', $script_url, array(), null, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
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
	 * Register hooks.
	 */
	public static function register_hooks() {
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
		add_action( 'rest_api_init', array( PayPal_REST_Controller::class, 'register_routes' ) );
	}

	/**
	 * Initialize admin dashboard hooks.
	 *
	 * Registers the Payment Links admin page for managing
	 * all merchant payment links from wp-admin.
	 *
	 * @since 0.9.0
	 */
	public static function init_admin() {
		PayPal_Admin_Page::init();
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
		if ( ! wp_script_is( 'jetpack-script-data', 'registered' ) ) {
			wp_register_script( 'jetpack-script-data', false, array(), '1.0.0', false );
		}
	}
}
