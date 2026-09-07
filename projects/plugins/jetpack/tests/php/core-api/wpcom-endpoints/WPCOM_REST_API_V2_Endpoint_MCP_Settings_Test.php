<?php
/**
 * Tests for /wpcom/v2/jetpack-ai/mcp-settings.
 *
 * The endpoint proxies to WordPress.com with the current user's token, so its
 * failures are per-user. A 403 means this admin was refused; a 402 means the
 * site is unpaid. Reporting the first as the second sends a user who cannot buy
 * anything to checkout, so the two statuses are asserted separately here.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_MCP_Settings_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_MCP_Settings
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_MCP_Settings::class )]
class WPCOM_REST_API_V2_Endpoint_MCP_Settings_Test extends Jetpack_REST_TestCase {

	const ROUTE = '/wpcom/v2/jetpack-ai/mcp-settings';

	/**
	 * Status the faked WordPress.com response should carry.
	 *
	 * @var int
	 */
	private $wpcom_status = 200;

	/**
	 * Body the faked WordPress.com response should carry.
	 *
	 * @var array
	 */
	private $wpcom_body = array();

	/**
	 * Set up an administrator on a site with a blog id.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		Jetpack_Options::update_option( 'id', 1234 );

		add_filter( 'pre_http_request', array( $this, 'fake_wpcom_response' ), 10, 3 );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'fake_wpcom_response' ) );
		Jetpack_Options::delete_option( 'id' );

		parent::tear_down();
	}

	/**
	 * Short-circuit the proxied request with a canned status and body.
	 *
	 * @param mixed  $preempt Whatever an earlier filter returned.
	 * @param array  $args    Request args.
	 * @param string $url     Request URL.
	 * @return array|mixed
	 */
	public function fake_wpcom_response( $preempt, $args, $url ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		if ( false === strpos( $url, 'mcp-abilities' ) ) {
			return $preempt;
		}

		return array(
			'headers'  => array(),
			'body'     => wp_json_encode( $this->wpcom_body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'response' => array(
				'code'    => $this->wpcom_status,
				'message' => '',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Dispatch a GET against the endpoint.
	 *
	 * @return WP_REST_Response
	 */
	private function get_settings() {
		return $this->server->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );
	}

	/**
	 * A refused user is reported as refused, not as an unpaid site.
	 */
	public function test_forbidden_is_reported_as_an_access_error() {
		$this->wpcom_status = 403;

		$data = $this->get_settings()->get_data();

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertSame( 'forbidden', $data['access_error'] );
	}

	/**
	 * An unpaid site is still reported as needing a plan, with no access error.
	 */
	public function test_payment_required_stays_a_plan_problem() {
		$this->wpcom_status = 402;

		$data = $this->get_settings()->get_data();

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertArrayNotHasKey( 'access_error', $data );
	}

	/**
	 * An explicit has_mcp_plan of false is a plan problem, not an access error.
	 */
	public function test_no_plan_flag_stays_a_plan_problem() {
		$this->wpcom_status = 200;
		$this->wpcom_body   = array( 'has_mcp_plan' => false );

		$data = $this->get_settings()->get_data();

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertArrayNotHasKey( 'access_error', $data );
	}

	/**
	 * A 403 outranks a has_mcp_plan the refused response may still carry.
	 */
	public function test_forbidden_outranks_the_plan_flag() {
		$this->wpcom_status = 403;
		$this->wpcom_body   = array( 'has_mcp_plan' => true );

		$data = $this->get_settings()->get_data();

		$this->assertSame( 'forbidden', $data['access_error'] );
	}
}
