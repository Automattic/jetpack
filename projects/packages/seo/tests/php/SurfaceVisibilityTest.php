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

	public function test_is_optin_available_only_when_surface_hidden() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$this->assertTrue( Surface_Visibility::is_optin_available() );
		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$this->assertFalse( Surface_Visibility::is_optin_available() );
		delete_option( Initializer::VISIBILITY_OPTION );
	}

	public function test_inject_optin_availability_preserves_other_script_data() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$data = Surface_Visibility::inject_optin_availability( null );
		$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$data = Surface_Visibility::inject_optin_availability( array( 'keep' => 1 ) );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
		$this->assertSame( 1, $data['keep'] );
		delete_option( Initializer::VISIBILITY_OPTION );
	}
}
