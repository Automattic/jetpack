<?php
/**
 * Orders paid through the on-site PayPal checkout.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Orders
 *
 * Keeps a record of every order the site captured, so a merchant has one
 * without opening PayPal. No admin screen reads it yet.
 *
 * @since $$next-version$$
 */
class PayPal_Orders {

	/**
	 * The post type an order is stored as.
	 *
	 * @var string
	 */
	const POST_TYPE = 'jp_paypal_order';

	/**
	 * Meta keys on an order post.
	 *
	 * @var string
	 */
	const META_ORDER_ID    = '_jetpack_paypal_order_id';
	const META_CAPTURE_ID  = '_jetpack_paypal_capture_id';
	const META_STATUS      = '_jetpack_paypal_status';
	const META_RESOURCE_ID = '_jetpack_paypal_resource_id';
	const META_ITEM_NAME   = '_jetpack_paypal_item_name';
	const META_OPTIONS     = '_jetpack_paypal_options';
	const META_QUANTITY    = '_jetpack_paypal_quantity';
	const META_UNIT_AMOUNT = '_jetpack_paypal_unit_amount';
	const META_TOTAL       = '_jetpack_paypal_total';
	const META_CURRENCY    = '_jetpack_paypal_currency';
	const META_PAYER_EMAIL = '_jetpack_paypal_payer_email';
	const META_PAYER_NAME  = '_jetpack_paypal_payer_name';
	const META_ENVIRONMENT = '_jetpack_paypal_environment';

	/**
	 * Register the order post type, once the API-managed buttons are enabled.
	 *
	 * @return void
	 */
	public static function register_post_type() {
		if ( ! PayPal_Payment_Buttons::is_api_managed_enabled() ) {
			return;
		}

		register_post_type(
			self::POST_TYPE,
			array(
				'label'               => esc_html_x( 'PayPal order', 'noun: a purchase made through a PayPal button', 'jetpack-paypal-payments' ),
				'description'         => esc_html__( 'Orders paid through PayPal Payment Buttons', 'jetpack-paypal-payments' ),
				'supports'            => array( 'title', 'custom-fields' ),
				'public'              => false,
				'show_ui'             => false,
				'show_in_menu'        => false,
				'show_in_rest'        => false,
				'can_export'          => true,
				'exclude_from_search' => true,
				'publicly_queryable'  => false,
				'rewrite'             => false,
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
			)
		);
	}

	/**
	 * Store a captured order.
	 *
	 * An order captured twice, which PayPal answers with the same order, is stored once.
	 *
	 * @param array $order The captured order, as PayPal returns it.
	 * @return int|\WP_Error The order post id.
	 */
	public static function record( array $order ) {
		$order_id = sanitize_text_field( $order['id'] ?? '' );
		if ( '' === $order_id ) {
			return new \WP_Error( 'paypal_order_missing_id', __( 'PayPal returned an order without an id.', 'jetpack-paypal-payments' ) );
		}

		$existing = self::find( $order_id );
		if ( $existing ) {
			return $existing;
		}

		$unit    = $order['purchase_units'][0] ?? array();
		$item    = $unit['items'][0] ?? array();
		$capture = $unit['payments']['captures'][0] ?? array();
		$payer   = $order['payer'] ?? array();
		$name    = sanitize_text_field( $item['name'] ?? ( $unit['description'] ?? '' ) );
		$payer_n = trim( sanitize_text_field( ( $payer['name']['given_name'] ?? '' ) . ' ' . ( $payer['name']['surname'] ?? '' ) ) );

		$post_id = wp_insert_post(
			array(
				'post_type'   => self::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => sprintf(
					/* translators: 1: item name, 2: quantity bought */
					__( '%1$s x %2$s', 'jetpack-paypal-payments' ),
					$name,
					absint( $item['quantity'] ?? 1 )
				),
				'meta_input'  => array(
					self::META_ORDER_ID    => $order_id,
					self::META_CAPTURE_ID  => sanitize_text_field( $capture['id'] ?? '' ),
					self::META_STATUS      => sanitize_text_field( $capture['status'] ?? ( $order['status'] ?? '' ) ),
					self::META_RESOURCE_ID => sanitize_text_field( $unit['custom_id'] ?? '' ),
					self::META_ITEM_NAME   => $name,
					self::META_OPTIONS     => sanitize_text_field( $item['description'] ?? '' ),
					self::META_QUANTITY    => absint( $item['quantity'] ?? 1 ),
					self::META_UNIT_AMOUNT => sanitize_text_field( $item['unit_amount']['value'] ?? '' ),
					self::META_TOTAL       => sanitize_text_field( $capture['amount']['value'] ?? ( $unit['amount']['value'] ?? '' ) ),
					self::META_CURRENCY    => sanitize_text_field( $capture['amount']['currency_code'] ?? ( $unit['amount']['currency_code'] ?? '' ) ),
					self::META_PAYER_EMAIL => sanitize_email( $payer['email_address'] ?? '' ),
					self::META_PAYER_NAME  => $payer_n,
					self::META_ENVIRONMENT => PayPal_OAuth::get_environment(),
				),
			),
			true
		);

		return $post_id;
	}

	/**
	 * The post holding a PayPal order, if it was recorded.
	 *
	 * @param string $order_id PayPal's order id.
	 * @return int The post id, or 0.
	 */
	public static function find( $order_id ) {
		$posts = get_posts(
			array(
				'post_type'              => self::POST_TYPE,
				'post_status'            => 'any',
				'posts_per_page'         => 1,
				'fields'                 => 'ids',
				'meta_key'               => self::META_ORDER_ID,
				'meta_value'             => $order_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- One order looked up by its id; the table holds this site's orders alone.
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
			)
		);

		return empty( $posts ) ? 0 : (int) $posts[0];
	}
}
