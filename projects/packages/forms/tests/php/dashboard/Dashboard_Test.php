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
		remove_all_filters( 'wp_redirect' );
		unset( $_GET['page'], $_GET['p'] );
		parent::tear_down();
	}

	/**
	 * Test get_forms_admin_url without tab parameter.
	 */
	public function test_get_forms_admin_url_without_tab() {
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url() );
	}

	/**
	 * Test get_forms_admin_url with tab parameter.
	 */
	public function test_get_forms_admin_url_with_tab() {
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2Fforms';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'forms' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'responses/inbox' ) );
	}

	/**
	 * Test get_forms_admin_url with post_id parameter.
	 * Verifies the responseIds query parameter is correctly encoded in the path.
	 */
	public function test_get_forms_admin_url_with_post_id() {
		// Tab + post_id: path includes responseIds in the path.
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox?responseIds=["123"]' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox', 123 ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/spam?responseIds=["456"]' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'spam', 456 ) );

		// post_id only (no tab): defaults to /responses/inbox with responseIds.
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox?responseIds=["789"]' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( null, 789 ) );
	}

	/**
	 * Test get_forms_admin_url with screen ID equivalents.
	 */
	public function test_get_forms_admin_url_with_screen_id_equivalents() {
		$url_form = Dashboard::get_forms_admin_url( 'forms' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '&p=%2Fforms', $url_form );

		$url_feedback = Dashboard::get_forms_admin_url( 'inbox' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_feedback );
		$this->assertStringContainsString( '&p=%2Fresponses%2Finbox', $url_feedback );
	}

	/**
	 * Test redirect_legacy_dashboard_url redirects the retired legacy slug to the wp-build dashboard.
	 */
	public function test_redirect_legacy_dashboard_url_redirects_legacy_slug() {
		$_GET['page'] = Dashboard::ADMIN_SLUG;

		$captured = null;
		add_filter(
			'wp_redirect',
			function ( $location ) use ( &$captured ) {
				$captured = $location;
				throw new \RuntimeException( 'redirect' );
			}
		);

		try {
			Dashboard::redirect_legacy_dashboard_url();
			$this->fail( 'Expected a redirect to the wp-build dashboard.' );
		} catch ( \RuntimeException $e ) {
			$this->assertSame( 'redirect', $e->getMessage() );
		}

		$this->assertStringContainsString( 'page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, (string) $captured );
		$this->assertStringContainsString( '%2Fresponses%2Finbox', (string) $captured );
	}

	/**
	 * Test redirect_legacy_dashboard_url does nothing for non-legacy pages.
	 */
	public function test_redirect_legacy_dashboard_url_ignores_other_pages() {
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		add_filter(
			'wp_redirect',
			function () {
				throw new \RuntimeException( 'should not redirect' );
			}
		);

		// Should return without redirecting; if it redirects, the filter throws and fails the test.
		Dashboard::redirect_legacy_dashboard_url();

		$this->expectNotToPerformAssertions();
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
