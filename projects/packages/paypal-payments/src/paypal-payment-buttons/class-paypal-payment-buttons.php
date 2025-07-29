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
	 * Registers the block for use in Gutenberg
	 * This is done via an action so that we can disable
	 * registration if we need to.
	 */
	public static function register_block() {
		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => array( __CLASS__, 'render_block' ) )
		);
	}

	/**
	 * Render the block.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content The block content.
	 * @return string|void
	 */
	public static function render_block( $attributes, $content ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
			$script_url = esc_url( $script_src );
			// We can't include the version number here. If we do, it is appended to the URL and causes a 400 response.
			wp_enqueue_script( 'paypal-payment-buttons-block-head', $script_url, array(), null, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			add_filter(
				'script_loader_tag',
				function ( $tag, $handle, $src ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					if ( 'paypal-payment-buttons-block-head' === $handle ) {
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
			$container_id = 'paypal-container-' . esc_attr( $hosted_button_id );
			$button_html  = '<div id="' . $container_id . '"></div>';

			$inline_script = sprintf(
				'paypal.HostedButtons({
					hostedButtonId: "%s",
				}).render("#%s");',
				esc_js( $hosted_button_id ),
				esc_js( $container_id )
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
<form action="%2$s" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
  <input class="pp-%1$s" type="submit" value="%3$s" />
  <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
  <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section>
</form>',
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
}
