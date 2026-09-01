<?php
/**
 * Tests for the Reader_Link class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Reader_Link;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Admin_Bar;

/**
 * Test class for Reader_Link.
 *
 * @covers \Automattic\Jetpack\Newsletter\Reader_Link
 */
#[CoversClass( Reader_Link::class )]
class Reader_Link_Test extends BaseTestCase {
	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Reset the static initialized flag between tests.
		$reflection = new \ReflectionClass( Reader_Link::class );
		$property   = $reflection->getProperty( 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );

		// Clear any existing hooks.
		remove_all_actions( 'admin_bar_menu' );
		remove_all_actions( 'wp_enqueue_scripts' );
		remove_all_actions( 'admin_enqueue_scripts' );

		// Mirror production conditions required by Reader_Link::init().
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_reader_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'newsletter-reader-admin-' . wp_rand() . '@example.com',
				'role'       => 'administrator',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			$this->fail( $user_id->get_error_message() );
		}
		wp_set_current_user( $user_id );
		show_admin_bar( true );
		add_filter( 'show_admin_bar', '__return_true' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_filter( 'show_admin_bar', '__return_true' );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Helper to get the Reader_Link instance from the registered hooks.
	 *
	 * @return Reader_Link|null
	 */
	private function get_reader_link_instance() {
		global $wp_filter;

		if ( isset( $wp_filter['admin_bar_menu'] ) ) {
			foreach ( $wp_filter['admin_bar_menu']->callbacks as $callbacks ) {
				foreach ( $callbacks as $callback ) {
					if ( is_array( $callback['function'] ) && $callback['function'][0] instanceof Reader_Link ) {
						return $callback['function'][0];
					}
				}
			}
		}

		return null;
	}

	/**
	 * Test that init() registers the expected hooks.
	 */
	public function test_init_registers_hooks() {
		Reader_Link::init();

		$this->assertSame( 11, has_action( 'admin_bar_menu', array( $this->get_reader_link_instance(), 'add_reader_menu' ) ) );
		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( $this->get_reader_link_instance(), 'enqueue_stylesheet' ) ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( $this->get_reader_link_instance(), 'enqueue_stylesheet' ) ) );
	}

	/**
	 * Test that init() only initializes once (singleton pattern).
	 */
	public function test_init_only_runs_once() {
		Reader_Link::init();
		$first_instance = $this->get_reader_link_instance();

		// Call init again.
		Reader_Link::init();
		$second_instance = $this->get_reader_link_instance();

		// Should be the same instance (init didn't run twice).
		$this->assertInstanceOf( Reader_Link::class, $first_instance );
		$this->assertSame( $first_instance, $second_instance );
		$this->assertSame(
			11,
			has_action( 'admin_bar_menu', array( $first_instance, 'add_reader_menu' ) ),
			'Hook should only be registered once'
		);
	}

	/**
	 * Test that add_reader_menu adds the Reader menu item to the admin bar.
	 */
	public function test_add_reader_menu_adds_menu_item() {
		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		wp_set_current_user( 0 );

		$wp_admin_bar = new WP_Admin_Bar();
		$wp_admin_bar->initialize();

		$reader_link = new Reader_Link();
		$reader_link->add_reader_menu( $wp_admin_bar );

		$node = $wp_admin_bar->get_node( 'reader' );

		$this->assertNotNull( $node, 'Reader menu node should exist' );
		$this->assertSame( 'reader', $node->id );
		$this->assertSame( 'https://wordpress.com/reader', $node->href );
		$this->assertSame( 'top-secondary', $node->parent );
		$this->assertStringContainsString( 'wp-admin-bar-reader', $node->meta['class'] );
	}

	/**
	 * Test that add_reader_menu includes the correct title structure.
	 */
	public function test_add_reader_menu_title_structure() {
		require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
		wp_set_current_user( 0 );

		$wp_admin_bar = new WP_Admin_Bar();
		$wp_admin_bar->initialize();

		$reader_link = new Reader_Link();
		$reader_link->add_reader_menu( $wp_admin_bar );

		$node = $wp_admin_bar->get_node( 'reader' );

		$this->assertStringContainsString( 'ab-icon', $node->title );
		$this->assertStringContainsString( 'ab-label', $node->title );
		$this->assertStringContainsString( 'Reader', $node->title );
	}

	/**
	 * Test that enqueue_stylesheet does nothing when CSS file doesn't exist.
	 */
	public function test_enqueue_stylesheet_does_nothing_when_css_missing() {
		$build_dir  = dirname( __DIR__, 2 ) . '/build';
		$css_file   = $build_dir . '/reader-link.css';
		$temp_file  = $build_dir . '/reader-link.css.bak';
		$moved_file = false;

		// Temporarily move the CSS file if it exists.
		if ( file_exists( $css_file ) ) {
			rename( $css_file, $temp_file );
			$moved_file = true;
		}

		try {
			$reader_link = new Reader_Link();
			$reader_link->enqueue_stylesheet();

			$this->assertFalse( wp_style_is( 'jetpack-newsletter-reader-link', 'enqueued' ) );
		} finally {
			// Restore the CSS file if we moved it.
			if ( $moved_file && file_exists( $temp_file ) ) {
				rename( $temp_file, $css_file );
			}
		}
	}

	/**
	 * Test that enqueue_stylesheet enqueues the style when CSS file exists.
	 */
	public function test_enqueue_stylesheet_enqueues_when_css_exists() {
		$build_dir = dirname( __DIR__, 2 ) . '/build';
		$css_file  = $build_dir . '/reader-link.css';

		// Skip if build directory doesn't exist and we can't create it.
		if ( ! is_dir( $build_dir ) && ! mkdir( $build_dir, 0755, true ) ) {
			$this->markTestSkipped( 'Could not create build directory.' );
		}

		// Create a temporary CSS file if it doesn't exist.
		$created_file = ! file_exists( $css_file );
		if ( $created_file ) {
			file_put_contents( $css_file, '/* test */' );
		}

		try {
			$reader_link = new Reader_Link();
			$reader_link->enqueue_stylesheet();

			$this->assertTrue( wp_style_is( 'jetpack-newsletter-reader-link', 'enqueued' ) );
		} finally {
			// Clean up: remove the temporary file if we created it.
			if ( $created_file && file_exists( $css_file ) ) {
				unlink( $css_file );
			}
		}
	}
}
