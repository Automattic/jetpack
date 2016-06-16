<?php
require dirname( __FILE__ ) . '/../../../../modules/publicize.php';

class WP_Test_Publicize extends WP_UnitTestCase {

	private $fired_publicized_post = false;
	private $publicized_post_id = null;
	private $post;

	public function setUp() {
		parent::setUp();

		$this->publicize = publicize_init();
		$this->fired_publicized_post = false;
		$this->publicized_post_id = null;

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		add_action( 'jetpack_publicize_post', array( $this, 'publicized_post' ), 10, 1 );
	}

	public function test_fires_jetpack_publicize_post_on_save_as_published() {
		$this->post->post_status = 'publish';

		wp_insert_post( $this->post->to_array() );

		$this->assertPublicized( true, $this->post );
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

	function assertPublicized( $should_have_publicized, $post ) {
		if ( $should_have_publicized ) {
			$this->assertTrue( $this->fired_publicized_post );
			$this->assertEquals( $post->ID, $this->publicized_post_id );	
		} else {
			$this->assertFalse( $this->fired_publicized_post );
			$this->assertNull( $this->publicized_post_id );
		}
		
	}

	function publicized_post( $post_id ) {
		$this->fired_publicized_post = true;
		$this->publicized_post_id = $post_id;
	}

	function prevent_publicize_post( $should_publicize, $post ) {
		return false;
	}
}
