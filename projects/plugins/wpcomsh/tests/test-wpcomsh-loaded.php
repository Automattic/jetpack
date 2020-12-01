<?php

class WpcomshLoadedTest extends WP_UnitTestCase {
	public function test_loaded() {
		$this->assertTrue( defined( 'WPCOMSH_VERSION' ) );
	}
}
