<?php
require __DIR__ . '/../../../../modules/publicize.php';

/**
 * @group publicize
 * @covers Publicize
 */
class WP_Test_Publicize extends WP_UnitTestCase {

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

		Jetpack_Options::update_options(
			array(
				'publicize_connections' => array(
					// Normally connected facebook.
					'facebook' => array(
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
					// Globally connected tumblr.
					'tumblr'   => array(
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
				),
			)
		);

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
		$this->publicize = $this->getMockBuilder( 'Automattic\Jetpack\Publicize\Publicize' )->setMethods( array( 'test_connection' ) )->getMock();

		$this->publicize->method( 'test_connection' )
			->withAnyParameters()
			->willReturn( true );

		$publicize = $this->publicize;
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

	public function test_publicize_get_all_connections_for_user() {
		$facebook_connection = array(
			'id_number' => array(
				'connection_data' => array(
					'user_id' => 0,
				),
			),
		);
		$twitter_connection  = array(
			'id_number_2' => array(
				'connection_data' => array(
					'user_id' => 1,
				),
			),
		);
		Jetpack_Options::update_options(
			array(
				'publicize_connections' => array(
					'facebook' => $facebook_connection,
					'twitter'  => $twitter_connection,
				),
			)
		);

		$publicize = publicize_init();

		// When logged out, assert that blog-level connections are returned.
		wp_set_current_user( 0 );
		$this->assertSame( array( 'facebook' => $facebook_connection ), $publicize->get_all_connections_for_user() );

		// When logged in, assert that blog-level connections AND any connections for the current user are returned.
		wp_set_current_user( 1 );
		$this->assertSame(
			array(
				'facebook' => $facebook_connection,
				'twitter'  => $twitter_connection,
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
	 * Verifies that get_services_connected returns all test
	 * connections that are valid for the current user.
	 *
	 * @since 6.7.0
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
	 * @since 6.7.0
	 */
	public function test_get_filtered_connection_data_no_filters() {
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$connection_data = $connection_list[0];
		$this->assertEquals(
			'facebook',
			$connection_data['service_name'],
			'First test connection name should be \'facebook\''
		);
		$this->assertEquals(
			'test-unique-id456',
			$connection_data['unique_id']
		);
		$this->assertEquals(
			'Facebook',
			$connection_data['service_label']
		);
		$this->assertEquals(
			'test-display-name456',
			$connection_data['display_name']
		);
		$this->assertTrue(
			$connection_data['enabled'],
			'The connection has not been shared to and there are no filters so connection should be \'enabled\' by default.'
		);
		$this->assertFalse(
			$connection_data['done'],
			'Connection should not be done since it has not been publicized to yet.'
		);
		$this->assertTrue(
			$connection_data['toggleable'],
			'Connection should be toggleable.'
		);
		$this->assertFalse(
			$connection_data['global'],
			'Connection should not be global.'
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
	 * Verify case where no post id is provided and there is
	 * no current post. Connections data should be passed
	 * through without disabling connections.
	 *
	 * @since 6.7.0
	 */
	public function test_get_filtered_connection_data_null_post() {
		/**
		 * Simulate null post by not providing post_id argument and
		 * when current $post value is unset.
		 */
		$connection_list = $this->publicize->get_filtered_connection_data();
		$connection_data = $connection_list[0];
		$this->assertTrue(
			$connection_data['enabled'],
			'All connections should be enabled for null post id'
		);
		$this->assertFalse(
			$connection_data['done'],
			'Connection should not yet be done for null post id'
		);
	}

	/**
	 * Verify 'wpas_submit_post?' filter functionality by checking
	 * connection list before and after a 'no facebook' filter has
	 * been applied.
	 *
	 * @since 6.7.0
	 */
	public function test_filter_wpas_submit_post() {
		$connection_list  = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$first_connection = $connection_list[0];
		$this->assertEquals(
			'facebook',
			$first_connection['service_name'],
			'Facebook (Normal) connection should be available prior to filtering'
		);

		add_filter( 'wpas_submit_post?', array( $this, 'publicize_connection_filter_no_normal' ), 10, 4 );
		// Get connection list again now that filter has been added.
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );

		$this->assertCount(
			1,
			$connection_list,
			'Connection list should be 1 long after \'facebook\' (Normal) connection removed.'
		);
		$first_connection = $connection_list[0];
		$this->assertEquals(
			'tumblr',
			$first_connection['service_name'],
			'Tumblr (Global) connection should still be available after filtering out the Normal connection.'
		);
	}

	/**
	 * By default, global connections (where user_id == 0) are checked
	 * (though untoggleable) for users that do not have the
	 * appropriate capability. This test verifies that the
	 * 'publicize_checkbox_global_default' filter can be used to
	 * uncheck such a global connection.
	 *
	 * @since 6.7.0
	 */
	public function test_filter_publicize_checkbox_global_default_for_global_connection() {
		$connection_list   = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$global_connection = $connection_list[ self::GLOBAL_CONNECTION_INDEX ];
		$this->assertTrue(
			$global_connection['global'],
			'Global connection checkbox should be global.'
		);
		$this->assertTrue(
			$global_connection['enabled'],
			'Global connection checkbox should be checked.'
		);
		$this->assertFalse(
			$global_connection['toggleable'],
			'Global connection checkbox should be disabled by default since test user does not have permission to uncheck.'
		);

		add_filter( 'publicize_checkbox_global_default', array( $this, 'publicize_connection_filter_no_global' ), 10, 4 );

		// Get connection list again now that filter has been added.
		$connection_list   = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$global_connection = $connection_list[ self::GLOBAL_CONNECTION_INDEX ];
		$this->assertTrue(
			$global_connection['global'],
			'Global connection checkbox should be global even after filtering to uncheck.'
		);
		$this->assertFalse(
			$global_connection['enabled'],
			'Global connection checkbox should be unchecked after filter to uncheck.'
		);
		$this->assertFalse(
			$global_connection['toggleable'],
			'Global connection checkbox should still be disabled after filter to uncheck.'
		);
	}

	/**
	 * This test verifies that the 'publicize_checkbox_global_default'
	 * filter has no effect on a normal connection.
	 *
	 * @since 6.7.0
	 */
	public function test_filter_publicize_checkbox_global_default_for_normal_connection() {
		$connection_list   = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$normal_connection = $connection_list[ self::NORMAL_CONNECTION_INDEX ];
		$this->assertFalse(
			$normal_connection['global'],
			'Normal connection checkbox should not be global.'
		);
		$this->assertTrue(
			$normal_connection['enabled'],
			'Normal connection checkbox should be checked.'
		);
		$this->assertTrue(
			$normal_connection['toggleable'],
			'Normal connection checkbox should not be disabled.'
		);

		$before = json_encode( $normal_connection );

		add_filter( 'publicize_checkbox_global_default', array( $this, 'publicize_connection_filter_no_normal' ), 10, 4 );

		// Get connection list again now that filter has been added.
		$connection_list   = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$normal_connection = $connection_list[ self::NORMAL_CONNECTION_INDEX ];

		$this->assertSame( $before, json_encode( $normal_connection ), 'Normal connection should be unaffected by filter to uncheck global connection' );
	}

	/**
	 * By default, all connection checkboxes are 'checked'.
	 * This test confirms that the 'publicize_checkbox_default'
	 * can correctly set a normal connection unchecked.
	 *
	 * @since 6.7.0
	 */
	public function test_filter_publicize_checkbox_default_for_normal_connection() {
		$connection_list   = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$normal_connection = $connection_list[ self::NORMAL_CONNECTION_INDEX ];
		$this->assertTrue(
			$normal_connection['enabled'],
			'Normal connection should be enabled by default with no filtering applied.'
		);

		add_filter( 'publicize_checkbox_default', array( $this, 'publicize_connection_filter_no_normal' ), 10, 4 );
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );

		$normal_connection = $connection_list[ self::NORMAL_CONNECTION_INDEX ];
		$this->assertFalse(
			$normal_connection['enabled'],
			'Normal connection should be un-enabled by default after filtering applied.'
		);
	}

	/**
	 * By default, all connection checkboxes are 'checked'.
	 * This test confirms that the 'publicize_checkbox_default'
	 * can be used to set a global connection to unchecked.
	 *
	 * @since 6.7.0
	 */
	public function test_filter_publicize_checkbox_default_for_global_connection() {
		$connection_list   = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$global_connection = $connection_list[ self::GLOBAL_CONNECTION_INDEX ];
		$this->assertTrue(
			$global_connection['enabled'],
			'Global connection should be enabled by default with no filtering applied.'
		);

		add_filter( 'publicize_checkbox_default', array( $this, 'publicize_connection_filter_no_global' ), 10, 4 );
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );

		$global_connection = $connection_list[ self::GLOBAL_CONNECTION_INDEX ];
		$this->assertFalse(
			$global_connection['enabled'],
			'Global connection should be un-enabled by after filtering applied.'
		);
	}

	/**
	 * Confirms that a connection will be disabled after post is 'done.'
	 *
	 * If a post has already been published, its checkbox should be
	 * disabled.
	 *
	 * @since 6.7.0
	 */
	public function test_get_filtered_connection_data_disabled_after_publish() {
		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$connection_data = $connection_list[0];
		$this->assertTrue(
			$connection_data['enabled'],
			'Connection should be enabled before publishing.'
		);
		$this->assertFalse(
			$connection_data['done'],
			'Connection should not be done before publishing.'
		);
		$this->assertTrue(
			$connection_data['toggleable'],
			'Connection should be toggleable if the post is not \'done\'.'
		);

		/**
		 * Publish post so the post will be considered 'done' publicizing
		 * all connections should be disabled.
		 */
		$this->post->post_status = 'publish';
		wp_insert_post( $this->post->to_array() );

		$connection_list = $this->publicize->get_filtered_connection_data( $this->post->ID );
		$connection_data = $connection_list[0];
		$this->assertFalse(
			$connection_data['enabled'],
			'Connection should not be enabled after publishing.'
		);
		$this->assertFalse(
			$connection_data['done'],
			'Individual connection should not be flagged as done if it did not get publicized.'
		);
		$this->assertFalse(
			$connection_data['toggleable'],
			'Connection should not be toggleable if the post is \'done\'.'
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
	/**
	 * Filter callback to uncheck checkbox for 'facebook' connection.
	 *
	 * Filter callback interface is the same for all filters within
	 * get_filtered_connection_data so this callback can be reused
	 * for all filter test cases.
	 *
	 * @since 6.7.0
	 *
	 * @param bool   $enabled      Should the connection be enabled.
	 * @param int    $post_id      Post ID.
	 * @param string $service_name Name of social service to share to.
	 * @param array  $connection   Array of information about all Publicize details for the site.
	 *
	 * @return bool Whether or not the connection is enabled for the filter.
	 */
	public function publicize_connection_filter_no_normal( $enabled, $post_id, $service_name, $connection ) {
		// This is silly - make this function work in both 'wpas_submit_post?' (fourth parameter $connection_data)
		// and 'publicize_checkbox_default' (fourt parameter $connection) filters.
		$connection_data = isset( $connection['connection_data'] ) ? $connection['connection_data'] : $connection;
		if ( $connection_data['user_id'] ) {
			return false;
		} else {
			return $enabled;
		}
	}

	/**
	 * Filter callback to uncheck checkbox for 'tumblr' connection.
	 *
	 * Filter callback interface is the same for all filters within
	 * get_filtered_connection_data so this callback can be reused
	 * for all filter test cases.
	 *
	 * @since 6.7.0
	 *
	 * @param bool   $enabled      Should the connection be enabled.
	 * @param int    $post_id      Post ID.
	 * @param string $service_name Name of social service to share to.
	 * @param array  $connection   Array of information about all Publicize details for the site.
	 *
	 * @return bool Whether or not the connection is enabled for the filter.
	 */
	public function publicize_connection_filter_no_global( $enabled, $post_id, $service_name, $connection ) {
		// This is silly - make this function work in both 'wpas_submit_post?' (fourth parameter $connection_data)
		// and 'publicize_checkbox_default' (fourt parameter $connection) filters.
		$connection_data = isset( $connection['connection_data'] ) ? $connection['connection_data'] : $connection;
		if ( ! $connection_data['user_id'] ) {
			return false;
		} else {
			return $enabled;
		}
	}
}
