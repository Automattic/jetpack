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

		if ( empty( $button_type ) || empty( $hosted_button_id ) ) {
			return;
		}

		// For stacked buttons, we need both scriptSrc and hostedButtonId
		if ( 'stacked' === $button_type && empty( $script_src ) ) {
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
						if ( false === strpos( $tag, 'data-paypal-partner-attribution-id' ) ) {
							$tag = preg_replace( '/(\s+)src=([\'"])/', '$1 data-paypal-partner-attribution-id="WooNCPS_Ecom_Wordpress" src=$2', $tag );
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

		// Single button type - for now, we'll treat it the same as stacked
		// but without requiring a separate script (since it might be a simple form)
		if ( 'single' === $button_type ) {
			// Generate the button HTML similar to stacked
			$container_id = 'paypal-container-' . esc_attr( $hosted_button_id );
			return '<div id="' . esc_attr( $container_id ) . '"></div>';
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
