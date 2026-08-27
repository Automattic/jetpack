<?php
/**
 * Tests for the PayPal_Admin_Page class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Admin_Page_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Admin_Page
 */
#[CoversClass( PayPal_Admin_Page::class )]
class PayPal_Admin_Page_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		delete_transient( 'paypal_admin_notice_' . get_current_user_id() );
		remove_all_filters( 'pre_http_request' );

		// Clear detail view and list table API response caches.
		delete_transient( 'paypal_resource_plb-abc123' );
		delete_transient( 'paypal_resource_plb-notfound' );
		delete_transient( 'paypal_resource_plb-deleted' );
		delete_transient( 'paypal_list_cache_' . md5( '' ) );

		// Reset $_GET superglobal.
		$_GET = array();

		// Reset current user.
		wp_set_current_user( 0 );
	}

	// --- Constants ---

	/**
	 * Test page slug constant.
	 */
	public function test_page_slug_constant() {
		$this->assertEquals( 'paypal-payment-links', PayPal_Admin_Page::PAGE_SLUG );
	}

	/**
	 * Test capability constant.
	 */
	public function test_capability_constant() {
		$this->assertEquals( 'manage_options', PayPal_Admin_Page::CAPABILITY );
	}

	// --- handle_actions: early returns ---

	/**
	 * Test handle_actions returns early when page param is missing.
	 */
	public function test_handle_actions_returns_early_without_page() {
		$_GET = array();

		// Should not throw or die.
		PayPal_Admin_Page::handle_actions();
		$this->assertTrue( true );
	}

	/**
	 * Test handle_actions returns early when page is wrong.
	 */
	public function test_handle_actions_returns_early_with_wrong_page() {
		$_GET = array( 'page' => 'some-other-page' );

		PayPal_Admin_Page::handle_actions();
		$this->assertTrue( true );
	}

	/**
	 * Test handle_actions returns early when action is missing.
	 */
	public function test_handle_actions_returns_early_without_action() {
		$_GET = array( 'page' => 'paypal-payment-links' );

		PayPal_Admin_Page::handle_actions();
		$this->assertTrue( true );
	}

	/**
	 * Test handle_actions returns early when action is not delete.
	 */
	public function test_handle_actions_returns_early_with_non_delete_action() {
		$_GET = array(
			'page'   => 'paypal-payment-links',
			'action' => 'edit',
		);

		PayPal_Admin_Page::handle_actions();
		$this->assertTrue( true );
	}

	/**
	 * Test handle_actions returns early when resource_id is empty.
	 */
	public function test_handle_actions_returns_early_without_resource_id() {
		$_GET = array(
			'page'   => 'paypal-payment-links',
			'action' => 'delete',
		);

		PayPal_Admin_Page::handle_actions();
		$this->assertTrue( true );
	}

	// --- render_page: disconnected state ---

	/**
	 * Test render_page shows disconnected state when no credentials.
	 */
	public function test_render_page_shows_disconnected_state() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		// No credentials stored — should show disconnected message.
		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Connect PayPal', $output );
		$this->assertStringContainsString( 'paypal-disconnected-notice', $output );
		$this->assertStringContainsString( 'post-new.php', $output );
	}

	// --- render_page: connected state ---

	/**
	 * Test render_page shows connection badge when connected.
	 */
	public function test_render_page_shows_connection_badge() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		PayPal_OAuth::store_credentials( 'test_id', 'test_secret' );
		PayPal_OAuth::set_environment( 'production' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'fake_token', 3600 );

		// Mock empty API response.
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => '',
					),
					'body'     => wp_json_encode(
						array(
							'items'       => array(),
							'total_items' => 0,
							'links'       => array(),
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Connected', $output );
		$this->assertStringContainsString( 'Production', $output );
		$this->assertStringContainsString( 'PayPal Payment Links', $output );
	}

	// --- render_page: admin notice ---

	/**
	 * Test render_page displays admin notice from transient.
	 */
	public function test_render_page_displays_admin_notice() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		set_transient(
			'paypal_admin_notice_' . get_current_user_id(),
			array(
				'type'    => 'success',
				'message' => 'Payment link deleted successfully.',
			),
			30
		);

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-success', $output );
		$this->assertStringContainsString( 'Payment link deleted successfully.', $output );

		// Transient should be consumed.
		$this->assertFalse( get_transient( 'paypal_admin_notice_' . get_current_user_id() ) );
	}

	/**
	 * Test render_page displays error notice from transient.
	 */
	public function test_render_page_displays_error_notice() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		set_transient(
			'paypal_admin_notice_' . get_current_user_id(),
			array(
				'type'    => 'error',
				'message' => 'Failed to delete payment link: Resource not found.',
			),
			30
		);

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
		$this->assertStringContainsString( 'Failed to delete', $output );
	}

	// --- render_page: error state ---

	/**
	 * Test render_page shows error notice when API call fails.
	 */
	public function test_render_page_shows_api_error() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		PayPal_OAuth::store_credentials( 'test_id', 'test_secret' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'fake_token', 3600 );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return new \WP_Error( 'http_request_failed', 'Connection timed out' );
			},
			10,
			3
		);

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
	}

	// --- render_page: detail view (WOOPTP-167) ---

	/**
	 * Test render_page routes to detail view when action=view and resource_id are set.
	 */
	public function test_render_page_routes_to_detail_view() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$this->mock_get_resource_response( $this->get_sample_resource() );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		// Should show product name as heading.
		$this->assertStringContainsString( 'Premium Widget', $output );
		// Should show breadcrumb back link.
		$this->assertStringContainsString( 'Back to Payment Links', $output );
		// Should show resource ID.
		$this->assertStringContainsString( 'PLB-ABC123', $output );
	}

	/**
	 * Test detail view shows status badge.
	 */
	public function test_detail_view_shows_status_badge() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$this->mock_get_resource_response( $this->get_sample_resource() );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'paypal-status-active', $output );
		$this->assertStringContainsString( 'ACTIVE', $output );
	}

	/**
	 * Test detail view shows payment details card.
	 */
	public function test_detail_view_shows_payment_details() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$this->mock_get_resource_response( $this->get_sample_resource() );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Payment Details', $output );
		$this->assertStringContainsString( '$29.99', $output );
		$this->assertStringContainsString( 'USD', $output );
		$this->assertStringContainsString( 'BUY_NOW', $output );
		$this->assertStringContainsString( 'LINK', $output );
	}

	/**
	 * Test detail view shows description when present.
	 */
	public function test_detail_view_shows_description() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$resource                                 = $this->get_sample_resource();
		$resource['line_items'][0]['description'] = 'A premium widget with features.';
		$this->mock_get_resource_response( $resource );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'A premium widget with features.', $output );
	}

	/**
	 * Test detail view shows payment link card with copy button.
	 */
	public function test_detail_view_shows_payment_link_card() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$this->mock_get_resource_response( $this->get_sample_resource() );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Payment Link', $output );
		$this->assertStringContainsString( 'paypal.com/ncp/payment/PLB-ABC123', $output );
		$this->assertStringContainsString( 'paypal-copy-link', $output );
		$this->assertStringContainsString( 'Copy to Clipboard', $output );
	}

	/**
	 * Test detail view shows action buttons (Open, Copy, Delete).
	 */
	public function test_detail_view_shows_action_buttons() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$this->mock_get_resource_response( $this->get_sample_resource() );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Open Payment Page', $output );
		$this->assertStringContainsString( 'Copy Link', $output );
		$this->assertStringContainsString( 'action=delete', $output );
	}

	/**
	 * Test detail view shows error when API returns WP_Error.
	 */
	public function test_detail_view_shows_error_on_api_failure() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return new \WP_Error( 'http_request_failed', 'Connection refused' );
			},
			10,
			3
		);

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-NOTFOUND';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
		$this->assertStringContainsString( 'Back to Payment Links', $output );
	}

	/**
	 * Test detail view shows 404 error for deleted resource.
	 */
	public function test_detail_view_handles_404() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return array(
					'response' => array(
						'code'    => 404,
						'message' => '',
					),
					'body'     => wp_json_encode(
						array(
							'name'    => 'RESOURCE_NOT_FOUND',
							'message' => 'The specified resource does not exist.',
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-DELETED';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
	}

	/**
	 * Test detail view shows configuration card when taxes are present.
	 */
	public function test_detail_view_shows_configuration_card_with_taxes() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$resource                           = $this->get_sample_resource();
		$resource['line_items'][0]['taxes'] = array(
			array(
				'name'  => 'Sales Tax',
				'type'  => 'PERCENTAGE',
				'value' => '8.25',
			),
		);
		$this->mock_get_resource_response( $resource );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Configuration', $output );
		$this->assertStringContainsString( 'Sales Tax', $output );
		$this->assertStringContainsString( '8.25', $output );
	}

	/**
	 * Test detail view shows adjustable quantity.
	 */
	public function test_detail_view_shows_adjustable_quantity() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$resource = $this->get_sample_resource();
		$resource['line_items'][0]['adjustable_quantity'] = array( 'maximum' => 10 );
		$this->mock_get_resource_response( $resource );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Adjustable Quantity', $output );
		$this->assertStringContainsString( '10', $output );
	}

	/**
	 * Test detail view shows variants with dimensions.
	 */
	public function test_detail_view_shows_variants() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$resource                              = $this->get_sample_resource();
		$resource['line_items'][0]['variants'] = array(
			'dimensions' => array(
				array(
					'name'    => 'Color',
					'options' => array(
						array( 'label' => 'Black' ),
						array( 'label' => 'White' ),
					),
				),
			),
		);
		$this->mock_get_resource_response( $resource );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Variants', $output );
		$this->assertStringContainsString( 'Color', $output );
		$this->assertStringContainsString( 'Black', $output );
		$this->assertStringContainsString( 'White', $output );
	}

	/**
	 * Test detail view omits configuration card when no config fields are present.
	 */
	public function test_detail_view_omits_configuration_card_when_empty() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$this->mock_get_resource_response( $this->get_sample_resource() );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'Configuration', $output );
	}

	/**
	 * Test detail view extracts payment link from HATEOAS links.
	 */
	public function test_detail_view_extracts_payment_link_from_hateoas() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		$this->set_up_connected_state();
		$resource = $this->get_sample_resource();
		unset( $resource['payment_link'] );
		$resource['links'] = array(
			array(
				'rel'  => 'self',
				'href' => 'https://api.paypal.com/v1/checkout/payment-resources/PLB-ABC123',
			),
			array(
				'rel'  => 'payment_link',
				'href' => 'https://www.paypal.com/ncp/payment/PLB-ABC123',
			),
		);
		$this->mock_get_resource_response( $resource );

		$_GET['action']      = 'view';
		$_GET['resource_id'] = 'PLB-ABC123';

		ob_start();
		PayPal_Admin_Page::render_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'paypal.com/ncp/payment/PLB-ABC123', $output );
	}

	// --- enqueue_assets ---

	/**
	 * Test enqueue_assets skips non-matching pages.
	 */
	public function test_enqueue_assets_skips_other_pages() {
		// Should not enqueue anything for unrelated pages.
		PayPal_Admin_Page::enqueue_assets( 'toplevel_page_jetpack' );
		// No assertion needed — just verifying no fatal error.
		$this->assertTrue( true );
	}

	// --- Helpers ---

	/**
	 * Create an admin user for testing.
	 *
	 * @return int User ID.
	 */
	private function create_admin_user() {
		$user_id = username_exists( 'testadmin_admin_page' );
		if ( $user_id ) {
			return $user_id;
		}

		return wp_insert_user(
			array(
				'user_login' => 'testadmin_admin_page',
				'user_pass'  => wp_generate_password(),
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Set up a connected PayPal state with a cached token.
	 */
	private function set_up_connected_state() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		PayPal_OAuth::set_environment( 'production' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'fake_access_token', 3600 );
	}

	/**
	 * Mock a get_resource API response.
	 *
	 * @param array $resource The resource data to return.
	 */
	private function mock_get_resource_response( $resource ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $resource ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => '',
					),
					'body'     => wp_json_encode( $resource, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Get a sample payment resource for testing.
	 *
	 * @return array
	 */
	private function get_sample_resource() {
		return array(
			'id'               => 'PLB-ABC123',
			'type'             => 'BUY_NOW',
			'integration_mode' => 'LINK',
			'reusable'         => 'MULTIPLE',
			'status'           => 'ACTIVE',
			'create_time'      => '2026-03-15T10:00:00Z',
			'payment_link'     => 'https://www.paypal.com/ncp/payment/PLB-ABC123',
			'line_items'       => array(
				array(
					'name'        => 'Premium Widget',
					'unit_amount' => array(
						'currency_code' => 'USD',
						'value'         => '29.99',
					),
				),
			),
		);
	}
}
