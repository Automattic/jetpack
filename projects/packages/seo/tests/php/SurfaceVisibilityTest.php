<?php
/**
 * Tests for SEO dashboard visibility and legacy opt-in signals.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Surface_Visibility
 */
#[CoversClass( Surface_Visibility::class )]
class SurfaceVisibilityTest extends TestCase {

	/**
	 * @dataProvider vip_visibility_preferences
	 * @param string|null $visibility Saved discoverability preference.
	 */
	#[DataProvider( 'vip_visibility_preferences' )]
	public function test_vip_retains_legacy_surfaces( $visibility ) {
		$previous = get_option( Initializer::VISIBILITY_OPTION, null );
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );
		if ( null === $visibility ) {
			delete_option( Initializer::VISIBILITY_OPTION );
		} else {
			update_option( Initializer::VISIBILITY_OPTION, $visibility );
		}

		try {
			$this->assertFalse( Initializer::is_seo_surface_visible() );
			$data = Surface_Visibility::inject_optin_availability( array( 'keep' => 1 ) );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
			$this->assertSame( 1, $data['keep'] );
			$this->assertSame( $visibility, get_option( Initializer::VISIBILITY_OPTION, null ) );
		} finally {
			Constants::clear_single_constant( 'WPCOM_IS_VIP_ENV' );
			if ( null === $previous ) {
				delete_option( Initializer::VISIBILITY_OPTION );
			} else {
				update_option( Initializer::VISIBILITY_OPTION, $previous );
			}
		}
	}

	public static function vip_visibility_preferences() {
		return array(
			'absent'  => array( null ),
			'hidden'  => array( '' ),
			'visible' => array( '1' ),
		);
	}

	/**
	 * @dataProvider saved_visibility_preferences
	 * @param string|null $visibility Older saved discoverability preference.
	 */
	#[DataProvider( 'saved_visibility_preferences' )]
	public function test_existing_installs_get_the_dashboard_without_changing_preferences( $visibility ) {
		$previous = get_option( Initializer::VISIBILITY_OPTION, null );
		if ( null === $visibility ) {
			delete_option( Initializer::VISIBILITY_OPTION );
		} else {
			update_option( Initializer::VISIBILITY_OPTION, $visibility );
		}
		try {
			$this->assertTrue( Surface_Visibility::is_visible() );
			$this->assertFalse( Surface_Visibility::is_optin_available() );
			$this->assertSame( $visibility, get_option( Initializer::VISIBILITY_OPTION, null ) );
		} finally {
			if ( null === $previous ) {
				delete_option( Initializer::VISIBILITY_OPTION );
			} else {
				update_option( Initializer::VISIBILITY_OPTION, $previous );
			}
		}
	}

	/** @return array Saved visibility states. */
	public static function saved_visibility_preferences() {
		return array(
			'absent' => array( null ),
			'off'    => array( '0' ),
			'on'     => array( '1' ),
		);
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

	public function test_inject_optin_availability_preserves_other_script_data() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$data = Surface_Visibility::inject_optin_availability( null );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$data = Surface_Visibility::inject_optin_availability( array( 'keep' => 1 ) );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
		$this->assertSame( 1, $data['keep'] );
		delete_option( Initializer::VISIBILITY_OPTION );
	}
}
