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
	 * Test get_forms_admin_url without tab for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_without_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2F';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url() );
		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}

	/**
	 * Test get_forms_admin_url with tab for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_with_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2Fforms';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'forms' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
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
	 * Test get_forms_admin_url with screen ID equivalents (edit-jetpack_form -> forms, edit-feedback -> base/inbox).
	 */
	public function test_get_forms_admin_url_with_screen_id_equivalents() {
		$url_form = Dashboard::get_forms_admin_url( 'forms' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '#/forms', $url_form );

		// For legacy dashboard, edit-feedback equivalent is base URL (no tab).
		$url_feedback = Dashboard::get_forms_admin_url();
		$expected     = get_admin_url() . 'admin.php?page=' . Dashboard::ADMIN_SLUG;
		$this->assertEquals( $expected, $url_feedback );
	}

	/**
	 * Test get_forms_admin_url with invalid tab returns base URL.
	 */
	public function test_get_forms_admin_url_with_invalid_tab_returns_base_url() {
		$url = Dashboard::get_forms_admin_url( 'invalid-screen' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url );
		$this->assertStringNotContainsString( '#/', $url );

		$url = Dashboard::get_forms_admin_url( '' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url );
	}

	/**
	 * Test get_forms_admin_url with screen ID equivalents for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_with_screen_id_equivalents() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );

		$url_form = Dashboard::get_forms_admin_url( 'forms' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '&p=%2Fforms', $url_form );

		$url_feedback = Dashboard::get_forms_admin_url( 'inbox' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_feedback );
		$this->assertStringContainsString( '&p=%2Fresponses%2Finbox', $url_feedback );

		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}
}
