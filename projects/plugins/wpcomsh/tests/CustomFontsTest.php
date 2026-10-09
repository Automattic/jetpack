<?php
/**
 * Custom Fonts render-guard tests.
 *
 * @package wpcomsh
 */

// @phan-file-suppress PhanRedefinedClassReference, PhanUndeclaredMethodInCallable -- Jetpack_Fonts is declared in both the wpcom stubs and vendor/automattic/custom-fonts, and the stub lacks maybe_render_fonts().

/**
 * Class CustomFontsTest.
 */
class CustomFontsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Re-register maybe_render_fonts after each test so the action is clean for the next one.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_fonts_render_without_rules', '__return_true' );
		if ( class_exists( 'Jetpack_Fonts' ) ) {
			$instance = Jetpack_Fonts::get_instance();
			if ( ! has_action( 'wp_enqueue_scripts', array( $instance, 'maybe_render_fonts' ) ) ) {
				add_action( 'wp_enqueue_scripts', array( $instance, 'maybe_render_fonts' ) );
			}
		}
		parent::tear_down();
	}

	/**
	 * The guard must fire before maybe_render_fonts (priority 10).
	 */
	public function test_guard_hook_registered_at_priority_5() {
		$this->assertSame( 5, has_action( 'wp_enqueue_scripts', 'wpcomsh_maybe_skip_custom_fonts' ) );
	}

	/**
	 * When the active theme has no font annotation rules the generated CSS is empty, so
	 * maybe_render_fonts should be removed to prevent a pointless WebFont download.
	 *
	 * This covers the reported bug: fonts chosen under a classic theme keep loading after
	 * switching to a block theme (or any unannotated theme) that has no rules for them.
	 */
	public function test_maybe_render_fonts_removed_when_font_css_is_empty() {
		$instance = Jetpack_Fonts::get_instance();
		$this->assertNotFalse(
			has_action( 'wp_enqueue_scripts', array( $instance, 'maybe_render_fonts' ) ),
			'maybe_render_fonts must be registered before the guard runs'
		);

		wpcomsh_maybe_skip_custom_fonts();

		$this->assertFalse(
			has_action( 'wp_enqueue_scripts', array( $instance, 'maybe_render_fonts' ) ),
			'maybe_render_fonts must be removed when get_font_css() returns empty string'
		);
	}

	/**
	 * Sites that reference a chosen font in Additional CSS can opt in via the filter so the
	 * WebFont loader still runs even when there are no annotation rules.
	 */
	public function test_maybe_render_fonts_kept_when_render_without_rules_filter_is_true() {
		add_filter( 'jetpack_fonts_render_without_rules', '__return_true' );

		$instance = Jetpack_Fonts::get_instance();
		wpcomsh_maybe_skip_custom_fonts();

		$this->assertNotFalse(
			has_action( 'wp_enqueue_scripts', array( $instance, 'maybe_render_fonts' ) ),
			'maybe_render_fonts must be kept when jetpack_fonts_render_without_rules returns true'
		);
	}
}
