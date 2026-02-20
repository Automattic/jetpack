<?php
/**
 * Tests the Jetpack_Script_Data class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Jetpack_Script_Data;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests the Jetpack_Script_Data class.
 *
 * @covers \Automattic\Jetpack\Plugin\Jetpack_Script_Data
 */
#[CoversClass( Jetpack_Script_Data::class )]
class Jetpack_Script_Data_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_show_editor_panel_branding' );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		parent::tear_down();
	}

	/**
	 * Tests that configure() registers the filter.
	 */
	public function test_configure_registers_filter() {
		Jetpack_Script_Data::configure();
		$this->assertNotFalse( has_filter( 'jetpack_admin_js_script_data', array( Jetpack_Script_Data::class, 'set_admin_script_data' ) ) );
	}

	/**
	 * Tests that set_admin_script_data returns branding as true by default.
	 */
	public function test_default_branding_is_true() {
		$result = Jetpack_Script_Data::set_admin_script_data( array() );
		$this->assertTrue( $result['jetpack']['flags']['showJetpackBranding'] );
	}

	/**
	 * Tests that the filter can disable branding.
	 */
	public function test_filter_disables_branding() {
		add_filter( 'jetpack_show_editor_panel_branding', '__return_false' );
		$result = Jetpack_Script_Data::set_admin_script_data( array() );
		$this->assertFalse( $result['jetpack']['flags']['showJetpackBranding'] );
	}

	/**
	 * Tests that existing data in the array is preserved.
	 */
	public function test_preserves_existing_data() {
		$result = Jetpack_Script_Data::set_admin_script_data( array( 'existing' => 'value' ) );
		$this->assertSame( 'value', $result['existing'] );
		$this->assertArrayHasKey( 'jetpack', $result );
	}
}
