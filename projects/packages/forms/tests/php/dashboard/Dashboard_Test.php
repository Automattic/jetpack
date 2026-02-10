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

	/**
	 * Test get_admin_url with valid screen IDS
	 */
	public function test_get_admin_url_with_valid_screen_ids() {
		$url_form = Dashboard::get_admin_url( 'edit-jetpack_form' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '#/forms', $url_form );

		$url_feedback = Dashboard::get_admin_url( 'edit-feedback' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url_feedback );
		$this->assertStringContainsString( '#/responses', $url_feedback );
	}

	/**
	 * Test get_admin_url with invalid screen ID returns null.
	 */
	public function test_get_admin_url_with_invalid_screen() {
		$url = Dashboard::get_admin_url( 'invalid-screen' );
		$this->assertNull( $url );
		$url = Dashboard::get_admin_url( '' );
		$this->assertNull( $url );
	}

	/**
	 * Test load_wp_build does nothing when page parameter is wrong.
	 */
	public function test_load_wp_build_wrong_page() {
		$_GET['page'] = 'some-other-page';

		// Should return without requiring any files — no error, no side effects.
		Dashboard::load_wp_build();

		$this->assertFalse(
			function_exists( 'jetpack_forms_test_build_marker' ),
			'No build files should be loaded for wrong page.'
		);

		unset( $_GET['page'] );
	}

	/**
	 * Test load_wp_build does nothing when page parameter is missing.
	 */
	public function test_load_wp_build_no_page() {
		unset( $_GET['page'] );

		Dashboard::load_wp_build();

		$this->assertFalse(
			function_exists( 'jetpack_forms_test_build_marker' ),
			'No build files should be loaded when page is missing.'
		);
	}

	/**
	 * Test load_wp_build does nothing when build.php does not exist.
	 */
	public function test_load_wp_build_correct_page_missing_build() {
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		// build/build.php does not exist in the test environment, so
		// the method should return without errors after passing the
		// page check but failing the file_exists check.
		Dashboard::load_wp_build();

		$this->assertTrue( true, 'load_wp_build should not error when build.php is missing.' );

		unset( $_GET['page'] );
	}
}
