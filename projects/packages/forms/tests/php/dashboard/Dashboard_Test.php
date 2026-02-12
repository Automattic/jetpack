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
	 * Test get_forms_admin_url with forms tab parameter
	 */
	public function test_get_forms_admin_url_with_forms_tab() {
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/forms';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'forms' ) );
	}

	/**
	 * Test get_forms_admin_url without tab when alpha filter is enabled
	 */
	public function test_get_forms_admin_url_alpha_without_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2F';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url() );
		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}

	/**
	 * Test get_forms_admin_url with tab when alpha filter is enabled
	 */
	public function test_get_forms_admin_url_alpha_with_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2Finbox';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2Fforms';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'forms' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2Fresponses/inbox';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'responses/inbox' ) );

		remove_filter( 'jetpack_forms_alpha', '__return_true' );
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
	 * Test get_admin_url with valid screen IDs
	 */
	public function test_get_admin_url_with_valid_screen_ids() {
		$url_form = Dashboard::get_admin_url( 'edit-jetpack_form' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '#/forms', $url_form );

		// For non-alpha, 'responses/inbox' is not a valid tab, so returns base URL only.
		$url_feedback = Dashboard::get_admin_url( 'edit-feedback' );
		$expected     = get_admin_url() . 'admin.php?page=' . Dashboard::ADMIN_SLUG;
		$this->assertEquals( $expected, $url_feedback );
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
	 * Test get_admin_url with valid screen IDs when alpha filter is enabled.
	 */
	public function test_get_admin_url_alpha_with_valid_screen_ids() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );

		$url_form = Dashboard::get_admin_url( 'edit-jetpack_form' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '&p=%2Fforms', $url_form );

		$url_feedback = Dashboard::get_admin_url( 'edit-feedback' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_feedback );
		$this->assertStringContainsString( '&p=%2Fresponses/inbox', $url_feedback );

		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}
}
