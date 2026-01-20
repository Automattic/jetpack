<?php /** @noinspection PhpParamsInspection */

/**
 * Tests for WPCOM_JSON_API_Update_Comment_Endpoint.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for WPCOM_JSON_API_Update_Comment_Endpoint.
 *
 * @covers \WPCOM_JSON_API_Update_Comment_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Update_Comment_Endpoint::class )]
class WPCOM_JSON_API_Update_Comment_Endpoint_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Commenting user IP-address.
	 */
	const USER_IP = '123.45.67.89';

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private static $subscriber_user_id;

	/**
	 * Test post ID.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id = $factory->user->create(
			array(
				'role'         => 'administrator',
				'display_name' => 'Admin User',
				'user_email'   => 'admin@example.com',
				'user_url'     => 'https://example.com',
			)
		);

		self::$subscriber_user_id = $factory->user->create(
			array(
				'role'         => 'subscriber',
				'display_name' => 'Subscriber User',
				'user_email'   => 'subscriber@example.com',
				'user_url'     => 'https://subscriber.example.com',
			)
		);

		self::$post_id = $factory->post->create(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
				'post_author'  => self::$admin_user_id,
			)
		);
	}

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		global $blog_id;

		parent::set_up();

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array(
			'blog_id' => $blog_id,
			'user'    => array(
				'user_ip' => self::USER_IP,
			),
		);

		wp_set_current_user( self::$admin_user_id );

		add_filter( 'jetpack_subscription_comment_subscribe_skip', '__return_true' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		// Clean up any comments created during tests.
		$comments = get_comments( array( 'post_id' => self::$post_id ) );
		foreach ( $comments as $comment ) {
			wp_delete_comment( (int) $comment->comment_ID, true );
		}

		remove_filter( 'jetpack_subscription_comment_subscribe_skip', '__return_true' );

		WPCOM_JSON_API::init()->token_details = array();

		parent::tear_down();
	}

	/**
	 * Create an endpoint for creating a new comment on a post.
	 *
	 * @return WPCOM_JSON_API_Update_Comment_Endpoint
	 */
	private function create_new_post_reply_endpoint() {
		return new WPCOM_JSON_API_Update_Comment_Endpoint(
			array(
				'description'                          => 'Create a comment on a post.',
				'group'                                => 'comments',
				'stat'                                 => 'posts:1:replies:new',
				'method'                               => 'POST',
				'path'                                 => '/sites/%s/posts/%d/replies/new',
				'path_labels'                          => array(
					'$site'    => '(int|string) Site ID or domain',
					'$post_ID' => '(int) The post ID',
				),
				'request_format'                       => array(
					'content' => '(HTML) The comment text.',
				),
				'pass_wpcom_user_details'              => true,
				'allow_fallback_to_jetpack_blog_token' => true,
			)
		);
	}

	/**
	 * Create an endpoint for creating a reply to a comment.
	 *
	 * @return WPCOM_JSON_API_Update_Comment_Endpoint
	 */
	private function create_new_comment_reply_endpoint() {
		return new WPCOM_JSON_API_Update_Comment_Endpoint(
			array(
				'description'                          => 'Create a comment as a reply to another comment.',
				'group'                                => 'comments',
				'stat'                                 => 'comments:1:replies:new',
				'method'                               => 'POST',
				'path'                                 => '/sites/%s/comments/%d/replies/new',
				'path_labels'                          => array(
					'$site'       => '(int|string) Site ID or domain',
					'$comment_ID' => '(int) The comment ID',
				),
				'request_format'                       => array(
					'content' => '(HTML) The comment text.',
				),
				'pass_wpcom_user_details'              => true,
				'allow_fallback_to_jetpack_blog_token' => true,
			)
		);
	}

	/**
	 * Create an endpoint for editing a comment.
	 *
	 * @return WPCOM_JSON_API_Update_Comment_Endpoint
	 */
	private function create_edit_comment_endpoint() {
		return new WPCOM_JSON_API_Update_Comment_Endpoint(
			array(
				'description'    => 'Edit a comment.',
				'group'          => 'comments',
				'stat'           => 'comments:1:POST',
				'method'         => 'POST',
				'path'           => '/sites/%s/comments/%d',
				'path_labels'    => array(
					'$site'       => '(int|string) Site ID or domain',
					'$comment_ID' => '(int) The comment ID',
				),
				'request_format' => array(
					'author'       => "(string) The comment author's name.",
					'author_email' => "(string) The comment author's email.",
					'author_url'   => "(string) The comment author's URL.",
					'content'      => '(HTML) The comment text.',
					'date'         => "(ISO 8601 datetime) The comment's creation time.",
					'status'       => array(
						'approved'   => 'Approve the comment.',
						'unapproved' => 'Remove the comment from public view.',
						'spam'       => 'Mark the comment as spam.',
						'unspam'     => 'Unmark the comment as spam.',
						'trash'      => 'Send a comment to the trash.',
						'untrash'    => 'Untrash a comment.',
					),
				),
			)
		);
	}

	/**
	 * Create an endpoint for deleting a comment.
	 *
	 * @return WPCOM_JSON_API_Update_Comment_Endpoint
	 */
	private function create_delete_comment_endpoint() {
		return new WPCOM_JSON_API_Update_Comment_Endpoint(
			array(
				'description' => 'Delete a comment.',
				'group'       => 'comments',
				'stat'        => 'comments:1:delete',
				'method'      => 'POST',
				'path'        => '/sites/%s/comments/%d/delete',
				'path_labels' => array(
					'$site'       => '(int|string) Site ID or domain',
					'$comment_ID' => '(int) The comment ID',
				),
			)
		);
	}

	/**
	 * Create a test comment.
	 *
	 * @param array $args Optional. Comment arguments.
	 * @return int Comment ID.
	 */
	private function create_comment( $args = array() ) {
		$defaults = array(
			'comment_post_ID'      => self::$post_id,
			'comment_author'       => 'Test Author',
			'comment_author_email' => 'test@example.com',
			'comment_author_url'   => 'https://test.example.com',
			'comment_content'      => 'Test comment content',
			'comment_approved'     => 1,
			'user_id'              => self::$admin_user_id,
		);

		return wp_insert_comment( array_merge( $defaults, $args ) );
	}

	/**
	 * Set the request input for the API endpoint.
	 *
	 * @param array $input Input data.
	 */
	private function set_input( $input ) {
		WPCOM_JSON_API::init()->post_body    = wp_json_encode( $input, JSON_UNESCAPED_SLASHES );
		WPCOM_JSON_API::init()->content_type = 'application/json';
	}

	/**
	 * Test new_comment creates a comment on a post.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_on_post() {
		global $blog_id;

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, self::$post_id );

		$content = 'This is a new comment on the post.';
		$this->set_input( compact( 'content' ) );

		$response = $endpoint->callback( $path, $blog_id, self::$post_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertArrayHasKey( 'ID', $response, 'Response should have an ID.' );
		$this->assertArrayHasKey( 'content', $response, 'Response should have content.' );
		$this->assertStringContainsString( $content, $response['content'], 'Comment content should match what we just added.' );

		// Verify the comment was actually created.
		$comment = get_comment( $response['ID'] );
		$this->assertNotNull( $comment, 'Comment should exist in the database.' );
		$this->assertEquals( self::$post_id, $comment->comment_post_ID, 'Comment should be attached to the correct post.' );
		$this->assertEquals( self::USER_IP, $comment->comment_author_IP );
	}

	/**
	 * Test new_comment creates a comment on a post even with invalid IP-address provided by WPCOM.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_on_post_wrong_ip() {
		global $blog_id;

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, self::$post_id );

		$endpoint->api->token_details['user']['user_ip'] = '12-34-56-wrong-ip';

		$content = 'This is a new comment on the post.';
		$this->set_input( compact( 'content' ) );

		$response = $endpoint->callback( $path, $blog_id, self::$post_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertArrayHasKey( 'ID', $response, 'Response should have an ID.' );
		$this->assertArrayHasKey( 'content', $response, 'Response should have content.' );
		$this->assertStringContainsString( $content, $response['content'], 'Comment content should match what we just added.' );

		// Verify the comment was actually created.
		$comment = get_comment( $response['ID'] );
		$this->assertNotNull( $comment, 'Comment should exist in the database.' );
		$this->assertEquals( self::$post_id, $comment->comment_post_ID, 'Comment should be attached to the correct post.' );
		$this->assertNotEquals( self::USER_IP, $comment->comment_author_IP );
	}

	/**
	 * Test new_comment creates a comment on a post even with IP-address not provided.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_on_post_missing_ip() {
		global $blog_id;

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, self::$post_id );

		unset( $endpoint->api->token_details['user']['user_ip'] );

		$content = 'This is a new comment on the post.';
		$this->set_input( compact( 'content' ) );

		$response = $endpoint->callback( $path, $blog_id, self::$post_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertArrayHasKey( 'ID', $response, 'Response should have an ID.' );
		$this->assertArrayHasKey( 'content', $response, 'Response should have content.' );
		$this->assertStringContainsString( $content, $response['content'], 'Comment content should match what we just added.' );

		// Verify the comment was actually created.
		$comment = get_comment( $response['ID'] );
		$this->assertNotNull( $comment, 'Comment should exist in the database.' );
		$this->assertEquals( self::$post_id, $comment->comment_post_ID, 'Comment should be attached to the correct post.' );
		$this->assertNotEquals( self::USER_IP, $comment->comment_author_IP );
	}

	/**
	 * Test new_comment creates a reply to another comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_as_reply_to_comment() {
		global $blog_id;

		// Create parent comment first.
		$parent_comment_id = $this->create_comment();

		$endpoint = $this->create_new_comment_reply_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d/replies/new', $blog_id, $parent_comment_id );

		$content = 'This is a reply to the parent comment.';
		$this->set_input( compact( 'content' ) );

		$response = $endpoint->callback( $path, $blog_id, $parent_comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertArrayHasKey( 'ID', $response, 'Response should have an ID.' );
		$this->assertArrayHasKey( 'parent', $response, 'Response should have parent.' );
		$this->assertEquals( $parent_comment_id, $response['parent']->ID, 'Parent ID should match.' );
		$this->assertStringContainsString( $content, $response['content'], 'Comment content should match what we just added.' );

		// Verify the comment was created with correct parent.
		$comment = get_comment( $response['ID'] );
		$this->assertNotNull( $comment, 'Comment should exist in the database.' );
		$this->assertEquals( $parent_comment_id, $comment->comment_parent, 'Comment parent should be set correctly.' );
		$this->assertEquals( self::USER_IP, $comment->comment_author_IP );
	}

	/**
	 * Test new_comment returns error for unknown post.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_on_unknown_post() {
		global $blog_id;

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, 999999 );

		$this->set_input( array( 'content' => 'Comment on non-existent post.' ) );

		$response = $endpoint->callback( $path, $blog_id, 999999 );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unknown_post', $response->get_error_code() );
	}

	/**
	 * Test new_comment returns error for unknown parent comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_reply_to_unknown_comment() {
		global $blog_id;

		$endpoint = $this->create_new_comment_reply_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d/replies/new', $blog_id, 999999 );

		$this->set_input( array( 'content' => 'Reply to non-existent comment.' ) );

		$response = $endpoint->callback( $path, $blog_id, 999999 );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unknown_comment', $response->get_error_code() );
	}

	/**
	 * Test new_comment returns error for empty content.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_empty_content() {
		global $blog_id;

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, self::$post_id );

		$this->set_input( array( 'content' => '' ) );

		$response = $endpoint->callback( $path, $blog_id, self::$post_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'invalid_input', $response->get_error_code() );
	}

	/**
	 * Test new_comment returns error when comments are closed.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_on_post_with_closed_comments() {
		global $blog_id;

		// Close comments on the post.
		wp_update_post(
			array(
				'ID'             => self::$post_id,
				'comment_status' => 'closed',
			)
		);

		// Use a subscriber user who cannot edit the post.
		wp_set_current_user( self::$subscriber_user_id );

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, self::$post_id );

		$this->set_input( array( 'content' => 'Comment on closed post.' ) );

		$response = $endpoint->callback( $path, $blog_id, self::$post_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unauthorized', $response->get_error_code() );
		$this->assertStringContainsString( 'Comments on this post are closed', $response->get_error_message() );

		// Re-open comments for other tests.
		wp_update_post(
			array(
				'ID'             => self::$post_id,
				'comment_status' => 'open',
			)
		);
	}

	/**
	 * Test update_comment changes comment content.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_content() {
		global $blog_id;

		$comment_id = $this->create_comment( array( 'comment_content' => 'Original content' ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'content' => 'Updated content' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertStringContainsString( 'Updated content', $response['content'] );

		// Verify the comment was actually updated.
		$comment = get_comment( $comment_id );
		$this->assertStringContainsString( 'Updated content', $comment->comment_content );
	}

	/**
	 * Test update_comment changes author information.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_author_info() {
		global $blog_id;

		$comment_id = $this->create_comment();

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input(
			array(
				'author'       => 'New Author Name',
				'author_email' => 'new-email@example.com',
				'author_url'   => 'https://new-url.example.com',
			)
		);

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );

		// Verify the comment was updated.
		$comment = get_comment( $comment_id );
		$this->assertEquals( 'New Author Name', $comment->comment_author );
		$this->assertEquals( 'new-email@example.com', $comment->comment_author_email );
		$this->assertEquals( 'https://new-url.example.com', $comment->comment_author_url );
	}

	/**
	 * Test update_comment returns error for unknown comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_unknown_comment() {
		global $blog_id;

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, 999999 );

		$this->set_input( array( 'content' => 'Update non-existent comment' ) );

		$response = $endpoint->callback( $path, $blog_id, 999999 );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unknown_comment', $response->get_error_code() );
	}

	/**
	 * Test update_comment returns error when user cannot edit.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_unauthorized() {
		global $blog_id;

		$comment_id = $this->create_comment();

		// Switch to subscriber who cannot edit comments.
		wp_set_current_user( self::$subscriber_user_id );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'content' => 'Unauthorized update' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unauthorized', $response->get_error_code() );
	}

	/**
	 * Test update_comment approves an unapproved comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_status_approved() {
		global $blog_id;

		$comment_id = $this->create_comment( array( 'comment_approved' => 0 ) );
		$this->assertEquals( 'unapproved', wp_get_comment_status( $comment_id ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'status' => 'approved' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertEquals( 'approved', $response['status'] );
		$this->assertEquals( 'approved', wp_get_comment_status( $comment_id ) );
	}

	/**
	 * Test update_comment unapproves an approved comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_status_unapproved() {
		global $blog_id;

		$comment_id = $this->create_comment( array( 'comment_approved' => 1 ) );
		$this->assertEquals( 'approved', wp_get_comment_status( $comment_id ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'status' => 'unapproved' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertEquals( 'unapproved', $response['status'] );
		$this->assertEquals( 'unapproved', wp_get_comment_status( $comment_id ) );
	}

	/**
	 * Test update_comment marks a comment as spam.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_status_spam() {
		global $blog_id;

		$comment_id = $this->create_comment( array( 'comment_approved' => 1 ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'status' => 'spam' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertEquals( 'spam', $response['status'] );
		$this->assertEquals( 'spam', wp_get_comment_status( $comment_id ) );
	}

	/**
	 * Test update_comment unspams a spam comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_status_unspam() {
		global $blog_id;

		$comment_id = $this->create_comment( array( 'comment_approved' => 'spam' ) );
		$this->assertEquals( 'spam', wp_get_comment_status( $comment_id ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'status' => 'unspam' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertNotEquals( 'spam', $response['status'] );
	}

	/**
	 * Test update_comment trashes a comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_status_trash() {
		global $blog_id;

		// Make sure EMPTY_TRASH_DAYS is set.
		if ( ! defined( 'EMPTY_TRASH_DAYS' ) ) {
			define( 'EMPTY_TRASH_DAYS', 30 );
		}

		$comment_id = $this->create_comment( array( 'comment_approved' => 1 ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'status' => 'trash' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		// If EMPTY_TRASH_DAYS is set, the comment should be trashed.
		if ( EMPTY_TRASH_DAYS ) {
			$this->assertIsArray( $response, 'Response should be an array.' );
			$this->assertEquals( 'trash', wp_get_comment_status( $comment_id ) );
		} else {
			// If trash is disabled, we should get an error.
			$this->assertInstanceOf( WP_Error::class, $response );
			$this->assertEquals( 'trash_disabled', $response->get_error_code() );
		}
	}

	/**
	 * Test update_comment untrashes a comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_status_untrash() {
		global $blog_id;

		$comment_id = $this->create_comment( array( 'comment_approved' => 'trash' ) );
		$this->assertEquals( 'trash', wp_get_comment_status( $comment_id ) );

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array( 'status' => 'untrash' ) );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertNotEquals( 'trash', wp_get_comment_status( $comment_id ) );
	}

	/**
	 * Test update_comment returns error for empty input.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_update_comment_empty_input() {
		global $blog_id;

		$comment_id = $this->create_comment();

		$endpoint = $this->create_edit_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d', $blog_id, $comment_id );

		$this->set_input( array() );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'invalid_input', $response->get_error_code() );
	}

	/**
	 * Test delete_comment deletes a comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_delete_comment() {
		global $blog_id;

		$comment_id = $this->create_comment();
		$this->assertNotNull( get_comment( $comment_id ), 'Comment should exist before deletion.' );

		$endpoint = $this->create_delete_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d/delete', $blog_id, $comment_id );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertIsArray( $response, 'Response should be an array.' );
		$this->assertArrayHasKey( 'ID', $response, 'Response should have an ID.' );
		$this->assertEquals( $comment_id, $response['ID'] );
	}

	/**
	 * Test delete_comment returns error for unknown comment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_delete_comment_unknown() {
		global $blog_id;

		$endpoint = $this->create_delete_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d/delete', $blog_id, 999999 );

		$response = $endpoint->callback( $path, $blog_id, 999999 );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unknown_comment', $response->get_error_code() );
	}

	/**
	 * Test delete_comment returns error when user cannot delete.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_delete_comment_unauthorized() {
		global $blog_id;

		$comment_id = $this->create_comment();

		// Switch to subscriber who cannot delete comments.
		wp_set_current_user( self::$subscriber_user_id );

		$endpoint = $this->create_delete_comment_endpoint();
		$path     = sprintf( '/sites/%d/comments/%d/delete', $blog_id, $comment_id );

		$response = $endpoint->callback( $path, $blog_id, $comment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unauthorized', $response->get_error_code() );
	}

	/**
	 * Test new_comment on draft post returns error.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_new_comment_on_draft_post() {
		global $blog_id;

		// Create a draft post.
		$draft_post_id = $this->factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$admin_user_id,
			)
		);

		$endpoint = $this->create_new_post_reply_endpoint();
		$path     = sprintf( '/sites/%d/posts/%d/replies/new', $blog_id, $draft_post_id );

		$this->set_input( array( 'content' => 'Comment on draft.' ) );

		$response = $endpoint->callback( $path, $blog_id, $draft_post_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'unauthorized', $response->get_error_code() );
		$this->assertStringContainsString( 'drafts', $response->get_error_message() );
	}
}
