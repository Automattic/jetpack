<?php
/**
 * Tests for the PayPal_Payment_Links_List_Table class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Payment_Links_List_Table_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Payment_Links_List_Table
 */
#[CoversClass( PayPal_Payment_Links_List_Table::class )]
class PayPal_Payment_Links_List_Table_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get_columns returns the expected column set.
	 */
	public function test_get_columns_returns_expected_keys() {
		$table   = new PayPal_Payment_Links_List_Table();
		$columns = $table->get_columns();

		$this->assertArrayHasKey( 'name', $columns );
		$this->assertArrayHasKey( 'price', $columns );
		$this->assertArrayHasKey( 'status', $columns );
		$this->assertArrayHasKey( 'created', $columns );
		$this->assertArrayHasKey( 'payment_link', $columns );
		$this->assertCount( 5, $columns );
	}

	/**
	 * Test prepare_items populates items from a successful API response.
	 */
	public function test_prepare_items_populates_items_on_success() {
		$this->set_up_connected_state();
		$this->mock_list_response( $this->get_sample_items(), 2 );

		$table = new PayPal_Payment_Links_List_Table();
		$table->prepare_items();

		$this->assertCount( 2, $table->items );
		$this->assertNull( $table->api_error );
	}

	/**
	 * Test prepare_items sets api_error on WP_Error response.
	 */
	public function test_prepare_items_sets_error_on_failure() {
		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Connection refused' );
			}
		);

		$table = new PayPal_Payment_Links_List_Table();
		$table->prepare_items();

		$this->assertEmpty( $table->items );
		$this->assertInstanceOf( \WP_Error::class, $table->api_error );
	}

	/**
	 * Test prepare_items sets empty items when API returns no resources.
	 */
	public function test_prepare_items_handles_empty_response() {
		$this->set_up_connected_state();
		$this->mock_list_response( array(), 0 );

		$table = new PayPal_Payment_Links_List_Table();
		$table->prepare_items();

		$this->assertEmpty( $table->items );
		$this->assertNull( $table->api_error );
	}

	/**
	 * Test prepare_items extracts next_page_token from HATEOAS links.
	 */
	public function test_prepare_items_extracts_next_page_token() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			200,
			array(
				'items'       => $this->get_sample_items(),
				'total_items' => 50,
				'links'       => array(
					array(
						'rel'  => 'self',
						'href' => 'https://api.paypal.com/v1/checkout/payment-resources?page_size=20',
					),
					array(
						'rel'  => 'next',
						'href' => 'https://api.paypal.com/v1/checkout/payment-resources?page_size=20&page_token=CURSOR_ABC123',
					),
				),
			)
		);

		$table = new PayPal_Payment_Links_List_Table();
		$table->prepare_items();

		$this->assertEquals( 'CURSOR_ABC123', $table->next_page_token );
	}

	/**
	 * Test prepare_items leaves next_page_token null when no next link exists.
	 */
	public function test_prepare_items_no_next_page_token_on_last_page() {
		$this->set_up_connected_state();
		$this->mock_list_response( $this->get_sample_items(), 2 );

		$table = new PayPal_Payment_Links_List_Table();
		$table->prepare_items();

		$this->assertNull( $table->next_page_token );
	}

	/**
	 * Test column_name renders product name from line_items.
	 */
	public function test_column_name_renders_product_name() {
		$table  = new PayPal_Payment_Links_List_Table();
		$item   = $this->get_sample_items()[0];
		$output = $table->column_name( $item );

		$this->assertStringContainsString( 'Premium Widget', $output );
		$this->assertStringContainsString( '<strong>', $output );
	}

	/**
	 * Test column_name renders dash when line_items is empty.
	 */
	public function test_column_name_renders_dash_when_no_line_items() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_name( array( 'id' => 'PLB-TEST123' ) );

		$this->assertStringContainsString( '—', $output );
	}

	/**
	 * Test column_name includes delete action with nonce URL.
	 */
	public function test_column_name_includes_delete_action() {
		$table  = new PayPal_Payment_Links_List_Table();
		$item   = $this->get_sample_items()[0];
		$output = $table->column_name( $item );

		$this->assertStringContainsString( 'action=delete', $output );
		$this->assertStringContainsString( 'PLB-ABC123', $output );
		$this->assertStringContainsString( '_wpnonce', $output );
	}

	/**
	 * Test column_price formats price with currency symbol.
	 */
	public function test_column_price_formats_with_currency() {
		$table  = new PayPal_Payment_Links_List_Table();
		$item   = $this->get_sample_items()[0];
		$output = $table->column_price( $item );

		$this->assertStringContainsString( '29.99', $output );
		$this->assertStringContainsString( '$', $output );
	}

	/**
	 * Test column_price returns dash when no unit_amount.
	 */
	public function test_column_price_returns_dash_without_amount() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_price( array( 'line_items' => array( array( 'name' => 'Test' ) ) ) );

		$this->assertEquals( '—', $output );
	}

	/**
	 * Test column_status renders ACTIVE badge.
	 */
	public function test_column_status_renders_active_badge() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_status( array( 'status' => 'ACTIVE' ) );

		$this->assertStringContainsString( 'paypal-status-active', $output );
		$this->assertStringContainsString( 'ACTIVE', $output );
	}

	/**
	 * Test column_status renders INACTIVE badge for non-active status.
	 */
	public function test_column_status_renders_inactive_badge() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_status( array( 'status' => 'INACTIVE' ) );

		$this->assertStringContainsString( 'paypal-status-inactive', $output );
		$this->assertStringContainsString( 'INACTIVE', $output );
	}

	/**
	 * Test column_status renders UNKNOWN when no status field.
	 */
	public function test_column_status_renders_unknown_when_missing() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_status( array() );

		$this->assertStringContainsString( 'UNKNOWN', $output );
	}

	/**
	 * Test column_created formats ISO timestamp to site timezone.
	 */
	public function test_column_created_formats_timestamp() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_created( array( 'create_time' => '2026-03-15T12:30:00Z' ) );

		// Should contain some formatted date, not the raw ISO string.
		$this->assertNotEquals( '—', $output );
		$this->assertStringContainsString( '2026', $output );
	}

	/**
	 * Test column_created returns dash when no create_time.
	 */
	public function test_column_created_returns_dash_when_missing() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_created( array() );

		$this->assertEquals( '—', $output );
	}

	/**
	 * Test column_payment_link renders URL with copy button.
	 */
	public function test_column_payment_link_renders_url_with_copy() {
		$table  = new PayPal_Payment_Links_List_Table();
		$item   = $this->get_sample_items()[0];
		$output = $table->column_payment_link( $item );

		$this->assertStringContainsString( 'paypal.com', $output );
		$this->assertStringContainsString( 'paypal-copy-link', $output );
		$this->assertStringContainsString( 'data-url', $output );
	}

	/**
	 * Test column_payment_link extracts URL from HATEOAS links array.
	 */
	public function test_column_payment_link_extracts_from_hateoas() {
		$table = new PayPal_Payment_Links_List_Table();
		$item  = array(
			'id'    => 'PLB-HATEOAS123',
			'links' => array(
				array(
					'rel'  => 'self',
					'href' => 'https://api.paypal.com/v1/checkout/payment-resources/PLB-HATEOAS123',
				),
				array(
					'rel'  => 'payment_link',
					'href' => 'https://www.paypal.com/ncp/payment/PLB-HATEOAS123',
				),
			),
		);

		$output = $table->column_payment_link( $item );

		$this->assertStringContainsString( 'paypal.com/ncp/payment/PLB-HATEOAS123', $output );
	}

	/**
	 * Test column_payment_link returns dash when no link available.
	 */
	public function test_column_payment_link_returns_dash_when_missing() {
		$table  = new PayPal_Payment_Links_List_Table();
		$output = $table->column_payment_link( array( 'id' => 'PLB-NOLINK' ) );

		$this->assertEquals( '—', $output );
	}

	// --- Helpers ---

	/**
	 * Set up a connected PayPal state with a cached token.
	 */
	private function set_up_connected_state() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		PayPal_OAuth::set_environment( 'production' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'fake_access_token', 3600 );
	}

	/**
	 * Mock a list_resources API response.
	 *
	 * @param array $items       The items to return.
	 * @param int   $total_items Total items count.
	 */
	private function mock_list_response( $items, $total_items ) {
		$this->mock_http_response(
			200,
			array(
				'items'       => $items,
				'total_items' => $total_items,
				'links'       => array(
					array(
						'rel'  => 'self',
						'href' => 'https://api.paypal.com/v1/checkout/payment-resources?page_size=20',
					),
				),
			)
		);
	}

	/**
	 * Mock an HTTP response.
	 *
	 * @param int          $status_code HTTP status code.
	 * @param array|string $body        Response body.
	 */
	private function mock_http_response( $status_code, $body ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $status_code, $body ) {
				// Skip OAuth token endpoint.
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}

				return array(
					'response' => array(
						'code'    => $status_code,
						'message' => '',
					),
					'body'     => is_array( $body ) ? wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) : $body,
				);
			},
			10,
			3
		);
	}

	/**
	 * Get sample payment link items for testing.
	 *
	 * @return array
	 */
	private function get_sample_items() {
		return array(
			array(
				'id'           => 'PLB-ABC123',
				'type'         => 'BUY_NOW',
				'status'       => 'ACTIVE',
				'create_time'  => '2026-03-15T10:00:00Z',
				'payment_link' => 'https://www.paypal.com/ncp/payment/PLB-ABC123',
				'line_items'   => array(
					array(
						'name'        => 'Premium Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '29.99',
						),
					),
				),
			),
			array(
				'id'           => 'PLB-DEF456',
				'type'         => 'BUY_NOW',
				'status'       => 'ACTIVE',
				'create_time'  => '2026-03-14T08:00:00Z',
				'payment_link' => 'https://www.paypal.com/ncp/payment/PLB-DEF456',
				'line_items'   => array(
					array(
						'name'        => 'Basic Plan',
						'unit_amount' => array(
							'currency_code' => 'EUR',
							'value'         => '9.99',
						),
					),
				),
			),
		);
	}
}
