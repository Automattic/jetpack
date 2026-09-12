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
	 * Script the wp-build page template enqueues on its own page only.
	 */
	const PREREQUISITES_HANDLE = 'example-dashboard-wp-admin-prerequisites';

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
	 * Restore the admin header hooks and drop the wp-build page script.
	 *
	 * @after
	 */
	#[After]
	public function tear_down() {
		wp_dequeue_script( self::PREREQUISITES_HANDLE );
		wp_deregister_script( self::PREREQUISITES_HANDLE );

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
	 * Enqueue the script the wp-build page template adds to its own page.
	 */
	private function enqueue_wp_build_page() {
		wp_register_script( self::PREREQUISITES_HANDLE, '', array(), '1.0', true );
		wp_enqueue_script( self::PREREQUISITES_HANDLE );
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
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second call must be a no-op.
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
	 * The stylesheet caps the wp-admin body box to the viewport on desktop, so a
	 * tall admin menu cannot stretch the boot layout past it.
	 */
	public function test_styles_cap_the_admin_body_to_the_viewport() {
		ob_start();
		WP_Build_Admin_Frame::print_styles();
		$css = ob_get_clean();

		$this->assertStringContainsString( '@media (min-width: 783px) {', $css );
		$this->assertStringContainsString( 'body:has(.boot-layout--single-page) #wpbody,', $css );
		$this->assertStringContainsString( 'body:has([class*="__layout-single-page"]) #wpbody {', $css );
		$this->assertStringContainsString( 'position: sticky;', $css );
		$this->assertStringContainsString( 'top: var(--wp-admin--admin-bar--height, 32px);', $css );
		$this->assertStringContainsString(
			'height: calc(100vh - var(--wp-admin--admin-bar--height, 32px));',
			$css
		);
	}

	/**
	 * Before boot mounts, the stylesheet paints its frame on the empty app container.
	 */
	public function test_styles_paint_the_frame_before_boot_mounts() {
		ob_start();
		WP_Build_Admin_Frame::print_styles();
		$css = ob_get_clean();

		$this->assertStringContainsString( 'body.js:has([id$="-wp-admin-app"]:empty) #wpbody,', $css );
		$this->assertStringContainsString( 'body.js:has([id$="-wp-admin-app"]:empty) {', $css );
		$this->assertStringContainsString( 'body.js [id$="-wp-admin-app"]:empty {', $css );
		$this->assertStringContainsString( 'position: absolute;', $css );
		$this->assertStringContainsString( 'inset-block: 0 8px;', $css );
		$this->assertStringContainsString( 'inset-inline: 0 8px;', $css );
		$this->assertStringContainsString( 'border-radius: var(--wpds-border-radius-xl, 12px);', $css );
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

	/**
	 * The script takes boot's stage out of cross-document transitions and gives it back on reveal.
	 */
	public function test_script_unnames_the_stage_for_cross_document_transitions() {
		ob_start();
		WP_Build_Admin_Frame::print_script();
		$js = ob_get_clean();

		$this->assertStringContainsString( "window.addEventListener( 'pageswap'", $js );
		$this->assertStringContainsString( 'event.viewTransition', $js );
		$this->assertStringContainsString( '.boot-layout__stage', $js );
		$this->assertStringContainsString( '[class*="__layout-single-page"] [class*="__stage"]', $js );
		$this->assertStringContainsString( "style.viewTransitionName = 'none'", $js );
		$this->assertStringContainsString( "window.addEventListener( 'pagereveal'", $js );
	}

	/**
	 * Registration holds the first render of a wp-build page, once.
	 */
	public function test_registration_holds_the_first_render_on_wp_build_pages() {
		$this->enqueue_wp_build_page();
		WP_Build_Admin_Frame::register();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second call must be a no-op.
		WP_Build_Admin_Frame::register();

		$this->assertSame( 1, substr_count( $this->render_admin_header(), 'blocking="render"' ) );
	}

	/**
	 * Admin pages that are not wp-build pages keep rendering as soon as they can.
	 */
	public function test_render_hold_is_skipped_outside_wp_build_pages() {
		ob_start();
		WP_Build_Admin_Frame::print_render_hold();
		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * The hold is a render-blocking module with a body: an empty inline script is never prepared.
	 */
	public function test_render_hold_is_a_non_empty_render_blocking_module() {
		$this->enqueue_wp_build_page();

		ob_start();
		WP_Build_Admin_Frame::print_render_hold();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'type="module"', $html );
		$this->assertStringContainsString( 'blocking="render"', $html );
		$this->assertMatchesRegularExpression( '#<script[^>]*>\s*\S[^<]*</script>#', $html );
	}
}
