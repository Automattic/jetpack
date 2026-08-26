<?php
namespace Automattic\Jetpack\WP_Build_Polyfills\Tests;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Admin_Frame;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use WorDBless\BaseTestCase;

/**
 * Tests for the WP_Build_Admin_Frame class.
 */
class WP_Build_Admin_Frame_Test extends BaseTestCase {

	/**
	 * Hooks the class prints on.
	 */
	const HOOKS = array( 'admin_head', 'in_admin_header' );

	/**
	 * Callbacks attached to HOOKS before the test, restored afterwards.
	 *
	 * @var array<string, \WP_Hook|null>
	 */
	private $original_hooks = array();

	/**
	 * Start every test with empty admin header hooks.
	 *
	 * @before
	 */
	#[Before]
	public function set_up() {
		parent::set_up();

		global $wp_filter;
		foreach ( self::HOOKS as $hook ) {
			$this->original_hooks[ $hook ] = isset( $wp_filter[ $hook ] ) ? clone $wp_filter[ $hook ] : null;
			remove_all_actions( $hook );
		}
	}

	/**
	 * Restore the admin header hooks.
	 *
	 * @after
	 */
	#[After]
	public function tear_down() {
		global $wp_filter;
		foreach ( self::HOOKS as $hook ) {
			if ( null === $this->original_hooks[ $hook ] ) {
				unset( $wp_filter[ $hook ] );
			} else {
				$wp_filter[ $hook ] = $this->original_hooks[ $hook ];
			}
		}

		parent::tear_down();
	}

	/**
	 * Run the admin header hooks the way admin-header.php does and capture the output.
	 *
	 * @return string
	 */
	private function render_admin_header() {
		ob_start();
		do_action( 'admin_head' );
		do_action( 'in_admin_header' );
		return ob_get_clean();
	}

	/**
	 * Nothing is printed on requests where no consumer registered.
	 */
	public function test_prints_nothing_without_a_registration() {
		$this->assertSame( '', $this->render_admin_header() );
	}

	/**
	 * Both blocks are printed exactly once, however many times register() ran.
	 */
	public function test_prints_both_blocks_once_after_registration() {
		WP_Build_Admin_Frame::register();
		WP_Build_Admin_Frame::register();

		$output = $this->render_admin_header();

		$this->assertSame( 1, substr_count( $output, '<style id="wp-build-admin-frame-css">' ) );
		$this->assertSame( 1, substr_count( $output, '</style>' ) );
		$this->assertSame( 1, substr_count( $output, 'id="wp-build-admin-frame-js"' ) );
		$this->assertSame( 1, substr_count( $output, '</script>' ) );
		$this->assertLessThan( strpos( $output, '<script' ), strpos( $output, '<style' ) );
	}

	/**
	 * The stylesheet targets the boot single-page layout, in its global-class and
	 * CSS Modules forms, and the body behind it.
	 */
	public function test_styles_override_the_boot_layout_with_the_menu_color() {
		ob_start();
		WP_Build_Admin_Frame::print_styles();
		$css = ob_get_clean();

		$this->assertStringContainsString( '#wpcontent .boot-layout--single-page,', $css );
		$this->assertStringContainsString( '#wpcontent [class*="__layout-single-page"] {', $css );
		$this->assertStringContainsString(
			'background: var(--wp-build-admin-menu-background, var(--wpds-color-background-surface-neutral-weak));',
			$css
		);
		$this->assertStringContainsString( 'body:has(.boot-layout--single-page),', $css );
		$this->assertStringContainsString( 'body:has([class*="__layout-single-page"]) {', $css );
		$this->assertStringContainsString( 'background: var(--wp-build-admin-menu-background, #fff);', $css );
	}

	/**
	 * The script samples #adminmenuback into the custom property on the root element.
	 */
	public function test_script_samples_the_admin_menu_into_the_custom_property() {
		ob_start();
		WP_Build_Admin_Frame::print_script();
		$js = ob_get_clean();

		$this->assertStringStartsWith( '<script', ltrim( $js ) );
		$this->assertStringContainsString( "document.getElementById( 'adminmenuback' )", $js );
		$this->assertStringContainsString( 'getComputedStyle( menu ).backgroundColor', $js );
		$this->assertStringContainsString( "'rgba(0, 0, 0, 0)' === color", $js );
		$this->assertStringContainsString(
			"document.documentElement.style.setProperty( '--wp-build-admin-menu-background', color )",
			$js
		);
		$this->assertStringNotContainsString( 'jQuery', $js );
	}
}
