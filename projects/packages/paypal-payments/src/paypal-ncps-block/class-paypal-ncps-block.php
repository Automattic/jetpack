<?php
/**
 * PayPal No-Code Payment Solution (NCPS) block lets users embed a PayPal button to sell products on their site.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\Paypal_Payments;

use Automattic\Jetpack\Blocks;

/**
 * Class Paypal_NCPS_Block
 *
 * @package Automattic\Jetpack\Paypal_Payments
 */
class Paypal_NCPS_Block {
	/**
	 * The block full slugname.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'jetpack/paypal-ncps-block';

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
	 * @return string The block content.
	 */
	public static function render_block( $attributes, $content ) {
		$button_type = $attributes['buttonType'] ?? '';
		$code_head   = $attributes['codeHead'] ?? '';
		$code_body   = $attributes['codeBody'] ?? '';

		if ( empty( $button_type ) || empty( $code_body ) ) {
			return;
		}

		if ( 'stacked' === $button_type && ! empty( $code_head ) ) {
			if ( preg_match( '/src="(.+)"/', $code_head, $matches ) ) {
				$script_url = esc_url( $matches[1] );
				if ( ! empty( $script_url ) ) {
					wp_enqueue_script( 'paypal-ncps-block-head', $script_url, array(), null, false );
					add_filter(
						'script_loader_tag',
						function ( $tag, $handle, $src ) {
							if ( 'paypal-ncps-block-head' === $handle ) {
								if ( false === strpos( $tag, 'data-paypal-partner-attribution-id' ) ) {
									$tag = preg_replace( '/(\s+)src=([\'"])/', '$1 data-paypal-partner-attribution-id="WooNCPS_Ecom_Wordpress" src=$2', $tag );
								}
							}
							return $tag;
						},
						10,
						3
					);
				}
			}
		}

		if ( 'single' === $button_type ) {
			$code_body = str_replace( 'inline-grid', 'grid', $code_body );
			$attr_code = 'at_code=WooNCPS_Ecom_Wordpress';
			if ( preg_match( '/\s+action=[\'"]([^\'"]+)[\'"]/', $code_body, $matches ) ) {
				$action = esc_url( $matches[1] );
				if ( ! empty( $action ) && false === strpos( $action, $attr_code ) ) {
					$parsed_url_parts   = wp_parse_url( $action );
					$prepared_attr_code = isset( $parsed_url_parts['query'] ) ? '&' . $attr_code : '?' . $attr_code;
					$action             = $action . $prepared_attr_code;
					$code_body          = preg_replace( '/(\s+action=[\'"])[^\'"]+([\'"])/', '$1' . $action . '$2', $code_body );
				}
			}
		}

		$allow_html = 'single' === $button_type ? array(
			'style'   => array(),
			'form'    => array(
				'action' => array(),
				'method' => array(),
				'style'  => array(),
			),
			'input'   => array(
				'class' => array(),
				'type'  => array(),
				'value' => array(),
			),
			'img'     => array(
				'src'   => array(),
				'alt'   => array(),
				'style' => array(),
			),
			'section' => array(
				'style' => array(),
			),
		) : array(
			'div'    => array(
				'id' => array(),
			),
			'script' => array(),
		);

		$code_body = wp_kses( $code_body, $allow_html );

		// Already escaped in wp_kses above.
		return $code_body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
