<?php
require dirname( __FILE__ ) . '/../../../../modules/publicize.php';

class WP_Test_Publicize extends WP_UnitTestCase {

	private $fired_publicized_post = false;
	private $publicized_post = null;

	public function setUp() {
		parent::setUp();

		$this->publicize = publicize_init();
		$this->fired_publicized_post = false;
		$this->publicized_post = null;
	}

	public function test_fires_jetpack_publicize_post_on_save_as_published() {
		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$post = get_post( $post_id );

		add_action( 'jetpack_publicize_post', array( $this, 'publicized_post' ), 10, 1 );

		$post->post_status = 'publish';

		wp_insert_post( $post->to_array() );

		$this->assertTrue( $this->fired_publicized_post );
		$this->assertEquals( $post->ID, $this->publicized_post->ID );
	}

	public function test_does_not_fire_jetpack_publicize_post_on_other_status_transitions() {
		$post_id = $this->factory->post->create( array( 'post_status' => 'publish' ) );
		$post = get_post( $post_id );
		
		add_action( 'jetpack_publicize_post', array( $this, 'publicized_post' ), 10, 1 );

		$post->post_status = 'draft';

		wp_insert_post( $post->to_array() );

		$this->assertFalse( $this->fired_publicized_post );
		$this->assertNull( $this->publicized_post );
	}

	function publicized_post( $post ) {
		$this->fired_publicized_post = true;
		$this->publicized_post = $post;
	}
}
