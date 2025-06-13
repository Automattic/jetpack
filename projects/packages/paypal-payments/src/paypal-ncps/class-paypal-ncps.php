<?php
/**
 * PayPal No-Code Payment Solution (NCPS) block lets users embed a PayPal button to sell products on their site.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Paypal_Payments;

/**
 * Class Paypal_NCPS
 *
 * @package Automattic\Jetpack\PaypalPayments
 */
class Paypal_NCPS {
	/**
	 * The block full slugname.
	 *
	 * @var string
	 */
	public const BLOCK_NAME = 'jetpack/paypal-ncps';

	/**
	 * The package version.
	 *
	 * @var string
	 */
	private const PACKAGE_VERSION = PayPal_Payments::PACKAGE_VERSION;

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
	public static function render_block( $attributes, $content ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$button_type = $attributes['buttonType'] ?? '';
		$code_head   = $attributes['codeHead'] ?? '';
		$code_body   = $attributes['codeBody'] ?? '';

		if ( empty( $button_type ) || empty( $code_body ) ) {
			return;
		}

		if ( 'stacked' === $button_type && ! empty( $code_head ) ) {
			if ( preg_match( '/src="(https:\/\/www\.paypal\.com\/sdk\/js\?client-id=.+)"/', $code_head, $matches ) ) {
				$script_url = esc_url( $matches[1] );
				if ( ! empty( $script_url ) ) {
					// We can't include the version number here. If we do, it is appended to the URL and causes a 400 response.
					wp_enqueue_script( 'paypal-ncps-block-head', $script_url, array(), null, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
					add_filter(
						'script_loader_tag',
						function ( $tag, $handle, $src ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
					$action    = add_query_arg( 'at_code', 'WooNCPS_Ecom_Wordpress', $action );
					$code_body = preg_replace( '/(\s+action=[\'"])[^\'"]+([\'"])/', '$1' . $action . '$2', $code_body );
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

		return wp_kses( $code_body, $allow_html );
	}

	/**
	 * Load editor styles for the block.
	 * These are loaded via enqueue_block_assets to ensure proper loading in the editor iframe context.
	 */
	public static function load_editor_styles() {
		$handle = 'jp-paypal-payments-ncps-blocks';

		Assets::register_script(
			$handle,
			'../../dist/paypal-ncps-block/editor.js',
			__FILE__,
			array(
				'css_path'   => '../../dist/paypal-ncps/editor.css',
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
			'../../dist/paypal-ncps/editor.js',
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
}
