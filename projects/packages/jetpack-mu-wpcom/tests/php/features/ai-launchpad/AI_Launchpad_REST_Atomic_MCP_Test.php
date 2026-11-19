<?php
/**
 * Test class for AI_Launchpad_REST's MCP connection detection on Atomic.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-rest.php';

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WpOrg\Requests\Requests;

/**
 * Test class for AI_Launchpad_REST's MCP connection detection on Atomic.
 *
 * @covers \AI_Launchpad_REST
 */
#[CoversClass( AI_Launchpad_REST::class )]
class AI_Launchpad_REST_Atomic_MCP_Test extends \WorDBless\BaseTestCase {

	/**
	 * Current user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Every request the fake WordPress.com received, as `[ method, path, query params ]`.
	 *
	 * @var array
	 */
	private $requests = array();

	/**
	 * What the fake WordPress.com answers.
	 *
	 * @var array|\WP_Error
	 */
	private $response;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );
		update_option( 'launch-status', 'unlaunched' );

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'atomic_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );

		Constants::set_constant( 'IS_ATOMIC', true );
		\Jetpack_Options::update_option( 'id', 12345 );
		( new Tokens() )->update_blog_token( 'blog.token' );
		( new Tokens() )->update_user_token( $this->user_id, "user.token.{$this->user_id}", true );
		// Without this the client has no API host to sign a URL for.
		Connection_Utils::init_default_constants();

		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );

		wpcom_register_default_launchpad_checklists();
		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		Constants::clear_single_constant( 'IS_ATOMIC' );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token', 'user_tokens', 'master_user' ) );
		delete_transient( $this->cache_key() );
		wp_set_current_user( 0 );
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Stands in for WordPress.com.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request arguments.
	 * @param string $url  Request URL.
	 * @return array|\WP_Error
	 */
	public function answer( $pre, $args, $url ) {
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
		$this->requests[] = array( $args['method'], wp_parse_url( $url, PHP_URL_PATH ), $query );

		return $this->response;
	}

	/**
	 * Makes the fake WordPress.com answer `/me/mcp-connections` with a 200.
	 *
	 * @param array $body The JSON body.
	 */
	private function wpcom_answers( array $body ) {
		$this->response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	/**
	 * The current user's cached answer.
	 *
	 * @return string
	 */
	private function cache_key() {
		return 'wpcom_ai_launchpad_mcp_' . $this->user_id;
	}

	/**
	 * Calls an AI Launchpad route.
	 *
	 * @param string     $route Route under /wpcom/v2/ai-launchpad.
	 * @param array|null $query Query params.
	 * @return WP_REST_Response
	 */
	private function request( $route = '', $query = null ) {
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/ai-launchpad' . $route );
		if ( null !== $query ) {
			$request->set_query_params( $query );
		}
		return rest_do_request( $request );
	}

	/**
	 * Calls an AI Launchpad route and returns its data.
	 *
	 * @param string     $route Route under /wpcom/v2/ai-launchpad.
	 * @param array|null $query Query params.
	 * @return array
	 */
	private function get( $route = '', $query = null ) {
		return $this->request( $route, $query )->get_data();
	}

	/**
	 * Asserts that GET /mcp-connections answers with an error, which the wizard ignores, rather than an empty list.
	 */
	private function assert_connections_unavailable() {
		$response = $this->request( '/mcp-connections' );
		$this->assertSame( 503, $response->get_status() );
		$this->assertSame( 'mcp_connections_unavailable', $response->get_data()['code'] );
	}

	/**
	 * Reads the wizard payload on a `start=ai-tool` Site Setup.
	 *
	 * @return array
	 */
	private function read_ai_tool_start() {
		return $this->get( '', array( 'start' => 'ai-tool' ) );
	}

	/**
	 * Simple's direct helper wins even where IS_ATOMIC is set, and WordPress.com is never called.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_simple_helper_wins_without_a_remote_call() {
		\Brain\Monkey\Functions\when( 'wpcom_mcp_get_user_connections' )->justReturn( array( array( 'integration' => 'claude' ) ) );
		\Brain\Monkey\Functions\when( 'wpcom_mcp_get_user_access_level' )->justReturn( 'full' );

		$data = $this->read_ai_tool_start();

		$this->assertTrue( $data['mcp_detection'] );
		$this->assertFalse( $data['mcp_remote'] );
		$this->assertSame(
			array(
				'connections'  => array( 'claude' ),
				'access_level' => 'full',
			),
			$this->get( '/mcp-connections' )
		);
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * Any failed answer keeps detection off, is retried after a minute, and checks get an error.
	 *
	 * @param array|\WP_Error $response What WordPress.com answers.
	 * @dataProvider provide_failed_answers
	 */
	#[DataProvider( 'provide_failed_answers' )]
	public function test_failed_answer_leaves_detection_off( $response ) {
		$this->response = $response;

		$data = $this->read_ai_tool_start();

		$this->assertFalse( $data['mcp_detection'] );
		$this->assertFalse( $data['mcp_remote'] );
		$this->assert_connections_unavailable();
		$this->assertCount( 1, $this->requests );
		$this->assertSame( 'unavailable', get_transient( $this->cache_key() ) );
		$this->assertEqualsWithDelta( time() + MINUTE_IN_SECONDS, get_option( '_transient_timeout_' . $this->cache_key() ), 2 );
	}

	/**
	 * Data provider for test_failed_answer_leaves_detection_off.
	 *
	 * @return array
	 */
	public static function provide_failed_answers() {
		return array(
			'deploy skew: 404 before wpcom deploys' => array(
				array(
					'response' => array( 'code' => 404 ),
					'body'     => '{"code":"rest_no_route"}',
				),
			),
			'401 rest_forbidden'                    => array(
				array(
					'response' => array( 'code' => 401 ),
					'body'     => '{"code":"rest_forbidden"}',
				),
			),
			'network error'                         => array(
				new \WP_Error( 'http_request_failed', 'offline' ),
			),
			'200 without a connections list'        => array(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"access_level":"full"}',
				),
			),
		);
	}

	/**
	 * Without a Jetpack user connection the request is never attempted, so no connection error is recorded.
	 */
	public function test_no_user_connection_makes_no_request() {
		( new Tokens() )->disconnect_user( $this->user_id );

		$data = $this->read_ai_tool_start();

		$this->assertFalse( $data['mcp_detection'] );
		$this->assert_connections_unavailable();
		$this->assertSame( array(), $this->requests );
		$this->assertSame( array(), \Automattic\Jetpack\Connection\Error_Handler::get_instance()->get_stored_errors() );
	}

	/**
	 * Only ChatGPT and Claude come through, with the access level only for a string and a known tool.
	 *
	 * @param array $answer   WordPress.com's body.
	 * @param array $expected The route's data.
	 * @dataProvider provide_answers_to_filter
	 */
	#[DataProvider( 'provide_answers_to_filter' )]
	public function test_unknown_tools_are_filtered_out( $answer, $expected ) {
		$this->wpcom_answers( $answer );

		$this->assertSame( $expected, $this->get( '/mcp-connections' ) );
	}

	/**
	 * Data provider for test_unknown_tools_are_filtered_out.
	 *
	 * @return array
	 */
	public static function provide_answers_to_filter() {
		return array(
			'remote MCP only'          => array(
				array(
					'connections'  => array( 'mcp-wpcom-remote' ),
					'access_level' => 'full',
				),
				array(
					'connections'  => array(),
					'access_level' => null,
				),
			),
			'known tools among others' => array(
				array(
					'connections'  => array( 'mcp-wpcom-remote', 'claude', 7, 'chatgpt' ),
					'access_level' => 'read_only',
				),
				array(
					'connections'  => array( 'claude', 'chatgpt' ),
					'access_level' => 'read_only',
				),
			),
			'non-string access level'  => array(
				array(
					'connections'  => array( 'claude' ),
					'access_level' => 42,
				),
				array(
					'connections'  => array( 'claude' ),
					'access_level' => null,
				),
			),
		);
	}

	/**
	 * The site asks for the current user's own connections only: signed with that user's token, with no other params.
	 */
	public function test_request_is_as_user_to_me_mcp_connections() {
		$this->wpcom_answers( array( 'connections' => array() ) );

		$this->get( '/mcp-connections' );

		$this->assertCount( 1, $this->requests );
		list( $method, $path, $query ) = $this->requests[0];
		$this->assertSame( 'GET', $method );
		$this->assertSame( '/wpcom/v2/me/mcp-connections', $path );
		$params = array_keys( $query );
		sort( $params );
		// Only the signature's own params, signed with this user's token.
		$this->assertSame( array( 'body-hash', 'nonce', 'signature', 'timestamp', 'token' ), $params );
		$this->assertSame( 'user:1:' . $this->user_id, $query['token'] );
	}

	/**
	 * A good answer is cached for three seconds.
	 */
	public function test_answer_is_cached_for_three_seconds() {
		$this->wpcom_answers( array( 'connections' => array( 'claude' ) ) );

		$first = $this->get( '/mcp-connections' );

		$this->assertSame( $first, $this->get( '/mcp-connections' ) );
		$this->assertCount( 1, $this->requests );
		$this->assertEqualsWithDelta( time() + 3, get_option( '_transient_timeout_' . $this->cache_key() ), 1 );
	}

	/**
	 * A good answer turns detection on, via WordPress.com, while Allow full access stays off.
	 */
	public function test_detection_turns_on_after_a_successful_answer() {
		$this->wpcom_answers(
			array(
				'connections'  => array(),
				'access_level' => null,
			)
		);

		$data = $this->read_ai_tool_start();

		$this->assertTrue( $data['mcp_detection'] );
		$this->assertTrue( $data['mcp_remote'] );
		$this->assertFalse( $data['mcp_allow_full'] );
	}

	/**
	 * Other Site Setup loads can't reach the AI tool view on Atomic, so they skip the remote probe.
	 */
	public function test_detection_probe_skipped_without_start_ai_tool() {
		$this->wpcom_answers( array( 'connections' => array() ) );

		$data = $this->get();

		$this->assertFalse( $data['mcp_detection'] );
		$this->assertFalse( $data['mcp_remote'] );
		$this->assertSame( array(), $this->requests );
	}
}
