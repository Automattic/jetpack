<?php

class WP_Test_Jetpack_Sync extends WP_UnitTestCase {

	protected $_globals;

	public function setUp() {
		require_once dirname( __FILE__ ) . '/../../class.jetpack-rest-sync.php';
		parent::setUp();
	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_Jetpack_instance() {
		$my_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);

		$post_id = wp_insert_post( $my_post );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::posts );

	}

}