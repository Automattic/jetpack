<?php

use Jetpack\Assets\Assets_Manager;
use PHPUnit\Framework\TestCase;

class Test_Assets_Manager extends TestCase {

	function test_render_default_logo() {
		$assets_manager = new Assets_Manager( array( 'images' => dirname( __FILE__ ) ) );
		$url = $assets_manager->get_image_url('filename.jpg' );
		$this->assertContains( str_replace( WP_CONTENT_DIR, '', dirname( __FILE__ ) ) . '/filename.jpg', $url );
	}
}
