<?php
/**
 * Promote-with-Blaze opt-in panel on the WooCommerce product editor.
 *
 * Renders a sidebar metabox on the classic editor for `product`
 * post type. Gated on:
 *  - the `blaze-featured-woocommerce-site` WPCOM site sticker, and
 *  - the standard Blaze initialization checks (Jetpack-connected,
 *    user connected, sync enabled, site eligible).
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Blaze;
use WP_Post;

/**
 * Woo product promote panel.
 */
class Woo_Product_Panel {

	const META_KEY            = '_jetpack_blaze_promote';
	const NONCE_ACTION        = 'jetpack_blaze_woo_product_promote';
	const NONCE_FIELD         = 'jetpack_blaze_woo_product_promote_nonce';
	const STICKER             = 'blaze-featured-woocommerce-site';
	const METABOX_ID          = 'jetpack_blaze_woo_product_promote';
	const PROMOTE_HOOK        = 'jetpack_blaze_woo_product_promote_requested';
	const PROMOTION_PROCESSED = '_jetpack_blaze_promote_dispatched';

	/**
	 * Wire WordPress hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_meta' ) );
		add_action( 'add_meta_boxes_product', array( __CLASS__, 'register_metabox' ) );
		add_action( 'save_post_product', array( __CLASS__, 'save_meta' ), 10, 2 );
		// Run after save_meta so the checkbox value is persisted before we
		// decide whether to dispatch.
		add_action( 'save_post_product', array( __CLASS__, 'maybe_dispatch_promote' ), 20, 2 );
		// Woo seeds a fixed `meta-box-order_product` user meta that places our
		// metabox after Woo's own boxes. Splice ours in right after Publish.
		add_filter( 'get_user_option_meta-box-order_product', array( __CLASS__, 'filter_metabox_order' ) );
	}

	/**
	 * Splice our metabox into the saved side-column order so it lands between
	 * `submitdiv` (Publish) and `postimagediv` (Product image).
	 *
	 * @param mixed $order Saved meta box order. Array keyed by context, or empty.
	 * @return mixed
	 */
	public static function filter_metabox_order( $order ) {
		if ( ! is_array( $order ) || empty( $order['side'] ) || ! is_string( $order['side'] ) ) {
			return $order;
		}
		$boxes = array_values( array_filter( array_map( 'trim', explode( ',', $order['side'] ) ) ) );
		// Drop any existing entry so we end up with at most one.
		$boxes = array_values( array_filter( $boxes, static fn ( $b ) => $b !== self::METABOX_ID ) );

		$insert_at = array_search( 'submitdiv', $boxes, true );
		$insert_at = false === $insert_at ? 0 : $insert_at + 1;
		array_splice( $boxes, $insert_at, 0, array( self::METABOX_ID ) );

		$order['side'] = implode( ',', $boxes );
		return $order;
	}

	/**
	 * Whether the panel should render on the current site/screen.
	 *
	 * Combines the sticker check with the standard Blaze init checks.
	 *
	 * @return bool
	 */
	public static function should_render() {
		if ( ! self::is_featured_woocommerce_site() ) {
			return false;
		}
		if ( ! class_exists( 'WooCommerce' ) ) {
			return false;
		}
		$can = Blaze::should_initialize();
		return ! empty( $can['can_init'] );
	}

	/**
	 * Check the `blaze-featured-woocommerce-site` WPCOM site sticker.
	 *
	 * Uses the canonical wrapper when available (Simple + Atomic), and
	 * exposes a filter so the check can be forced in tests / mu-plugins.
	 *
	 * @return bool
	 */
	public static function is_featured_woocommerce_site() {
		$has_sticker = false;

		if ( function_exists( 'wpcom_has_blog_sticker' ) ) {
			$blog_id     = method_exists( '\Automattic\Jetpack\Connection\Manager', 'get_site_id' )
				? \Automattic\Jetpack\Connection\Manager::get_site_id()
				: 0;
			$blog_id     = is_numeric( $blog_id ) ? (int) $blog_id : 0;
			$has_sticker = wpcom_has_blog_sticker( self::STICKER, $blog_id );
		} elseif ( function_exists( 'has_blog_sticker' ) ) {
			$has_sticker = (bool) has_blog_sticker( self::STICKER );
		} elseif ( function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
			$has_sticker = (bool) wpcomsh_is_site_sticker_active( self::STICKER );
		}

		/**
		 * Override the `blaze-featured-woocommerce-site` sticker lookup.
		 *
		 * Lets self-hosted sites opt in (or force-disable) the WooCommerce
		 * product promote panel without a WPCOM sticker.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $has_sticker Whether the site has the sticker.
		 */
		return (bool) apply_filters( 'jetpack_blaze_featured_woocommerce_site', $has_sticker );
	}

	/**
	 * Register the `_jetpack_blaze_promote` product meta.
	 *
	 * Default is `true` — the checkbox starts checked.
	 *
	 * @return void
	 */
	public static function register_meta() {
		register_post_meta(
			'product',
			self::META_KEY,
			array(
				'type'              => 'boolean',
				'single'            => true,
				'default'           => true,
				'show_in_rest'      => true,
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
				'sanitize_callback' => static function ( $value ) {
					return (bool) $value;
				},
			)
		);
	}

	/**
	 * Register the sidebar metabox on the product edit screen.
	 *
	 * Priority `default` keeps the panel between the Publish box (priority
	 * `core`) and the Product image box (priority `low`).
	 *
	 * @param WP_Post $post The product being edited.
	 * @return void
	 */
	public static function register_metabox( $post ) {
		if ( ! self::should_render() ) {
			return;
		}
		add_meta_box(
			self::METABOX_ID,
			__( 'Blaze Ads', 'jetpack-blaze' ),
			array( __CLASS__, 'render_metabox' ),
			'product',
			'side',
			'default'
		);
	}

	/**
	 * Render the metabox.
	 *
	 * @param WP_Post $post The product being edited.
	 * @return void
	 */
	public static function render_metabox( $post ) {
		$stored = get_post_meta( $post->ID, self::META_KEY, true );
		// Default to checked when the meta has never been written.
		$checked = ( '' === $stored ) ? true : (bool) $stored;

		wp_nonce_field( self::NONCE_ACTION, self::NONCE_FIELD );
		?>
		<p class="jetpack-blaze-woo-product-promote">
			<label>
				<input
					type="checkbox"
					name="<?php echo esc_attr( self::META_KEY ); ?>"
					value="1"
					<?php checked( $checked, true ); ?>
				/>
				<?php esc_html_e( 'Promote it free with Blaze Ads', 'jetpack-blaze' ); ?>
			</label>
			<a
				href="#"
				class="jetpack-blaze-woo-product-promote-info"
				aria-expanded="false"
				aria-controls="jetpack-blaze-woo-product-promote-help"
			>
				<?php esc_html_e( 'more info', 'jetpack-blaze' ); ?>
			</a>
		</p>
		<div id="jetpack-blaze-woo-product-promote-help" class="jetpack-blaze-woo-product-promote-help" hidden>
			<p>
				<?php
				esc_html_e(
					'When checked, this product is eligible for a free Blaze Ads promotion when you publish it. Conditions: TBD.',
					'jetpack-blaze'
				);
				?>
			</p>
		</div>
		<style>
			.jetpack-blaze-woo-product-promote-info { margin-left: 6px; }
			.jetpack-blaze-woo-product-promote-help {
				margin-top: 8px;
				padding: 8px 10px;
				background: #f6f7f7;
				border-left: 3px solid #2271b1;
			}
		</style>
		<script>
		( function () {
			var link = document.querySelector( '.jetpack-blaze-woo-product-promote-info' );
			var help = document.getElementById( 'jetpack-blaze-woo-product-promote-help' );
			if ( ! link || ! help ) { return; }
			link.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				var open = help.hasAttribute( 'hidden' );
				if ( open ) {
					help.removeAttribute( 'hidden' );
					link.setAttribute( 'aria-expanded', 'true' );
				} else {
					help.setAttribute( 'hidden', '' );
					link.setAttribute( 'aria-expanded', 'false' );
				}
			} );
		} )();
		</script>
		<?php
	}

	/**
	 * Persist the checkbox value when the product is saved.
	 *
	 * @param int     $post_id Product ID.
	 * @param WP_Post $post    The product object.
	 * @return void
	 */
	public static function save_meta( $post_id, $post ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! isset( $_POST[ self::NONCE_FIELD ] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ), self::NONCE_ACTION ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$checked = ! empty( $_POST[ self::META_KEY ] );
		update_post_meta( $post_id, self::META_KEY, $checked );

		// Allow re-dispatch on the next publish if the product is being unpublished.
		if ( 'publish' !== $post->post_status ) {
			delete_post_meta( $post_id, self::PROMOTION_PROCESSED );
		}
	}

	/**
	 * Fire the promote-requested hook the first time the product is published
	 * with the opt-in meta set to true.
	 *
	 * Runs on `save_post_product` (priority 20) — after `save_meta` has
	 * persisted the checkbox value for this request.
	 *
	 * @param int     $post_id Product ID.
	 * @param WP_Post $post    Product post object.
	 * @return void
	 */
	public static function maybe_dispatch_promote( $post_id, $post ) {
		if ( ! $post instanceof WP_Post || 'product' !== $post->post_type ) {
			return;
		}
		if ( 'publish' !== $post->post_status ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		if ( ! (bool) get_post_meta( $post_id, self::META_KEY, true ) ) {
			return;
		}
		if ( (bool) get_post_meta( $post_id, self::PROMOTION_PROCESSED, true ) ) {
			return;
		}

		update_post_meta( $post_id, self::PROMOTION_PROCESSED, 1 );

		/**
		 * Fires when a WooCommerce product is published with the
		 * Promote-with-Blaze opt-in checked.
		 *
		 * Consumers can hook here to kick off a Blaze campaign creation
		 * flow for the product.
		 *
		 * @since $$next-version$$
		 *
		 * @param int     $product_id The product post ID.
		 * @param WP_Post $product    The product post object.
		 */
		do_action( self::PROMOTE_HOOK, $post_id, $post );
	}
}
