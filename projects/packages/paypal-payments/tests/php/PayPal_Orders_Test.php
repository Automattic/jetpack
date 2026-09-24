<?php
/**
 * Tests for the PayPal_Orders class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Orders_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Orders
 */
#[CoversClass( PayPal_Orders::class )]
class PayPal_Orders_Test extends TestCase {

	/**
	 * Per-flag filter that forces the API-managed buttons on.
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG;

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		remove_all_filters( self::FLAG_FILTER );
		Feature_Flags::reset();
		unregister_post_type( PayPal_Orders::POST_TYPE );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );

		// The test database lives for the whole run, so no order outlives its test.
		foreach ( $this->recorded as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		$this->recorded = array();
	}

	/**
	 * Posts this test recorded, for tearDown().
	 *
	 * @var int[]
	 */
	private $recorded = array();

	/**
	 * Record an order and remember the post for cleanup.
	 *
	 * @param array $order The captured order.
	 * @return int|\WP_Error
	 */
	private function record( array $order ) {
		$post_id = PayPal_Orders::record( $order );
		if ( is_int( $post_id ) ) {
			$this->recorded[] = $post_id;
		}

		return $post_id;
	}

	/**
	 * A captured order, as PayPal returns it with return=representation.
	 *
	 * @return array
	 */
	private function captured_order() {
		return array(
			'id'             => 'ORDER12345',
			'status'         => 'COMPLETED',
			'payer'          => array(
				'email_address' => 'buyer@example.com',
				'name'          => array(
					'given_name' => 'Ada',
					'surname'    => 'Lovelace',
				),
			),
			'purchase_units' => array(
				array(
					'custom_id' => 'PLB-ORDER1',
					'amount'    => array(
						'currency_code' => 'USD',
						'value'         => '30.00',
					),
					'items'     => array(
						array(
							'name'        => 'Widget',
							'description' => 'Size: Large',
							'quantity'    => '3',
							'unit_amount' => array(
								'currency_code' => 'USD',
								'value'         => '10.00',
							),
						),
					),
					'payments'  => array(
						'captures' => array(
							array(
								'id'     => 'CAPTURE999',
								'status' => 'COMPLETED',
								'amount' => array(
									'currency_code' => 'USD',
									'value'         => '30.00',
								),
							),
						),
					),
				),
			),
		);
	}

	public function test_register_post_type_waits_for_the_feature_flag() {
		PayPal_Payment_Buttons::register_feature_flags();

		PayPal_Orders::register_post_type();

		$this->assertFalse( post_type_exists( PayPal_Orders::POST_TYPE ) );
	}

	public function test_register_post_type_registers_a_private_type_once_the_flag_is_on() {
		PayPal_Payment_Buttons::register_feature_flags();
		add_filter( self::FLAG_FILTER, '__return_true' );

		PayPal_Orders::register_post_type();

		$type = get_post_type_object( PayPal_Orders::POST_TYPE );
		$this->assertNotNull( $type );
		$this->assertFalse( $type->public );
		$this->assertFalse( $type->show_ui );
	}

	public function test_record_stores_the_order_and_its_capture() {
		PayPal_OAuth::set_environment( 'sandbox' );

		$post_id = $this->record( $this->captured_order() );

		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );
		$post = get_post( $post_id );
		$this->assertSame( PayPal_Orders::POST_TYPE, $post->post_type );
		$this->assertSame( 'Widget x 3', $post->post_title );
		$this->assertSame( 'ORDER12345', get_post_meta( $post_id, PayPal_Orders::META_ORDER_ID, true ) );
		$this->assertSame( 'CAPTURE999', get_post_meta( $post_id, PayPal_Orders::META_CAPTURE_ID, true ) );
		$this->assertSame( 'COMPLETED', get_post_meta( $post_id, PayPal_Orders::META_STATUS, true ) );
		$this->assertSame( 'PLB-ORDER1', get_post_meta( $post_id, PayPal_Orders::META_RESOURCE_ID, true ) );
		$this->assertSame( 'Size: Large', get_post_meta( $post_id, PayPal_Orders::META_OPTIONS, true ) );
		$this->assertEquals( 3, get_post_meta( $post_id, PayPal_Orders::META_QUANTITY, true ) );
		$this->assertSame( '10.00', get_post_meta( $post_id, PayPal_Orders::META_UNIT_AMOUNT, true ) );
		$this->assertSame( '30.00', get_post_meta( $post_id, PayPal_Orders::META_TOTAL, true ) );
		$this->assertSame( 'USD', get_post_meta( $post_id, PayPal_Orders::META_CURRENCY, true ) );
		$this->assertSame( 'buyer@example.com', get_post_meta( $post_id, PayPal_Orders::META_PAYER_EMAIL, true ) );
		$this->assertSame( 'Ada Lovelace', get_post_meta( $post_id, PayPal_Orders::META_PAYER_NAME, true ) );
		$this->assertSame( 'sandbox', get_post_meta( $post_id, PayPal_Orders::META_ENVIRONMENT, true ) );
	}

	public function test_record_refuses_an_order_without_an_id() {
		$result = PayPal_Orders::record( array( 'status' => 'COMPLETED' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_order_missing_id', $result->get_error_code() );
	}

	public function test_record_keeps_one_post_per_order() {
		// WorDBless runs no SQL behind get_posts(), so the lookup is fed by hand.
		$first = $this->record( $this->captured_order() );
		add_filter(
			'posts_pre_query',
			function ( $posts, $query ) use ( $first ) {
				return PayPal_Orders::POST_TYPE === $query->get( 'post_type' ) && PayPal_Orders::META_ORDER_ID === $query->get( 'meta_key' )
					? array( $first )
					: $posts;
			},
			10,
			2
		);

		$second = $this->record( $this->captured_order() );

		remove_all_filters( 'posts_pre_query' );

		$this->assertSame( $first, $second );
	}
}
