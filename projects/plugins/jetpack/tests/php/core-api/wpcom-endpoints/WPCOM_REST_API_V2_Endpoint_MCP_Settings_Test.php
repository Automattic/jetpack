<?php
/**
 * Tests for /wpcom/v2/jetpack-ai/mcp-settings.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

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
	 * Mock admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * Mock blog ID.
	 *
	 * @var int
	 */
	private static $blog_id = 123;

	/**
	 * Status the faked WordPress.com response carries.
	 *
	 * @var int
	 */
	private $wpcom_status = 200;

	/**
	 * Body the faked WordPress.com response carries.
	 *
	 * @var array
	 */
	private $wpcom_body = array();

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Set up an administrator whose user token lets the proxy reach the HTTP layer.
	 */
	public function set_up() {
		wp_set_current_user( static::$admin_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );
		add_filter( 'pre_http_request', array( $this, 'fake_wpcom_response' ), 10, 3 );

		parent::set_up();
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		remove_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );
		remove_filter( 'pre_http_request', array( $this, 'fake_wpcom_response' ) );

		parent::tear_down();
	}

	/**
	 * Mock the Jetpack private options so the request can be signed as the admin.
	 *
	 * The token's third segment must be the user id or `Tokens::get_access_token()`
	 * rejects it as a mismatch.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$admin_id => 'pretend_this_is_valid.secret.' . static::$admin_id,
			),
		);
	}

	/**
	 * Mock the Jetpack public options so the proxy can resolve the blog id.
	 *
	 * @return array
	 */
	public function mock_jetpack_options() {
		return array(
			'id' => static::$blog_id,
		);
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
		if ( ! str_contains( $url, 'mcp-abilities' ) ) {
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
	 * @param int   $status Status WordPress.com should answer with.
	 * @param array $body   Body WordPress.com should answer with.
	 * @return array
	 */
	private function get_settings( $status, $body = array() ) {
		$this->wpcom_status = $status;
		$this->wpcom_body   = $body;

		return $this->server->dispatch( new WP_REST_Request( Requests::GET, self::ROUTE ) )->get_data();
	}

	/**
	 * A refused user is reported as refused, not as an unpaid site.
	 */
	public function test_forbidden_is_reported_as_an_access_error() {
		$data = $this->get_settings( 403 );

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertSame( 'forbidden', $data['access_error'] );
	}

	/**
	 * An unpaid site is still reported as needing a plan, with no access error.
	 */
	public function test_payment_required_stays_a_plan_problem() {
		$data = $this->get_settings( 402 );

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertArrayNotHasKey( 'access_error', $data );
	}

	/**
	 * An explicit has_mcp_plan of false is a plan problem, not an access error.
	 */
	public function test_no_plan_flag_stays_a_plan_problem() {
		$data = $this->get_settings( 200, array( 'has_mcp_plan' => false ) );

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertArrayNotHasKey( 'access_error', $data );
	}

	/**
	 * A 403 that does say the site has no plan keeps the upsell.
	 */
	public function test_plan_flag_outranks_forbidden() {
		$data = $this->get_settings( 403, array( 'has_mcp_plan' => false ) );

		$this->assertFalse( $data['has_mcp_access'] );
		$this->assertArrayNotHasKey( 'access_error', $data );
	}
}
