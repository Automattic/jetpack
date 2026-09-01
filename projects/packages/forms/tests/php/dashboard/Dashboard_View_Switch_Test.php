<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Dashboard\Dashboard_View_Switch.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Dashboard_View_Switch
 *
 * @covers Automattic\Jetpack\Forms\Dashboard\Dashboard_View_Switch
 */
#[CoversClass( Dashboard_View_Switch::class )]
class Dashboard_View_Switch_Test extends BaseTestCase {

	/**
	 * Instance of Dashboard_View_Switch for testing
	 *
	 * @var Dashboard_View_Switch
	 */
	private $dashboard_view_switch;

	/**
	 * Set up test
	 */
	public function setUp(): void {
		parent::setUp();
		$this->dashboard_view_switch = new Dashboard_View_Switch();
	}

	/**
	 * Test that deprecated init method has been removed
	 */
	public function test_deprecated_init_method_removed() {
		// The init method has been removed as part of deprecation
		$this->assertFalse( method_exists( $this->dashboard_view_switch, 'init' ) );
	}

	/**
	 * Test that deprecated get_forms_admin_url method still works
	 */
	public function test_deprecated_get_forms_admin_url_still_works() {
		$result = $this->dashboard_view_switch->get_forms_admin_url();
		$this->assertIsString( $result );
	}

	/**
	 * Test that deprecated is_jetpack_forms_admin_page method still works
	 */
	public function test_deprecated_is_jetpack_forms_admin_page_still_works() {
		$result = $this->dashboard_view_switch->is_jetpack_forms_admin_page();
		$this->assertIsBool( $result );
	}

	/**
	 * Test that deprecated static is_jetpack_forms_admin_page_available method still works
	 */
	public function test_deprecated_static_is_jetpack_forms_admin_page_available_still_works() {
		$result = Dashboard_View_Switch::is_jetpack_forms_admin_page_available();
		$this->assertTrue( $result ); // Should return true (default filter value)
	}

	/**
	 * Test that deprecated static is_jetpack_forms_view_switch_available method still works
	 */
	public function test_deprecated_static_is_jetpack_forms_view_switch_available_still_works() {
		$result = Dashboard_View_Switch::is_jetpack_forms_view_switch_available();
		$this->assertFalse( $result ); // Should return false (retire_view_switch filter is true by default)
	}

	/**
	 * Test that deprecated static is_jetpack_forms_announcing_new_menu method still works
	 */
	public function test_deprecated_static_is_jetpack_forms_announcing_new_menu_still_works() {
		$result = Dashboard_View_Switch::is_jetpack_forms_announcing_new_menu();
		$this->assertTrue( $result ); // Should return true (default filter value)
	}

	/**
	 * Test that deprecated static is_classic_view_available method still works
	 */
	public function test_deprecated_static_is_classic_view_available_still_works() {
		$result = Dashboard_View_Switch::is_classic_view_available();
		$this->assertIsBool( $result );
	}

	/**
	 * Test that class constants have been removed
	 */
	public function test_class_constants_removed() {
		$reflection = new \ReflectionClass( Dashboard_View_Switch::class );
		$constants  = $reflection->getConstants();

		// CLASSIC_VIEW and MODERN_VIEW constants should be removed
		$this->assertArrayNotHasKey( 'CLASSIC_VIEW', $constants );
		$this->assertArrayNotHasKey( 'MODERN_VIEW', $constants );
	}

	/**
	 * Test that the deprecated class is properly marked with @deprecated annotation
	 */
	public function test_class_has_deprecation_annotation() {
		$reflection  = new \ReflectionClass( Dashboard_View_Switch::class );
		$doc_comment = $reflection->getDocComment();

		$this->assertStringContainsString( '@deprecated', $doc_comment );
		$this->assertStringContainsString( 'This class is no longer needed', $doc_comment );
	}
}
