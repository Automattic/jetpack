<?php
/**
 * Tests for the SEO surface's discoverability cohort and opt-in.
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

	protected function setUp(): void {
		parent::setUp();
		add_filter( 'rsm_jetpack_seo', '__return_true' );
	}

	protected function tearDown(): void {
		remove_filter( 'rsm_jetpack_seo', '__return_true' );
		parent::tearDown();
	}

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

	public function test_migration_keeps_module_choices_and_saved_values() {
		update_option( Initializer::VISIBILITY_OPTION, '' );
		update_option( 'jetpack_active_modules', array( 'sitemaps', 'verification-tools' ) );
		update_option( 'advanced_seo_front_page_description', 'Saved description' );
		$this->assertTrue( Surface_Visibility::is_visible() );
		$this->assertFalse( Surface_Visibility::is_optin_available() );
		$this->assertSame( array( 'sitemaps', 'verification-tools' ), get_option( 'jetpack_active_modules' ) );
		$this->assertSame( 'Saved description', get_option( 'advanced_seo_front_page_description' ) );
		$this->assertSame( '', get_option( Initializer::VISIBILITY_OPTION ) );
		delete_option( Initializer::VISIBILITY_OPTION );
		delete_option( 'jetpack_active_modules' );
		delete_option( 'advanced_seo_front_page_description' );
	}

	public function test_migration_script_data_retires_the_optin_without_losing_other_data() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$data = Surface_Visibility::inject_optin_availability( array( 'keep' => 1 ) );
		$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
		$this->assertFalse( $data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] );
		$this->assertSame( 1, $data['keep'] );
	}
}
