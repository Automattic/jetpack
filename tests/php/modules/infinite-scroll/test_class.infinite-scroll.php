<?php
require dirname( __FILE__ ) . '/../../../../modules/infinite-scroll/infinity.php';

class WP_Test_The_Neverending_Home_Page extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->infinite_scroll = new The_Neverending_Home_Page;
	}

	public function test_body_class() {
		$classes = $this->infinite_scroll->body_class();
		$this->assertContains( 'infinite-scroll', $classes );
		$this->assertContains( 'neverending', $classes );
	}
}
