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
	private static function render_api_managed_button( $attributes ) {
		$resource_id  = $attributes['resourceId'] ?? '';
		$payment_url  = $attributes['paymentLink'] ?? '';
		$product_name = $attributes['productName'] ?? '';
		$price        = $attributes['price'] ?? '';
		$currency     = $attributes['currencyCode'] ?? 'USD';
		$button_label = $attributes['buttonText'] ?? __( 'Buy Now', 'jetpack-paypal-payments' );

		if ( empty( $resource_id ) || empty( $payment_url ) ) {
			return;
		}

		// Validate the payment URL is from a legitimate PayPal domain.
		$sanitized_payment_url = self::sanitize_paypal_script_url( $payment_url );
		if ( false === $sanitized_payment_url ) {
			return;
		}

		self::register_hooks();

		// Append BN code for revenue attribution tracking.
		$action_url = esc_url(
			add_query_arg( 'at_code', self::PAYPAL_PARTNER_ATTRIBUTION_ID, $sanitized_payment_url )
		);

		$payment_id           = esc_attr( $resource_id );
		$button_text_escaped  = esc_attr( $button_label );
		$product_name_escaped = esc_html( $product_name );
		$price_display        = esc_html( $price . ' ' . $currency );

		return sprintf(
			'<div class="wp-block-jetpack-paypal-payment-buttons paypal-api-button">
	<div class="paypal-api-button__product">
		<span class="paypal-api-button__name">%1$s</span>
		<span class="paypal-api-button__price">%2$s</span>
	</div>
	<form action="%3$s" method="post" target="_blank" class="paypal-api-button__form">
		<input class="paypal-api-button__submit pp-%4$s" type="submit" value="%5$s" />
		<img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="%6$s" />
		<span class="paypal-api-button__powered-by">%7$s <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="PayPal" /></span>
	</form>
</div>',
			$product_name_escaped,
			$price_display,
			$action_url,
			$payment_id,
			$button_text_escaped,
			esc_attr__( 'Accepted payment methods', 'jetpack-paypal-payments' ),
			esc_html__( 'Powered by', 'jetpack-paypal-payments' )
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
						if ( ! str_contains( $tag, 'data-namespace' ) ) {
							$tag = preg_replace( '/(\s+)src=([\'"])/', '$1 data-namespace="paypal_payment_buttons" src=$2', $tag );
						}
						// Add partner attribution ID
						if ( ! str_contains( $tag, 'data-paypal-partner-attribution-id' ) ) {
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
	 * Initialize PayPal Payment Buttons API integration hooks.
	 *
	 * Registers REST API routes for PayPal OAuth connection management
	 * and button CRUD operations.
	 *
	 * @since 0.7.0
	 * @return void
	 */
	public static function init_api() {
		add_action( 'rest_api_init', array( PayPal_REST_Controller::class, 'register_routes' ) );
	}
}
