<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Dashboard\Dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
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
	 * Clean up after each test.
	 */
	public function tear_down() {
		$this->reset_wp_build_polyfills();
		unset( $_GET['page'], $_GET['p'] );
		parent::tear_down();
	}

	/**
	 * Test get_forms_admin_url without tab parameter (legacy dashboard)
	 */
	public function test_get_forms_admin_url_without_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url() );
		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * Test get_forms_admin_url with valid tab parameter (legacy dashboard)
	 */
	public function test_get_forms_admin_url_with_valid_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );

		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=inbox';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox' ) );

		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=spam';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'spam' ) );

		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=trash';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'trash' ) );

		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * Test get_forms_admin_url with invalid tab parameter (legacy dashboard)
	 */
	public function test_get_forms_admin_url_with_invalid_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'invalid' ) );
		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * Test get_forms_admin_url with forms tab parameter (legacy dashboard)
	 */
	public function test_get_forms_admin_url_with_forms_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/forms';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'forms' ) );
		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * Test get_forms_admin_url with post_id parameter (legacy mode).
	 * Verifies the r parameter is correctly appended in the hash fragment.
	 */
	public function test_get_forms_admin_url_with_post_id_legacy() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );

		// Tab + post_id: appends r and status in hash fragment (client-side handles redirect).
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=inbox&r=123';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox', 123 ) );

		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=spam&r=456';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'spam', 456 ) );

		// post_id only (no tab): appends r and status=inbox in hash fragment.
		$expected = get_admin_url() . 'admin.php?page=jetpack-forms-admin#/responses?status=inbox&r=789';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( null, 789 ) );

		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * Test get_forms_admin_url with post_id parameter (wp-build mode).
	 * Verifies the responseIds query parameter is correctly encoded in the path.
	 */
	public function test_get_forms_admin_url_with_post_id_wp_build() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );

		// Tab + post_id: path includes responseIds in the path.
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox?responseIds=["123"]' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox', 123 ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/spam?responseIds=["456"]' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'spam', 456 ) );

		// post_id only (no tab): defaults to /responses/inbox with responseIds.
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox?responseIds=["789"]' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( null, 789 ) );

		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}

	/**
	 * Test get_forms_admin_url without tab for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_without_tab() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
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
	 * Reset WP_Build_Polyfills static state between tests.
	 */
	private function reset_wp_build_polyfills() {
		$ref = new \ReflectionClass( WP_Build_Polyfills::class );

		$requested = $ref->getProperty( 'requested' );
		if ( PHP_VERSION_ID < 80100 ) {
			$requested->setAccessible( true );
		}
		$requested->setValue( null, array() );

		$hooked = $ref->getProperty( 'hooked' );
		if ( PHP_VERSION_ID < 80100 ) {
			$hooked->setAccessible( true );
		}
		$hooked->setValue( null, false );

		$threshold = $ref->getProperty( 'wp_version_threshold' );
		if ( PHP_VERSION_ID < 80100 ) {
			$threshold->setAccessible( true );
		}
		$threshold->setValue( null, '7.0' );
	}

	/**
	 * Test load_wp_build registers polyfills when on the wp-build admin page.
	 */
	public function test_load_wp_build_registers_polyfills_on_wpbuild_page() {
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;
		$_GET['p']    = '/responses/inbox';

		Dashboard::load_wp_build();

		$ref       = new \ReflectionClass( WP_Build_Polyfills::class );
		$requested = $ref->getProperty( 'requested' );
		if ( PHP_VERSION_ID < 80100 ) {
			$requested->setAccessible( true );
		}
		$value = $requested->getValue();

		$expected_handles = array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS );

		foreach ( $expected_handles as $handle ) {
			$this->assertArrayHasKey( $handle, $value, "Polyfill handle '$handle' should be registered." );
			$this->assertContains( 'jetpack-forms', $value[ $handle ], "Consumer 'jetpack-forms' should be registered for '$handle'." );
		}
	}

	/**
	 * Test load_wp_build does not register polyfills when on a different admin page.
	 */
	public function test_load_wp_build_does_not_register_polyfills_on_other_page() {
		$_GET['page'] = 'some-other-page';

		Dashboard::load_wp_build();

		$ref       = new \ReflectionClass( WP_Build_Polyfills::class );
		$requested = $ref->getProperty( 'requested' );
		if ( PHP_VERSION_ID < 80100 ) {
			$requested->setAccessible( true );
		}
		$value = $requested->getValue();

		$this->assertEmpty( $value, 'No polyfills should be registered when on a different page.' );
	}

	/**
	 * Test load_wp_build does not register polyfills when no page is set.
	 */
	public function test_load_wp_build_does_not_register_polyfills_without_page() {
		unset( $_GET['page'] );

		Dashboard::load_wp_build();

		$ref       = new \ReflectionClass( WP_Build_Polyfills::class );
		$requested = $ref->getProperty( 'requested' );
		if ( PHP_VERSION_ID < 80100 ) {
			$requested->setAccessible( true );
		}
		$value = $requested->getValue();

		$this->assertEmpty( $value, 'No polyfills should be registered when no page is set.' );
	}

	/**
	 * The wp-build dashboard page is detected when the alpha flag is on and the
	 * wp-build slug is requested (so the legacy SPA bundle is skipped there).
	 */
	public function test_is_wp_build_dashboard_page_true_on_wpbuild_slug() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		$this->assertTrue( Dashboard::is_wp_build_dashboard_page() );

		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}

	/**
	 * The legacy SPA bundle must still load when the alpha flag is off, even on the
	 * wp-build slug (the cross-variant redirect sends the user to the legacy page).
	 */
	public function test_is_wp_build_dashboard_page_false_when_alpha_off() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		$this->assertFalse( Dashboard::is_wp_build_dashboard_page() );

		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * The legacy dashboard slug is not treated as the wp-build page.
	 */
	public function test_is_wp_build_dashboard_page_false_on_legacy_slug() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );
		$_GET['page'] = Dashboard::ADMIN_SLUG;

		$this->assertFalse( Dashboard::is_wp_build_dashboard_page() );

		remove_filter( 'jetpack_forms_alpha', '__return_true' );
	}

	/**
	 * With no page requested, this is not the wp-build dashboard page.
	 */
	public function test_is_wp_build_dashboard_page_false_without_page() {
		add_filter( 'jetpack_forms_alpha', '__return_true' );
		unset( $_GET['page'] );

		$this->assertFalse( Dashboard::is_wp_build_dashboard_page() );

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
	 * Test get_forms_admin_url with screen ID equivalents (legacy dashboard).
	 */
	public function test_get_forms_admin_url_with_screen_id_equivalents() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );

		$url_form = Dashboard::get_forms_admin_url( 'forms' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '#/forms', $url_form );

		// For legacy dashboard, edit-feedback equivalent is base URL (no tab).
		$url_feedback = Dashboard::get_forms_admin_url();
		$expected     = get_admin_url() . 'admin.php?page=' . Dashboard::ADMIN_SLUG;
		$this->assertEquals( $expected, $url_feedback );

		remove_filter( 'jetpack_forms_alpha', '__return_false' );
	}

	/**
	 * Test get_forms_admin_url with invalid tab returns base URL (legacy dashboard).
	 */
	public function test_get_forms_admin_url_with_invalid_tab_returns_base_url() {
		add_filter( 'jetpack_forms_alpha', '__return_false' );

		$url = Dashboard::get_forms_admin_url( 'invalid-screen' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url );
		$this->assertStringNotContainsString( '#/', $url );

		$url = Dashboard::get_forms_admin_url( '' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::ADMIN_SLUG, $url );

		remove_filter( 'jetpack_forms_alpha', '__return_false' );
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
