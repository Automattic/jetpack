<?php
/**
 * Wpcomsh Test file.
 *
 * @package wpcomsh
 */

/**
 * Class Test_WPCOMSH_RUM_Functions
 */
// phpcs:disable Squiz.Commenting.FunctionComment.WrongStyle
class Test_WPCOMSH_RUM_Functions extends WP_UnitTestCase {
	/**
	 * @var array Original wp_head callbacks
	 */
	private $original_wp_head_callbacks;

	/**
	 * @var array Original wp_footer callbacks
	 */
	private $original_wp_footer_callbacks;

	/**
	 * @var array Original admin_head callbacks
	 */
	private $original_admin_head_callbacks;

	/**
	 * @var array Original admin_footer callbacks
	 */
	private $original_admin_footer_callbacks;

	public function setUp(): void {
		parent::setUp();
		// Save original action callbacks
		$this->original_wp_head_callbacks      = $GLOBALS['wp_filter']['wp_head']->callbacks ?? array();
		$this->original_wp_footer_callbacks    = $GLOBALS['wp_filter']['wp_footer']->callbacks ?? array();
		$this->original_admin_head_callbacks   = $GLOBALS['wp_filter']['admin_head']->callbacks ?? array();
		$this->original_admin_footer_callbacks = $GLOBALS['wp_filter']['admin_footer']->callbacks ?? array();
	}

	public function tearDown(): void {
		// Restore original action callbacks
		if ( isset( $GLOBALS['wp_filter']['wp_head'] ) ) {
			$GLOBALS['wp_filter']['wp_head']->callbacks = $this->original_wp_head_callbacks;
		}
		if ( isset( $GLOBALS['wp_filter']['wp_footer'] ) ) {
			$GLOBALS['wp_filter']['wp_footer']->callbacks = $this->original_wp_footer_callbacks;
		}
		if ( isset( $GLOBALS['wp_filter']['admin_head'] ) ) {
			$GLOBALS['wp_filter']['admin_head']->callbacks = $this->original_admin_head_callbacks;
		}
		if ( isset( $GLOBALS['wp_filter']['admin_footer'] ) ) {
			$GLOBALS['wp_filter']['admin_footer']->callbacks = $this->original_admin_footer_callbacks;
		}
		parent::tearDown();
	}

	/**
	 * Test that the meta tag function is hooked correctly
	 */
	public function test_wpcomsh_head_rum_meta_hooks() {
		// Check if the function is hooked to wp_head and admin_head
		$this->assertEquals(
			10,
			has_action( 'wp_head', 'wpcomsh_head_rum_meta' ),
			'wpcomsh_head_rum_meta is not properly hooked to wp_head'
		);

		$this->assertEquals(
			10,
			has_action( 'admin_head', 'wpcomsh_head_rum_meta' ),
			'wpcomsh_head_rum_meta is not properly hooked to admin_head'
		);
	}

	/**
	 * Test that the script function is hooked correctly
	 */
	public function test_wpcomsh_footer_rum_js_hooks() {
		// Check if the function is hooked to wp_footer and admin_footer
		$this->assertEquals(
			10,
			has_action( 'wp_footer', 'wpcomsh_footer_rum_js' ),
			'wpcomsh_footer_rum_js is not properly hooked to wp_footer'
		);

		$this->assertEquals(
			10,
			has_action( 'admin_footer', 'wpcomsh_footer_rum_js' ),
			'wpcomsh_footer_rum_js is not properly hooked to admin_footer'
		);
	}

	/**
	 * Test the output of wpcomsh_head_rum_meta
	 */
	public function test_wpcomsh_head_rum_meta_output() {
		// Start output buffering
		ob_start();
		wpcomsh_head_rum_meta();
		$output = ob_get_clean();

		// Check if output contains essential elements
		$this->assertStringContainsString( '<meta id="bilmur"', $output );
		$this->assertStringContainsString( 'property="bilmur:data"', $output );
		$this->assertStringContainsString( 'data-provider="wordpress.com"', $output );
		$this->assertStringContainsString( 'data-service="atomic"', $output );
	}

	/**
	 * Test the output of wpcomsh_footer_rum_js
	 */
	public function test_wpcomsh_footer_rum_js_output() {
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		// Start output buffering
		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();

		// Check if output contains essential elements
		$this->assertStringContainsString( '<script defer src="', $output );
		$this->assertStringContainsString( 'bilmur.min.js', $output );
		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedScript
	}
}
