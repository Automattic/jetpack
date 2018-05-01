<?php
require_once dirname( __FILE__ ) . '/../../../../modules/publicize.php';

class WP_Test_Publicize extends WP_UnitTestCase {


	private $in_publish_filter = false;
	private $publicized_post_id = null;
	private $post;
	private $original_user = 0;

	/**
	 * Current test user id produced by factory method.
	 *
	 * @since 5.9.1
	 * @var integer $user_id ID of current user.
	 */
	private $user_id;

	public function setUp() {
		parent::setUp();

		$this->publicize = publicize_init();
		$this->publicized_post_id = null;

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		$this->user_id = $this->factory->user->create();
		wp_set_current_user( $this->user_id );

		Jetpack_Options::update_options( array(
			'publicize_connections' => array(
				'facebook' => array(
					'id_number' => array(
						'connection_data' => array(
							'user_id'  => 0,
							'token_id' => 'test-unique-id123',
							'meta'     => array(
								'display_name' => 'test-display-name123',
							),
						),
					),
				),
				'tumblr'   => array(
					'id_number' => array(
						'connection_data' => array(
							'user_id'  => $this->user_id,
							'token_id' => 'test-unique-id456',
							'meta'     => array(
								'display_name' => 'test-display-name456',
							),
						),
					),
				),
			),
		) );

		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags_check' ), 20, 2 );

		$this->original_user = get_current_user_id();
	}

	public function tearDown() {
		wp_set_current_user( $this->original_user );

		parent::tearDown();
	}

	public function test_fires_jetpack_publicize_post_on_save_as_published() {
		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );
		$this->assertPublicized( true, $this->post );
	}

	public function test_does_not_fire_jetpack_publicize_post_on_save_as_published() {
		$this->post->post_status = 'publish';

		Jetpack_Options::delete_option( array( 'publicize_connections' ) );
		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );
	}

	public function test_does_not_fire_jetpack_publicize_post_on_other_status_transitions() {
		$this->post->post_status = 'pending';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );
	}

	public function test_filter_can_prevent_publicize() {
		add_filter( 'publicize_should_publicize_published_post', array( $this, 'prevent_publicize_post' ), 10, 2 );

		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );
	}

	public function test_publicize_does_not_fire_on_post_types_that_do_not_support_it() {
		$args = array(
			'public' => true,
			'label'  => 'unregister post type'
		);
		register_post_type( 'foo', $args );
		$this->post->post_type = 'foo';
		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( false, $this->post );

		unregister_post_type( 'foo' );
	}

	function assertPublicized( $should_have_publicized, $post ) {
		if ( $should_have_publicized ) {
			$this->assertEquals( $post->ID, $this->publicized_post_id, 'Is not the same post ID' );
			$this->assertTrue( $this->in_publish_filter, 'Not in filter' );
		} else {
			$this->assertNull( $this->publicized_post_id, 'Not Null' );
			$this->assertFalse( $this->in_publish_filter, 'in filter' );
		}
	}

	function set_post_flags_check( $flags, $post ) {
		if ( $flags['publicize_post'] ) {
			$this->publicized_post_id = $post->ID;
		}
		$this->in_publish_filter = $flags['publicize_post'];
		return $flags;
	}

	function prevent_publicize_post( $should_publicize, $post ) {
		return false;
	}

	/**
	 * Verifies two methods of making custom post types publicizeable,
	 * as given in the Jetpack documentation.
	 *
	 * @see https://jetpack.com/support/publicize/
	 *
	 * @covers Publicize::post_type_is_publicizeable()
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

	public function test_publicize_get_all_connections_for_user() {
		$facebook_connection = array(
			'id_number' => array(
				'connection_data' => array(
					'user_id' => 0,
				)
			)
		);
		$twitter_connection = array(
			'id_number_2' => array(
				'connection_data' => array(
					'user_id' => 1,
				)
			)
		);
		Jetpack_Options::update_options( array(
			'publicize_connections' => array(
				'facebook' => $facebook_connection,
				'twitter'  => $twitter_connection,
			)
		) );

		$publicize = publicize_init();

		// When logged out, assert that blog-level connections are returned.
		wp_set_current_user( 0 );
		$this->assertSame( array( 'facebook' => $facebook_connection ), $publicize->get_all_connections_for_user() );

		// When logged in, assert that blog-level connections AND any connections for the current user are returned.
		wp_set_current_user( 1 );
		$this->assertSame(
			array(
			'facebook' => $facebook_connection,
			'twitter' => $twitter_connection
			),
			$publicize->get_all_connections_for_user()
		);

		// There are no connections for user 2, so we should only get blog-level connections.
		wp_set_current_user( 2 );
		$this->assertSame( array( 'facebook' => $facebook_connection ), $publicize->get_all_connections_for_user() );
	}

	/**
	 * Verifies that "done sharing post" logic is correct. Checks
	 * the helper method that checks post flags to prevent re-sharing
	 * of already shared post.
	 *
	 * @covers Publicize_UI::done_sharing_post()
	 * @since 5.9.1
	 * @global Publicize_UI $publicize_ui instance of class that contains helper methods for ui generation.
	 */
	public function test_done_sharing_post_for_done_all() {
		global $publicize_ui;
		$this->assertFalse(
			$publicize_ui->done_sharing_post( $this->post->ID ),
			'Unshared/published post should not be \'done\''
		);
		update_post_meta( $this->post->ID, $this->publicize->POST_DONE . 'all', true );
		$this->assertTrue(
			$publicize_ui->done_sharing_post( $this->post->ID ),
			'Posts flagged as \'done\' should return true done sharing'
		);
	}

	/**
	 * Verifies that "done sharing post" logic is correct. Checks
	 * that already published post is correctly reported as 'done'.
	 *
	 * @covers Publicize_UI::done_sharing_post()
	 * @since 5.9.1
	 * @global Publicize_UI $publicize_ui instance of class that contains helper methods for ui generation.
	 */
	public function test_done_sharing_post_for_published() {
		global $publicize_ui;
		$this->assertFalse(
			$publicize_ui->done_sharing_post( $this->post->ID ),
			'Unshared/published post should not be \'done\''
		);

		// 'Publish' the post.
		$this->post->post_status = 'publish';
		wp_insert_post( $this->post->to_array() );

		$this->assertTrue(
			$publicize_ui->done_sharing_post( $this->post->ID ),
			'Published post should be flagged as \'done\''
		);
	}

	/**
	 * Verifies that get_services_connected returns all test
	 * connections that are valid for the current user.
	 *
	 * @covers Publicize_UI::get_services_connected()
	 * @since 5.9.1
	 */
	public function test_get_services_connected() {
		$connected_services = $this->publicize->get_services( 'connected' );
		$this->assertTrue( isset( $connected_services['facebook'] ) );
		$this->assertTrue( isset( $connected_services['tumblr'] ) );
	}

	/**
	 * Verifies that connection data is returned correctly
	 * when there are no connection filters and the post
	 * has not been shared yet.
	 *
	 * @covers Publicize_UI::get_filtered_connection_data()
	 * @since 5.9.1
	 */
	public function test_get_filtered_connection_data_no_filters() {
		global $publicize_ui;
		$connection_list = $publicize_ui->get_filtered_connection_data( $this->post->ID );
		// Get 'tumblr' test connection entry.
		$test_c = $connection_list[1];
		$this->assertEquals(
			'test-unique-id456',
			$test_c['unique_id']
		);
		$this->assertEquals(
			'tumblr',
			$test_c['name'],
			'Second test connection name should be \'tumbler\''
		);
		$this->assertTrue(
			$test_c['checked'],
			'The connection has not been shared to and there are no filters so connection should be \'checked\' by default.'
		);
		$this->assertEquals(
			'',
			$test_c['disabled'],
			'Connection should not be disabled, so disabled string should be empty.'
		);
		$this->assertTrue(
			$test_c['active'],
			'Connection should be active because there are no filters and the connection has not been shared to.'
		);
		$this->assertFalse(
			$test_c['hidden_checkbox'],
			'hidden_checkbox should be false since current user can use this connection.'
		);
		$this->assertEquals(
			'Tumblr: test-display-name456',
			$test_c['label'],
			'Label should follow pattern: [Service name]: [user-display-name].'
		);
		$this->assertEquals(
			'test-display-name456',
			$test_c['display_name']
		);
	}
}
