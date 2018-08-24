<?php
require dirname( __FILE__ ) . '/../../../../modules/publicize.php';

class WP_Test_Publicize extends WP_UnitTestCase {


	private $in_publish_filter = false;
	private $publicized_post_id = null;
	private $post;
	private $original_user = 0;

	/**
	 * Current test user id produced by factory method.
	 *
	 * @since 6.5.0
	 * @var integer $user_id ID of current user.
	 */
	private $user_id;

	/**
	 * Index in 'publicize_connections' test data of Facebook connection.
	 *
	 * @since 6.5.0
	 * @var integer FACEBOOK_CONNECTION_INDEX index number of facebook connection.
	 */
	const FACEBOOK_CONNECTION_INDEX = 0;

	/**
	 * Index in 'publicize_connections' test data of Tumblr connection.
	 *
	 * @since 6.5.0
	 * @var integer TUMBLR_CONNECTION_INDEX index number of Tumblr connection.
	 */
	const TUMBLR_CONNECTION_INDEX = 1;

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
	 * @covers Publicize::done_sharing_post()
	 * @since 6.5.0
	 */
	public function test_done_sharing_post_for_done_all() {
		$this->assertFalse(
			$this->publicize->done_sharing_post( $this->post->ID ),
			'Unshared/published post should not be \'done\''
		);
		update_post_meta( $this->post->ID, $this->publicize->POST_DONE . 'all', true );
		$this->assertTrue(
			$this->publicize->done_sharing_post( $this->post->ID ),
			'Posts flagged as \'done\' should return true done sharing'
		);
	}

	/**
	 * Verifies that "done sharing post" logic is correct. Checks
	 * that already published post is correctly reported as 'done'.
	 *
	 * @covers Publicize::done_sharing_post()
	 * @since 6.5.0
	 */
	public function test_done_sharing_post_for_published() {
		$this->assertFalse(
			$this->publicize->done_sharing_post( $this->post->ID ),
			'Unshared/published post should not be \'done\''
		);

		// 'Publish' the post.
		$this->post->post_status = 'publish';
		wp_insert_post( $this->post->to_array() );

		$this->assertTrue(
			$this->publicize->done_sharing_post( $this->post->ID ),
			'Published post should be flagged as \'done\''
		);
	}

	/**
	 * Verifies that get_services_connected returns all test
	 * connections that are valid for the current user.
	 *
	 * @covers Publicize::get_services_connected()
	 * @since 6.5.0
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
	 * @covers Publicize::get_filtered_connection_data()
	 * @since 6.5.0
	 */
	public function test_get_filtered_connection_data_no_filters() {
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$test_c          = $connection_list[ self::TUMBLR_CONNECTION_INDEX ];
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

	/**
	 * Verify case where no post id is provided and there is
	 * no current post. 'Done' return value should be false
	 * so a new post will not have connections disabled.
	 *
	 * @covers Publicize::done_sharing_post()
	 * @since 6.5.0
	 */
	public function test_done_sharing_post_null_post() {
		/**
		 * Simulate null post by not providing post_id argument and
		 * when current $post value is unset.
		 */
		$done_sharing = $this->publicize->done_sharing_post();
		$this->assertFalse(
			$done_sharing,
			'Done sharing value should be false for null post id'
		);
	}

	/**
	 * Verify case where no post id is provided and there is
	 * no current post. Connections data should be passed
	 * through without disabling connections.
	 *
	 * @covers Publicize::get_filtered_connection_data()
	 * @since 6.5.0
	 */
	public function test_get_filtered_connection_data_null_post() {
		/**
		 * Simulate null post by not providing post_id argument and
		 * when current $post value is unset.
		 */
		$connection_list   = $this->publicize->get_filtered_connection_data();
		$tumblr_connection = $connection_list[ self::TUMBLR_CONNECTION_INDEX ];
		$this->assertFalse(
			$tumblr_connection['disabled'],
			'All connections should be enabled for null post id'
		);
	}

	/**
	 * Verify 'wpas_submit_post?' filter functionality by checking
	 * connection list before and after a 'no facebook' filter has
	 * been applied.
	 *
	 * @covers Publicize::get_filtered_connection_data()
	 * @since 6.5.0
	 */
	public function test_filter_wpas_submit_post() {
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );
		// Second connection should be 'tumblr' for unfiltered list.
		$facebook_connection = $connection_list[ self::FACEBOOK_CONNECTION_INDEX ];
		$this->assertEquals(
			'facebook',
			$facebook_connection['name'],
			'Facebook connection should be available prior to filtering'
		);

		add_filter( 'wpas_submit_post?', array( $this, 'publicize_connection_filter_no_facebook' ), 10, 4 );
		// Get connection list again now that filter has been added.
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );

		$this->assertEquals(
			1,
			count( $connection_list ),
			'Connection list should be 1 long after \'facebook\' connection removed.'
		);
		// First and only connection should be 'tumblr' for unfiltered list.
		$tumblr_connection = $connection_list[0];
		$this->assertEquals(
			'tumblr',
			$tumblr_connection['name'],
			'Tumblr connection should still be available after filtering out facebook connection.'
		);
	}

	/**
	 * By default, global connections (where user_id == 0)
	 * are hidden for users that do not have the appropriate
	 * capability. This test verifies that the
	 * 'publicize_checkbox_global_default' filter
	 * can be used to cause such a connection to be shown.
	 *
	 * @covers Publicize::get_filtered_connection_data()
	 * @since 6.5.0
	 */
	public function test_filter_publicize_checkbox_global_default() {
		$connection_list     = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$facebook_connection = $connection_list[ self::FACEBOOK_CONNECTION_INDEX ];
		$this->assertTrue(
			$facebook_connection['hidden_checkbox'],
			'Facebook connection checkbox should be hidden by default since test user does not have capability.'
		);

		add_filter( 'publicize_checkbox_global_default', array( $this, 'publicize_connection_filter_no_facebook' ), 10, 4 );

		// Get connection list again now that filter has been added.
		$connection_list     = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$facebook_connection = $connection_list[ self::FACEBOOK_CONNECTION_INDEX ];
		$this->assertFalse(
			$facebook_connection['hidden_checkbox'],
			'Facebook connection checkbox should not be set to hidden since filter set hidden to false.'
		);

	}

	/**
	 *
	 * By default, all connection checkboxes are 'checked'.
	 * This test confirms that the 'publicize_checkbox_default'
	 * can correctly set default value to unchecked.
	 *
	 * @covers Publicize::get_filtered_connection_data()
	 * @since 6.5.0
	 */
	public function test_filter_publicize_checkbox_default() {
		$connection_list     = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$facebook_connection = $connection_list[ self::FACEBOOK_CONNECTION_INDEX ];
		$this->assertTrue(
			$facebook_connection['checked'],
			'Facebook connection should be checked by default with no filtering applied.'
		);

		add_filter( 'publicize_checkbox_default', array( $this, 'publicize_connection_filter_no_facebook' ), 10, 4 );
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );

		$facebook_connection = $connection_list[ self::FACEBOOK_CONNECTION_INDEX ];
		$this->assertFalse(
			$facebook_connection['checked'],
			'Facebook connection should be un-checked by default after filtering applied.'
		);
	}

	/**
	 * Confirms that a connection will be disabled after post is 'done.'
	 *
	 * If a post has already been published (and is this 'done' sharing),
	 * its checkbox should be disabled.
	 *
	 * @covers Publicize::get_filtered_connection_data()
	 * @since 6.5.0
	 */
	public function test_get_filtered_connection_data_disabled_done_all() {
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );
		// First connection should be 'facebook' for unfiltered list.
		$facebook_connection = $connection_list[ self::TUMBLR_CONNECTION_INDEX ];
		$this->assertFalse(
			$facebook_connection['disabled'],
			'Facebook connection should not be disabled if the post is not \'done\'.'
		);

		/**
		 * Publish post so the post will be considered 'done' publicizing
		 * all connections should be disabled.
		 */
		$this->post->post_status = 'publish';
		wp_insert_post( $this->post->to_array() );

		$connection_list     = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$facebook_connection = $connection_list[ self::TUMBLR_CONNECTION_INDEX ];
		$this->assertTrue(
			$facebook_connection['disabled'],
			'Facebook connection should be disabled if the post is \'done\'.'
		);
	}

	/**
	 * Filter callback to uncheck checkbox for 'faceboook' connection.
	 *
	 * Filter callback interface is the same for all filters within
	 * get_filtered_connection_data so this callback can be reused
	 * for all filter test cases.
	 *
	 * @since 6.5.0
	 *
	 * @param bool   $enabled         Should the connection be enabled.
	 * @param int    $post_id         Post ID.
	 * @param string $service_name    Name of social service to share to.
	 * @param array  $connection_data Array of information about all Publicize details for the site.
	 *
	 * @return bool Whether or not the connection is enabled for the filter.
	 */
	public function publicize_connection_filter_no_facebook( $enabled, $post_id, $service_name, $connection_data ) {
		// Block 'facebook' connection and let all others pass through.
		if ( 'facebook' === $service_name ) {
			return false;
		} else {
			return true;
		}
	}
}
