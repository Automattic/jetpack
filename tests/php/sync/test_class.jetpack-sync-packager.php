<?php


class WP_Test_Jetpack_Sync_Packager extends WP_Test_Jetpack_Sync_Base {

	protected $post;
	protected $test_already = false;

	public function setUp() {
		parent::setUp();

		$user_id = $this->factory->user->create();

		// create a post
		$post_id    = $this->factory->post->create( array( 'post_author' => $user_id ) );
		$this->post = get_post( $post_id );

		$this->sender->do_sync();
	}

	public function test_roquito() {
		print_r( $this->packager );
	}
}
