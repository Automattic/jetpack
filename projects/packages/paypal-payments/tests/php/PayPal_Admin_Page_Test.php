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
		delete_transient( 'paypal_admin_notice' );
		remove_all_filters( 'pre_http_request' );

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
			'paypal_admin_notice',
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
		$this->assertFalse( get_transient( 'paypal_admin_notice' ) );
	}

	/**
	 * Test render_page displays error notice from transient.
	 */
	public function test_render_page_displays_error_notice() {
		$admin = $this->create_admin_user();
		wp_set_current_user( $admin );

		set_transient(
			'paypal_admin_notice',
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
}
