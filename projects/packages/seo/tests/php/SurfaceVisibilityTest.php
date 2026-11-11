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
