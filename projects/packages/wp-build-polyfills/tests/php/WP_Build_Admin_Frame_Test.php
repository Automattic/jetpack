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
	 * Restore the admin header hooks and drop the enqueued page assets.
	 *
	 * @after
	 */
	#[After]
	public function tear_down() {
		wp_dequeue_script( self::PREREQUISITES_HANDLE );
		wp_deregister_script( self::PREREQUISITES_HANDLE );
		wp_dequeue_style( 'wp-view-transitions-admin' );

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
	 * Return the declarations of the rule whose selector list ends with `$selector`.
	 *
	 * @param string $css      Stylesheet.
	 * @param string $selector Last selector before the rule's opening brace.
	 * @return string
	 */
	private function css_block( $css, $selector ) {
		$this->assertSame( 1, preg_match( '/' . preg_quote( $selector, '/' ) . ' \{([^}]*)\}/', $css, $matches ), "No rule for $selector" );
		return $matches[1];
	}

	/**
	 * Enqueue the script the wp-build page template adds to its own page.
	 */
	private function enqueue_wp_build_page() {
		wp_register_script( self::PREREQUISITES_HANDLE, '', array(), '1.0', true );
		wp_enqueue_script( self::PREREQUISITES_HANDLE );
	}

	/**
	 * Enqueue the stylesheet Core uses to turn on cross-document view transitions in wp-admin.
	 */
	private function enqueue_core_view_transitions() {
		wp_enqueue_style( 'wp-view-transitions-admin' );
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
		$this->assertStringContainsString(
			'background: var(--wp-build-admin-menu-background, #fff);',
			$this->css_block( $css, 'body.js:has([id$="-wp-admin-app"]:empty)' )
		);

		$panel = $this->css_block( $css, 'body.js [id$="-wp-admin-app"]:empty' );
		$this->assertStringContainsString( 'position: absolute;', $panel );
		$this->assertStringContainsString( 'inset-block: 0 8px;', $panel );
		$this->assertStringContainsString( 'inset-inline: 0 8px;', $panel );
		$this->assertStringContainsString( 'border-radius: var(--wpds-border-radius-xl, 12px);', $panel );
		$this->assertStringContainsString( 'background: #fff;', $panel );
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
	 * While leaving for a view transition, every boot surface with an old-only animation is unnamed.
	 */
	public function test_styles_unname_boot_surfaces_while_leaving_the_page() {
		ob_start();
		WP_Build_Admin_Frame::print_styles();
		$css = ob_get_clean();

		$rule = $this->css_block(
			$css,
			'html.wp-build-admin-frame-leaving :is(.boot-layout--single-page, [class*="__layout-single-page"]) :is([class*="__stage"], [class*="__inspector"], [class*="__canvas"], .interface-interface-skeleton__header, .interface-interface-skeleton__sidebar)'
		);
		$this->assertStringContainsString( 'view-transition-name: none !important;', $rule );
	}

	/**
	 * The script marks the root while leaving for a view transition and clears it on reveal.
	 */
	public function test_script_marks_the_root_while_leaving_for_a_view_transition() {
		ob_start();
		WP_Build_Admin_Frame::print_script();
		$js = ob_get_clean();

		$this->assertStringContainsString( "window.addEventListener( 'pageswap'", $js );
		$this->assertStringContainsString( 'event.viewTransition', $js );
		$this->assertStringContainsString( "document.documentElement.classList.add( 'wp-build-admin-frame-leaving' )", $js );
		$this->assertStringContainsString( "window.addEventListener( 'pagereveal'", $js );
		$this->assertStringContainsString( "document.documentElement.classList.remove( 'wp-build-admin-frame-leaving' )", $js );
		$this->assertStringNotContainsString( 'viewTransitionName', $js );
	}

	/**
	 * Registration holds the first render of a wp-build page, once.
	 */
	public function test_registration_holds_the_first_render_on_wp_build_pages() {
		$this->enqueue_wp_build_page();
		$this->enqueue_core_view_transitions();
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
	 * Without Core's view transitions there is nothing to hold for, so first paint is not delayed.
	 */
	public function test_render_hold_is_skipped_without_core_view_transitions() {
		$this->enqueue_wp_build_page();

		ob_start();
		WP_Build_Admin_Frame::print_render_hold();
		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * The hold is a deferred, render-blocking classic script, never a module.
	 */
	public function test_render_hold_is_a_deferred_classic_script() {
		$this->enqueue_wp_build_page();
		$this->enqueue_core_view_transitions();

		ob_start();
		WP_Build_Admin_Frame::print_render_hold();
		$html = ob_get_clean();

		$this->assertStringNotContainsString( 'module', $html );
		$this->assertMatchesRegularExpression( '#<script\b[^>]*\bsrc="data:text/javascript,"#', $html );
		$this->assertMatchesRegularExpression( '#<script\b[^>]*\sdefer[\s>=]#', $html );
		$this->assertStringContainsString( 'blocking="render"', $html );
	}
}
