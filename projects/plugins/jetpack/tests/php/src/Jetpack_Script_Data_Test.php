<?php
/**
 * Tests the Jetpack_Script_Data class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
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
	 * Test set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_active_plan_cache();
	}

	/**
	 * Test tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_show_editor_panel_branding' );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_filters( 'jetpack_skip_photon_domain' );
		remove_all_filters( 'pre_option_jetpack_active_plan' );
		$this->reset_active_plan_cache();
		parent::tear_down();
	}

	/**
	 * Drop Current_Plan's per-request cache so each test sees the plan it sets up.
	 */
	private function reset_active_plan_cache() {
		$prop = new ReflectionProperty( Jetpack_Plan::class, 'active_plan_cache' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, null );
	}

	/**
	 * Pretend the site is on the given plan, the way a synced plan would look.
	 *
	 * @param string $product_slug Plan product slug.
	 */
	private function set_plan( $product_slug ) {
		add_filter(
			'pre_option_jetpack_active_plan',
			function () use ( $product_slug ) {
				return array( 'product_slug' => $product_slug );
			}
		);
		$this->reset_active_plan_cache();
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
	 * Tests that sites keep using the external Photon domain by default.
	 */
	public function test_default_skip_photon_domain_is_false() {
		$this->set_plan( 'jetpack_free' );
		$result = Jetpack_Script_Data::set_admin_script_data( array() );
		$this->assertFalse( $result['jetpack']['flags']['skipPhotonDomain'] );
	}

	/**
	 * Tests that VIP sites skip the external Photon domain.
	 */
	public function test_skip_photon_domain_is_true_on_vip() {
		$this->set_plan( 'vip' );
		$result = Jetpack_Script_Data::set_admin_script_data( array() );
		$this->assertTrue( $result['jetpack']['flags']['skipPhotonDomain'] );
	}

	/**
	 * Tests that the filter can flip the decision on a non-VIP site.
	 */
	public function test_filter_overrides_skip_photon_domain() {
		$this->set_plan( 'jetpack_free' );
		add_filter( 'jetpack_skip_photon_domain', '__return_true' );
		$result = Jetpack_Script_Data::set_admin_script_data( array() );
		$this->assertTrue( $result['jetpack']['flags']['skipPhotonDomain'] );
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
