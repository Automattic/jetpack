<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Dashboard\Dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Dashboard
 *
 * @covers Automattic\Jetpack\Forms\Dashboard\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {

	/**
	 * Test get_forms_admin_url without tab parameter
	 */
	public function test_get_forms_admin_url_without_tab() {
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url() );
	}

	/**
	 * Test get_forms_admin_url with valid tab parameter
	 */
	public function test_get_forms_admin_url_with_valid_tab() {
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=inbox';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox' ) );

		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=spam';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'spam' ) );

		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=trash';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'trash' ) );
	}

	/**
	 * Test get_forms_admin_url with invalid tab parameter
	 */
	public function test_get_forms_admin_url_with_invalid_tab() {
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'invalid' ) );
	}

	/**
	 * Test is_jetpack_forms_admin_page when get_current_screen is not available
	 */
	public function test_is_jetpack_forms_admin_page_no_get_current_screen() {
		// When get_current_screen doesn't exist, should return false
		$this->assertFalse( Dashboard::is_jetpack_forms_admin_page() );
	}

	/**
	 * Test is_notes_enabled returns false by default
	 */
	public function test_is_notes_enabled_default() {
		$this->assertFalse( Dashboard::is_notes_enabled() );
	}

	/**
	 * Test is_notes_enabled returns true when filter is applied
	 */
	public function test_is_notes_enabled_with_filter() {
		add_filter( 'jetpack_forms_notes_enable', '__return_true' );
		$this->assertTrue( Dashboard::is_notes_enabled() );
		remove_filter( 'jetpack_forms_notes_enable', '__return_true' );
	}
}
