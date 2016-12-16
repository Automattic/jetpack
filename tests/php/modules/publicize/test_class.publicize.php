<?php
require dirname( __FILE__ ) . '/../../../../modules/publicize.php';

class WP_Test_Publicize extends WP_UnitTestCase {

	private $fired_publicized_post = false;
	private $in_publish_filter = false;
	private $publicized_post_id = null;
	private $post;

	public function setUp() {
		parent::setUp();

		$this->publicize = publicize_init();
		$this->fired_publicized_post = false;
		$this->publicized_post_id = null;

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		Jetpack_Options::update_options( array( 'publicize_connections' => array( 'facebook' => array( 'id_number' => array( 'connection_data' => array( 'user_id' => 0 ) ) ) ) ) );

		add_action( 'jetpack_publicize_post', array( $this, 'publicized_post' ), 10, 1 );
		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags_check' ), 20, 2 );
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
	}

	function assertPublicized( $should_have_publicized, $post ) {
		if ( $should_have_publicized ) {
			$this->assertTrue( $this->fired_publicized_post, 'Not Fired on publicize post' );
			$this->assertEquals( $post->ID, $this->publicized_post_id, 'Is not the same post ID' );
			$this->assertTrue( $this->in_publish_filter, 'Not in filter' );
		} else {
			$this->assertFalse( $this->fired_publicized_post, 'Fired publicize post' );
			$this->assertNull( $this->publicized_post_id, 'Not Null' );
			$this->assertFalse( $this->in_publish_filter, 'in filter' );
		}
	}

	function set_post_flags_check( $flags, $post ) {
		$this->in_publish_filter = $flags['publicize_post'];
		return $flags;
	}

	function publicized_post( $post_id ) {
		$this->fired_publicized_post = true;
		$this->publicized_post_id = $post_id;
	}

	function prevent_publicize_post( $should_publicize, $post ) {
		return false;
	}
}
