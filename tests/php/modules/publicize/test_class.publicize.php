<?php
require dirname( __FILE__ ) . '/../../../../modules/publicize.php';

class WP_Test_Publicize extends WP_UnitTestCase {


	private $in_publish_filter = false;
	private $publicized_post_id = null;
	private $post;
	private $original_user = 0;

	public function setUp() {
		parent::setUp();

		$this->publicize = publicize_init();
		$this->publicized_post_id = null;

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		Jetpack_Options::update_options( array( 'publicize_connections' => array( 'facebook' => array( 'id_number' => array( 'connection_data' => array( 'user_id' => 0 ) ) ) ) ) );

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
}
