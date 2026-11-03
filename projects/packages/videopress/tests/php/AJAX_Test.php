<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\AJAX
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;

/**
 * Read simulated POST data because CLI filter_input() does not read $_POST.
 *
 * @param int       $type Input type.
 * @param string    $var_name Variable name.
 * @param int       $filter Validation filter.
 * @param array|int $options Filter options.
 * @return mixed
 */
function filter_input( $type, $var_name, $filter = FILTER_DEFAULT, $options = 0 ) {
	$post_input = AJAX_Test::$post_input;
	if ( INPUT_POST === $type && null !== $post_input ) {
		return array_key_exists( $var_name, $post_input )
			? filter_var( $post_input[ $var_name ], $filter, $options )
			: null;
	}

	return \filter_input( $type, $var_name, $filter, $options );
}

/**
 * AJAX capability check test suite.
 */
// phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed -- The input shim belongs to this test fixture.
class AJAX_Test extends BaseTestCase {

	/**
	 * The AJAX instance.
	 *
	 * @var AJAX
	 */
	private $ajax;

	/**
	 * Simulated POST input during a playback request.
	 *
	 * @var array|null
	 */
	public static $post_input;

	/**
	 * Outbound requests made during a playback request.
	 *
	 * @var string[]
	 */
	private $playback_requests = array();

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		// Mock connection.
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		$this->ajax = AJAX::init();
	}

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );
		Constants::clear_constants();
	}

	/**
	 * Test that subscribers cannot get upload JWTs.
	 */
	public function test_get_upload_jwt_rejected_for_subscriber() {
		$this->set_current_user_role( 'subscriber' );

		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_jwt' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You do not have permission to upload files.', $response['data']['message'] );
	}

	/**
	 * Test that contributors cannot get upload JWTs.
	 */
	public function test_get_upload_jwt_rejected_for_contributor() {
		$this->set_current_user_role( 'contributor' );

		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_jwt' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You do not have permission to upload files.', $response['data']['message'] );
	}

	/**
	 * Test that authors can get upload JWTs.
	 */
	public function test_get_upload_jwt_allowed_for_author() {
		$this->set_current_user_role( 'author' );

		$valid_response = array( $this, 'return_valid_upload_response' );
		add_filter( 'pre_http_request', $valid_response );
		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_jwt' );
		remove_filter( 'pre_http_request', $valid_response );

		$this->assertTrue( $response['success'] );
	}

	/**
	 * Test that subscribers cannot get upload tokens.
	 */
	public function test_get_upload_token_rejected_for_subscriber() {
		$this->set_current_user_role( 'subscriber' );

		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_token' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You do not have permission to upload files.', $response['data']['message'] );
	}

	/**
	 * Test that authors can get upload tokens.
	 */
	public function test_get_upload_token_allowed_for_author() {
		$this->set_current_user_role( 'author' );

		$valid_response = array( $this, 'return_valid_upload_response' );
		add_filter( 'pre_http_request', $valid_response );
		$response = $this->call_ajax_method( 'wp_ajax_videopress_get_upload_token' );
		remove_filter( 'pre_http_request', $valid_response );

		$this->assertTrue( $response['success'] );
	}

	public function test_get_playback_jwt_rejected_for_unpublished_embed() {
		$guid = 'aJaXdr12';
		$this->set_current_user_role( 'administrator' );
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'contributor' );
		$post_id = $this->create_embedding_post( $guid, 'draft' );

		$this->assertTrue( current_user_can( 'read_post', $post_id ) );
		$this->assertFalse( current_user_can( 'upload_files' ) );

		$response = $this->call_playback_ajax( $guid, $post_id );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'You cannot view this video.', $response['data']['message'] );
		$this->assertSame( array(), $this->playback_requests );
	}

	public function test_get_playback_jwt_allowed_for_published_embed() {
		$guid = 'aJaXpu12';
		$this->set_current_user_role( 'administrator' );
		$this->create_private_videopress_attachment( $guid );
		$post_id = $this->create_embedding_post( $guid, 'publish' );
		$this->set_current_user_role( 'subscriber' );

		$response = $this->call_playback_ajax( $guid, $post_id );

		$this->assertTrue( $response['success'] );
		$this->assertSame( 'test-playback-jwt', $response['data']['jwt'] );
		$this->assertCount( 1, $this->playback_requests );
		$this->assertStringContainsString( '/media/videopress-playback-jwt/' . $guid, $this->playback_requests[0] );
	}

	public function test_get_playback_jwt_allowed_for_author_draft_preview() {
		$guid = 'aJaXpr12';
		$this->set_current_user_role( 'author' );
		$this->create_private_videopress_attachment( $guid );
		$post_id = $this->create_embedding_post( $guid, 'draft' );

		$response = $this->call_playback_ajax( $guid, $post_id );

		$this->assertTrue( $response['success'] );
		$this->assertSame( 'test-playback-jwt', $response['data']['jwt'] );
		$this->assertCount( 1, $this->playback_requests );
		$this->assertStringContainsString( '/media/videopress-playback-jwt/' . $guid, $this->playback_requests[0] );
	}

	/**
	 * Request playback while recording and intercepting outbound HTTP requests.
	 *
	 * @param string $guid VideoPress guid.
	 * @param int    $post_id Embedding post ID.
	 * @return array AJAX response.
	 */
	private function call_playback_ajax( $guid, $post_id ) {
		self::$post_input        = array(
			'guid'    => $guid,
			'post_id' => (string) $post_id,
		);
		$this->playback_requests = array();
		$intercept_request       = function ( $response, $args, $url ) {
			$this->playback_requests[] = $url;
			return array( 'body' => wp_json_encode( array( 'metadata_token' => 'test-playback-jwt' ), JSON_UNESCAPED_SLASHES ) );
		};
		add_filter( 'pre_http_request', $intercept_request, 10, 3 );

		try {
			return $this->call_ajax_method( 'wp_ajax_videopress_get_playback_jwt' );
		} finally {
			self::$post_input = null;
			remove_filter( 'pre_http_request', $intercept_request );
		}
	}

	/**
	 * Create a private VideoPress attachment owned by the current user.
	 *
	 * @param string $guid VideoPress guid.
	 */
	private function create_private_videopress_attachment( $guid ) {
		$attachment_id = wp_insert_post(
			array(
				'post_title'     => $guid,
				'post_author'    => get_current_user_id(),
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$attachment_id,
			array( 'videopress' => array( 'privacy_setting' => \VIDEOPRESS_PRIVACY::IS_PRIVATE ) )
		);
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $attachment_id, HOUR_IN_SECONDS );
		wp_cache_delete( 'get_post_by_guid_' . $guid, 'videopress' );
	}

	/**
	 * Create a post embedding the video, owned by the current user.
	 *
	 * @param string $guid VideoPress guid.
	 * @param string $status Post status.
	 * @return int Post ID.
	 */
	private function create_embedding_post( $guid, $status ) {
		return (int) wp_insert_post(
			array(
				'post_title'   => 'VideoPress embed',
				'post_author'  => get_current_user_id(),
				'post_content' => '[videopress ' . $guid . ']',
				'post_status'  => $status,
			)
		);
	}

	/**
	 * @dataProvider playback_editor_provider
	 * @param bool $can_read Whether the editor can read the embedding post.
	 * @param int  $submitted_plan Caller-selected plan.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'playback_editor_provider' )]
	public function test_get_playback_jwt_denies_unsubscribed_embedding_editor( $can_read, $submitted_plan ) {
		require_once __DIR__ . '/mocks/premium-content-subscription-service.php';
		unset( $GLOBALS['__vp_paywall_held_plans'], $GLOBALS['__vp_paywall_received'], $GLOBALS['__vp_block_gate_received'] );
		$this->set_current_user_role( 'administrator' );
		kses_remove_filters();
		$guid    = 'pAyWaL01';
		$post_id = $this->create_entitlement_playback_context( $guid );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'playback_editor',
				'user_pass'  => 'pass',
				'role'       => '',
			)
		);
		$user    = get_userdata( $user_id );
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'edit_published_posts' );
		$user->add_cap( 'read', $can_read );
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_author'  => $user_id,
				'post_content' => get_post( $post_id )->post_content,
			)
		);
		wp_set_current_user( $user_id );

		$this->assertTrue( current_user_can( 'edit_post', $post_id ) );
		$this->assertSame( $can_read, current_user_can( 'read_post', $post_id ) );
		$this->assertFalse( current_user_can( 'upload_files' ) );
		$this->assertContains( $guid, Access_Control::build_and_cache_post_guids( $post_id ) );

		$activate_subscriptions = static function ( $modules ) {
			$modules[] = 'subscriptions';
			return $modules;
		};
		$request_count          = 0;
		$intercept_request      = static function () use ( &$request_count ) {
			++$request_count;
			return array( 'body' => wp_json_encode( array( 'metadata_token' => 'unexpected-playback-token' ), JSON_UNESCAPED_SLASHES ) );
		};
		add_filter( 'jetpack_active_modules', $activate_subscriptions );
		add_filter( 'pre_http_request', $intercept_request );
		self::$post_input = array(
			'guid'                 => $guid,
			'post_id'              => (string) $post_id,
			'subscription_plan_id' => (string) $submitted_plan,
		);
		try {
			$response = $this->call_ajax_method( 'wp_ajax_videopress_get_playback_jwt' );
			$this->assertFalse( $response['success'] );
			$this->assertSame( 'You cannot view this video.', $response['data']['message'] );
			$this->assertArrayNotHasKey( 'jwt', $response['data'] );
			$this->assertSame( 0, $request_count );
		} finally {
			self::$post_input = null;
			remove_filter( 'jetpack_active_modules', $activate_subscriptions );
			remove_filter( 'pre_http_request', $intercept_request );
			unset( $GLOBALS['__vp_paywall_held_plans'], $GLOBALS['__vp_paywall_received'], $GLOBALS['__vp_block_gate_received'] );
			\WorDBless\Posts::init()->clear_all_posts();
			\WorDBless\Options::init()->clear_options();
		}
	}

	/**
	 * @return array Playback requests from embedding editors without a subscription.
	 */
	public static function playback_editor_provider() {
		return array(
			'no read, no submitted plan' => array( false, 0 ),
			'no read, submitted plan'    => array( false, 111 ),
			'read, no submitted plan'    => array( true, 0 ),
			'read, submitted plan'       => array( true, 111 ),
		);
	}

	/**
	 * Create a private video and published embedding with a premium-content plan.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return int Embedding post ID.
	 */
	private function create_entitlement_playback_context( $guid ) {
		$attachment_id = wp_insert_post(
			array(
				'post_title'     => $guid,
				'post_author'    => get_current_user_id(),
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$attachment_id,
			array( 'videopress' => array( 'privacy_setting' => \VIDEOPRESS_PRIVACY::IS_PRIVATE ) )
		);
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $attachment_id, HOUR_IN_SECONDS );
		wp_cache_delete( 'get_post_by_guid_' . $guid, 'videopress' );

		return (int) wp_insert_post(
			array(
				'post_title'   => 'Paid video embed',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:premium-content/container {"selectedPlanIds":[222]} -->'
					. '<!-- wp:premium-content/subscriber-view -->'
					. '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->'
					. '<!-- /wp:premium-content/subscriber-view -->'
					. '<!-- /wp:premium-content/container -->',
			)
		);
	}

	/**
	 * Helper to call an AJAX method and return the decoded JSON response.
	 *
	 * @param string $method The AJAX method name.
	 * @return array The decoded JSON response.
	 */
	// phpcs:ignore Squiz.Commenting.FunctionCommentThrowTag -- PHPCS is mostly confused here.
	private function call_ajax_method( $method ) {
		add_filter( 'wp_doing_ajax', '__return_true' );

		// WorDBless overrides `wp_die` to not exit, which breaks `wp_send_json()`'s `@return never` behavior.
		// Override it to throw an exception (preserving the behavior) which we can catch and verify.
		$expected_exception = new \RuntimeException( 'wp_die' );
		$throw_die_handler  = /** @return never */ static function () use ( $expected_exception ) {
			throw $expected_exception;
		};
		add_filter( 'wp_die_ajax_handler', $throw_die_handler, 20 );

		ob_start();
		try {
			$this->ajax->$method();
		} catch ( \RuntimeException $caught_exception ) {
			if ( $caught_exception !== $expected_exception ) {
				throw $caught_exception;
			}
		}
		$output = ob_get_clean();

		remove_filter( 'wp_die_ajax_handler', $throw_die_handler, 20 );
		remove_filter( 'wp_doing_ajax', '__return_true' );

		$response = json_decode( $output, true );
		$this->assertNotNull( $response, "AJAX method '$method' did not return valid JSON. Output: " . substr( $output, 0, 200 ) );

		return $response;
	}

	/**
	 * Create a user with the given role and set as current user.
	 *
	 * @param string $role The user role.
	 */
	private function set_current_user_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'user_email' => $role . '@test.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Returns a mock HTTP response with a valid upload token.
	 *
	 * @return array
	 */
	public function return_valid_upload_response() {
		return array( 'body' => wp_json_encode( array( 'upload_token' => 'test-token' ), JSON_UNESCAPED_SLASHES ) );
	}
}
