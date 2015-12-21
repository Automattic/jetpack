<?php
require dirname( __FILE__ ) . '/../../../../modules/infinite-scroll/infinity.php';

class WP_Test_The_Neverending_Home_Page extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		add_theme_support( 'infinite-scroll' );
		remove_action( 'init', 'the_neverending_home_page_init', 20 );
		$this->infinite_scroll = new The_Neverending_Home_Page;
	}

	public function test_body_class() {
		add_filter( 'body_class', array( $this->infinite_scroll, 'body_class' ) );

		$classes = get_body_class();
		$this->assertContains( 'infinite-scroll', $classes );
		$this->assertContains( 'neverending', $classes );

		// Disable Infinite Scroll.
		update_option( The_Neverending_Home_Page::$option_name_enabled, '' );

		$classes = get_body_class();
		$this->assertNotContains( 'infinite-scroll', $classes );
		$this->assertNotContains( 'neverending', $classes );
	}

	public function test_body_class_type_click() {
		The_Neverending_Home_Page::$settings['type'] = 'click';
		add_filter( 'body_class', array( $this->infinite_scroll, 'body_class' ) );

		$classes = get_body_class();
		$this->assertContains( 'infinite-scroll', $classes );
		$this->assertNotContains( 'neverending', $classes );

		// Disable Infinite Scroll.
		update_option( The_Neverending_Home_Page::$option_name_enabled, '' );

		$classes = get_body_class();
		$this->assertContains( 'infinite-scroll', $classes );
		$this->assertNotContains( 'neverending', $classes );
	}
}
