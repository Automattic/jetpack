<?php
/**
 * Pay with PayPal block (aka Simple Payments).
 *
 * @since jetpack-9.0.0
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments\SimplePayments;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Paypal_Payments\Simple_Payments;
use Automattic\Jetpack\Status\Request;
use WP_Post;

/**
 * Register and render the block.
 */
class Block {
	/**
	 * The block full slugname.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'jetpack/simple-payments';

	/**
	 * Registers the block for use in Gutenberg
	 * This is done via an action so that we can disable
	 * registration if we need to.
	 */
	public static function register_block() {
		if ( ! Jetpack_Plan::supports( 'simple-payments' ) ) {
			return;
		}

		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => array( __CLASS__, 'render_block' ) )
		);
	}

	/**
	 * Pay with PayPal block dynamic rendering.
	 *
	 * @param array  $attr    Array containing the block attributes.
	 * @param string $content String containing the block content.
	 *
	 * @return string
	 */
	public static function render_block( $attr, $content ) {
		// Do nothing if block content is a `simple-payment` shortcode.
		if ( preg_match( '/\[simple-payment(.*)]/', $content ) ) {
			return $content;
		}

		// Keep content as-is if rendered in other contexts than frontend (i.e. feed, emails, API, etc.).
		if ( ! Request::is_frontend() ) {
			return $content;
		}

		$simple_payments = Simple_Payments::get_instance();

		if ( ! $simple_payments->is_valid( $attr ) ) {
			return '';
		}

		$simple_payments->enqueue_frontend_assets();

		// For AMP requests, make sure the purchase link redirects to the non-AMP post URL.
		if ( Blocks::is_amp_request() ) {
			$content = preg_replace(
				'#(<a class="jetpack-simple-payments-purchase".*)rel="(.*)"(.*>.*</a>)#i',
				'$1rel="$2 noamphtml"$3',
				$content
			);
			return $content;
		}

		// Augment block UI with a PayPal button if rendered on the frontend.
		$product_id  = $attr['productId'];
		$dom_id      = wp_unique_id( "jetpack-simple-payments-{$product_id}_" );
		$is_multiple = get_post_meta( $product_id, 'spay_multiple', true ) || '0';

		$simple_payments->setup_paypal_checkout_button( $product_id, $dom_id, $is_multiple );

		$purchase_box = $simple_payments->output_purchase_box( $dom_id, $is_multiple );
		$content      = preg_replace( '#<a class="jetpack-simple-payments-purchase(.*)</a>#i', $purchase_box, $content );

		return $content;
	}

	/**
	 * Load editor styles for the block.
	 * These are loaded via enqueue_block_assets to ensure proper loading in the editor iframe context.
	 */
	public static function load_editor_styles() {
		$handle = 'jp-paypal-payments-blocks';

		Assets::register_script(
			$handle,
			'../../dist/block/editor.js',
			__FILE__,
			array(
				'css_path'   => '../../dist/block/editor.css',
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
			'jp-paypal-payments-blocks',
			'../../dist/block/editor.js',
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
	 * Determine if AMP should be disabled on posts having "Pay with PayPal" blocks.
	 *
	 * @param bool    $skip Skipped.
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post Post.
	 *
	 * @return bool Whether to skip the post from AMP.
	 */
	public static function amp_skip_post( $skip, $post_id, $post ) {
		/*
		 * When AMP is on standard mode,
		 * there are no non-AMP posts to link to where
		 * the purchase can be completed,
		 * so let's prevent the post from being available in AMP.
		 */
		if (
			function_exists( 'amp_is_canonical' )
			&& \amp_is_canonical()
			&& has_block( self::BLOCK_NAME, $post->post_content )
		) {
			return true;
		}

		return $skip;
	}
}
