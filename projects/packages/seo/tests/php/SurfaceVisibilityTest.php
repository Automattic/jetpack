<?php
/**
 * Tests for the SEO surface's discoverability cohort and opt-in.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Surface_Visibility
 */
#[CoversClass( Surface_Visibility::class )]
class SurfaceVisibilityTest extends TestCase {

	/**
	 * On self-hosted sites, discoverability is driven by the durable cohort option:
	 * hidden when absent (the non-disruptive default) or empty, visible when set.
	 */
	public function test_is_visible_reads_cohort_option_on_self_hosted() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$this->assertFalse( Surface_Visibility::is_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$this->assertTrue( Surface_Visibility::is_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '' );
		$this->assertFalse( Surface_Visibility::is_visible() );

		delete_option( Initializer::VISIBILITY_OPTION );
	}

	/**
	 * WordPress.com sites (here: Simple, via the IS_WPCOM constant) are always
	 * discoverable, bypassing the cohort option entirely.
	 */
	public function test_is_visible_always_true_on_wpcom() {
		delete_option( Initializer::VISIBILITY_OPTION ); // Hidden for self-hosted...
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		try {
			$this->assertTrue( Surface_Visibility::is_visible() );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * The opt-in is offered only when the feature flag is on AND the surface is still
	 * hidden (a self-hosted install that hasn't opted in).
	 */
	public function test_is_optin_available_requires_flag_and_hidden_surface() {
		delete_option( Initializer::VISIBILITY_OPTION );

		// Flag off → never available.
		$this->assertFalse( Surface_Visibility::is_optin_available() );

		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		try {
			// Flag on + surface hidden → available.
			$this->assertTrue( Surface_Visibility::is_optin_available() );

			// Flag on + surface visible (already opted in) → not available.
			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$this->assertFalse( Surface_Visibility::is_optin_available() );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}

	/**
	 * The script-data injector surfaces opt-in availability under the `seo.optin_available`
	 * key (read by the legacy Traffic-page banner), and tolerates non-array input.
	 */
	public function test_inject_optin_availability_surfaces_flag_state() {
		delete_option( Initializer::VISIBILITY_OPTION );

		// Flag off → false, and non-array input is normalized to an array. Surface is also
		// hidden (no cohort option set on this self-hosted test site).
		$data = Surface_Visibility::inject_optin_availability( null );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );

		// Flag on + surface hidden → opt-in offered, surface not yet visible; existing keys preserved.
		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		try {
			$data = Surface_Visibility::inject_optin_availability( array( 'keep' => 1 ) );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertSame( 1, $data['keep'] );

			// Opted in → surface visible, opt-in no longer offered.
			update_option( Initializer::VISIBILITY_OPTION, '1' );
			$data = Surface_Visibility::inject_optin_availability( array() );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		} finally {
			remove_filter( Initializer::FEATURE_FILTER, '__return_true' );
			delete_option( Initializer::VISIBILITY_OPTION );
		}
	}
}
