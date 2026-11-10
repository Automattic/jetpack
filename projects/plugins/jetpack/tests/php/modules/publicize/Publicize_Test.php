<?php

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed

use Automattic\Jetpack\Publicize\Publicize;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\Group;

if ( ! function_exists( 'publicize_init' ) ) {
	/**
	 * Some tests rely on this function which won't get defined unless we mock lots
	 * of things and require the module code. Instead we'll define it here.
	 *
	 * @return \Automattic\Jetpack\Publicize\Publicize|\Publicize Object
	 * @phan-suppress PhanRedefineFunction
	 */
	function publicize_init() {
		global $publicize;

		return $publicize;
	}
}

/**
 * @group publicize
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
#[Group( 'publicize' )]
class Publicize_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * In the publish filter?
	 *
	 * @var bool
	 */
	private $in_publish_filter  = false;
	private $publicized_post_id = null;
	private $post;
	private $original_user = 0;

	/**
	 * Current test user id produced by factory method.
	 *
	 * @since 6.7.0
	 * @var integer $user_id ID of current user.
	 */
	private $user_id;

	private $publicize;

	/**
	 * Index in 'publicize_connections' test data of normal connection.
	 *
	 * @since 6.7.0
	 * @var integer NORMAL_CONNECTION_INDEX index number of normal connection.
	 */
	const NORMAL_CONNECTION_INDEX = 0;

	/**
	 * Index in 'publicize_connections' test data of global connection.
	 *
	 * @since 6.7.0
	 * @var integer GLOBAL_CONNECTION_INDEX index number of global connection.
	 */
	const GLOBAL_CONNECTION_INDEX = 1;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		global $publicize_ui;
		$publicize_ui = new Automattic\Jetpack\Publicize\Publicize_UI();

		$this->setup_publicize_mock();

		$this->publicize          = publicize_init();
		$this->publicized_post_id = null;

		$post_id    = self::factory()->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		$this->user_id = self::factory()->user->create();
		wp_set_current_user( $this->user_id );

		$social_connections = array(
			// Normally connected facebook.
			'facebook' => array(
				'id_number' => array(
					'connection_data' => array(
						'user_id'  => $this->user_id,
						'id'       => '456',
						'token_id' => 'test-unique-id456',
						'meta'     => array(
							'display_name' => 'test-display-name456',
						),
					),
				),
			),
			// Globally connected tumblr.
			'tumblr'   => array(
				'id_number' => array(
					'connection_data' => array(
						'user_id'  => 0,
						'id'       => '123',
						'token_id' => 'test-unique-id123',
						'meta'     => array(
							'display_name' => 'test-display-name123',
						),
					),
				),
			),
		);

		$this->publicize->receive_updated_publicize_connections( $social_connections );

		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags_check' ), 20, 2 );

		$this->original_user = get_current_user_id();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $GLOBALS['publicize'] );
		unset( $GLOBALS['publicize_ui'] );

		wp_set_current_user( $this->original_user );

		parent::tear_down();
	}

	private function setup_publicize_mock() {
		global $publicize;
		$this->publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'test_connection' ) )->getMock();

		$this->publicize->method( 'test_connection' )
			->withAnyParameters()
			->willReturn( true );

		$publicize = $this->publicize;
	}

	public function test_update_collapses_duplicate_publicize_meta_rows() {
		$message = 'Amaretti ! C:\\temp';
		add_post_meta( $this->post->ID, '_wpas_mess', wp_slash( $message ) );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Duplicate rows are the fixture.
		add_post_meta( $this->post->ID, '_wpas_mess', wp_slash( $message ) );

		$this->assertTrue( update_post_meta( $this->post->ID, '_wpas_mess', wp_slash( $message ) ) );
		$this->assertSame( array( $message ), get_post_meta( $this->post->ID, '_wpas_mess', false ) );

		add_post_meta( $this->post->ID, '_wpas_mess', 'other' );
		$this->assertTrue( update_post_meta( $this->post->ID, '_wpas_mess', 'new' ) );
		$this->assertSame( array( 'new' ), get_post_meta( $this->post->ID, '_wpas_mess', false ) );
	}

	public function test_update_collapses_duplicate_boolean_publicize_meta_rows() {
		add_post_meta( $this->post->ID, '_wpas_feature_enabled', true );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Duplicate rows are the fixture.
		add_post_meta( $this->post->ID, '_wpas_feature_enabled', true );

		$this->assertTrue( update_post_meta( $this->post->ID, '_wpas_feature_enabled', true ) );
		$this->assertSame( array( '1' ), get_post_meta( $this->post->ID, '_wpas_feature_enabled', false ) );
	}

	public function test_update_keeps_duplicate_publicize_meta_rows_when_write_fails() {
		add_post_meta( $this->post->ID, '_wpas_mess', 'old' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Duplicate rows are the fixture.
		add_post_meta( $this->post->ID, '_wpas_mess', 'old' );
		add_filter( 'update_post_metadata_by_mid', '__return_false' );

		$this->assertFalse( update_post_meta( $this->post->ID, '_wpas_mess', 'new' ) );
		$this->assertSame( array( 'old', 'old' ), get_post_meta( $this->post->ID, '_wpas_mess', false ) );
	}

	public function test_update_succeeds_when_a_duplicate_row_is_already_deleted() {
		add_post_meta( $this->post->ID, '_wpas_mess', 'old' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Duplicate rows are the fixture.
		add_post_meta( $this->post->ID, '_wpas_mess', 'old' );
		add_filter( 'delete_post_metadata_by_mid', '__return_false' );

		$this->assertTrue( update_post_meta( $this->post->ID, '_wpas_mess', 'new' ) );
		$this->assertSame( 'new', get_post_meta( $this->post->ID, '_wpas_mess', true ) );
	}

	public function test_rest_publish_completes_with_duplicate_publicize_meta_rows() {
		$this->publicize->add_post_type_support();
		$this->publicize->register_post_meta();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		add_post_meta( $this->post->ID, '_wpas_mess', 'Message' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Duplicate rows are the fixture.
		add_post_meta( $this->post->ID, '_wpas_mess', 'Message' );
		$after_insert_runs  = 0;
		$count_after_insert = function ( $post_id ) use ( &$after_insert_runs ) {
			$after_insert_runs += (int) ( $this->post->ID === $post_id );
		};
		add_action( 'wp_after_insert_post', $count_after_insert );

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . $this->post->ID );
		$request->set_body_params(
			array(
				'status' => 'publish',
				'meta'   => array( 'jetpack_publicize_message' => 'Message' ),
			)
		);
		$response = rest_do_request( $request );
		remove_action( 'wp_after_insert_post', $count_after_insert );

		$this->assertFalse( $response->is_error() );
		$this->assertSame( 1, $after_insert_runs );
		$this->assertSame( array( 'Message' ), get_post_meta( $this->post->ID, '_wpas_mess', false ) );
	}

	public function test_fires_jetpack_publicize_post_on_save_as_published() {
		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );
		$this->assertPublicized( true, $this->post );
	}

	public function test_does_not_fire_jetpack_publicize_post_on_save_as_published() {
		$this->post->post_status = 'publish';

		$this->publicize->receive_updated_publicize_connections( array() );
		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );
	}

	public function test_does_not_fire_jetpack_publicize_post_on_other_status_transitions() {
		$this->post->post_status = 'pending';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );
	}

	public function test_filter_can_prevent_publicize() {
		add_filter( 'publicize_should_publicize_published_post', array( $this, 'prevent_publicize_post' ) );

		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );
	}

	public function test_publicize_does_not_fire_on_post_types_that_do_not_support_it() {
		$args = array(
			'public' => true,
			'label'  => 'unregister post type',
		);
		register_post_type( 'foo', $args );
		$this->post->post_type   = 'foo';
		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );

		unregister_post_type( 'foo' );
	}

	public function assertPublicized( $should_have_publicized, $post ) {
		if ( $should_have_publicized ) {
			$this->assertEquals( $post->ID, $this->publicized_post_id, 'Is not the same post ID' );
			$this->assertTrue( $this->in_publish_filter, 'Not in filter' );
		} else {
			$this->assertNull( $this->publicized_post_id, 'Not Null' );
			$this->assertFalse( $this->in_publish_filter, 'in filter' );
		}
	}

	public function set_post_flags_check( $flags, $post ) {
		if ( $flags['publicize_post'] ) {
			$this->publicized_post_id = $post->ID;
		}
		$this->in_publish_filter = $flags['publicize_post'];
		return $flags;
	}

	public function prevent_publicize_post() {
		return false;
	}

	/**
	 * Verifies two methods of making custom post types publicizeable,
	 * as given in the Jetpack documentation.
	 *
	 * @see https://jetpack.com/support/publicize/
	 *
	 * @since 4.6.0
	 */
	public function test_publicize_post_type_is_publicizeable_cpt() {
		$publicize = publicize_init();

		$this->assertFalse(
			$publicize->post_type_is_publicizeable( 'unpub-post-type' )
		);

		// Method 1: Directly call add_post_type_support.
		add_post_type_support( 'pub-post-type-1', 'publicize' );

		$this->assertTrue(
			$publicize->post_type_is_publicizeable( 'pub-post-type-1' )
		);

		// Method 2: Add support at registration time.
		register_post_type(
			'pub-post-type-2',
			array(
				'label'    => 'publicizeable-post-type-2',
				'supports' => array( 'publicize' ),
			)
		);

		$this->assertTrue(
			$publicize->post_type_is_publicizeable( 'pub-post-type-2' )
		);

		unregister_post_type( 'pub-post-type-2' );
	}

	/**
	 * Verifies that "done sharing post" logic is correct. Checks
	 * the helper method that checks post flags to prevent re-sharing
	 * of already shared post.
	 *
	 * @since 6.7.0
	 */
	public function test_post_is_done_sharing_for_done_all() {
		$this->assertFalse(
			$this->publicize->post_is_done_sharing( $this->post->ID ),
			'Unshared/published post should not be \'done\''
		);
		update_post_meta( $this->post->ID, $this->publicize->POST_DONE . 'all', true );
		$this->assertTrue(
			$this->publicize->post_is_done_sharing( $this->post->ID ),
			'Posts flagged as \'done\' should return true done sharing'
		);
	}

	/**
	 * Verifies that "done sharing post" logic is correct. Checks
	 * that already published post is correctly reported as 'done'.
	 *
	 * @since 6.7.0
	 */
	public function test_post_is_done_sharing_for_published() {
		$this->assertFalse(
			$this->publicize->post_is_done_sharing( $this->post->ID ),
			'Unshared/published post should not be \'done\''
		);

		// 'Publish' the post.
		$this->post->post_status = 'publish';
		wp_insert_post( $this->post->to_array() );

		$this->assertTrue(
			$this->publicize->post_is_done_sharing( $this->post->ID ),
			'Published post should be flagged as \'done\''
		);
	}

	/**
	 * Verify case where no post id is provided and there is
	 * no current post. 'Done' return value should be false
	 * so a new post will not have connections disabled.
	 *
	 * @since 6.7.0
	 */
	public function test_post_is_done_sharing_null_post() {
		/**
		 * Simulate null post by not providing post_id argument and
		 * when current $post value is unset.
		 */
		$done_sharing = $this->publicize->post_is_done_sharing();
		$this->assertFalse(
			$done_sharing,
			'Done sharing value should be false for null post id'
		);
	}

	/**
	 * Test that newlines are not stripped from multiline custom messages
	 * in the classic editor interface.
	 */
	public function test_newlines_preserved_with_custom_message() {
		$_SERVER['REQUEST_METHOD'] = 'post';
		$test_message              = "This is\na multiline\nmessage";
		$_POST['wpas_title']       = $test_message;
		$_POST['wpas']             = 'submit';

		$this->post->post_status = 'publish';
		$post_id                 = wp_insert_post( $this->post->to_array() );

		$this->assertEquals( $test_message, get_post_meta( $post_id, $this->publicize->POST_MESS, true ) );
	}
}
