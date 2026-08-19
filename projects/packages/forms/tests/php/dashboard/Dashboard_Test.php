<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Dashboard\Dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Test class for Dashboard
 *
 * @covers Automattic\Jetpack\Forms\Dashboard\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {

	/**
	 * Function names captured from _doing_it_wrong() during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * The Dashboard instance the submenu was registered from.
	 *
	 * @var Dashboard|null
	 */
	private $dashboard = null;

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$this->reset_wp_build_polyfills();
		unset( $_GET['page'], $_GET['p'] );
		parent::tear_down();
	}

	/**
	 * Test get_forms_admin_url with post_id parameter (wp-build mode).
	 * Verifies the responseIds query parameter is correctly encoded in the path.
	 */
	public function test_get_forms_admin_url_with_post_id_wp_build() {

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
	 * Test get_single_response_admin_url points at the standalone response page (wp-build mode).
	 */
	public function test_get_single_response_admin_url_wp_build() {

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/response/123' );
		$this->assertEquals( $expected, Dashboard::get_single_response_admin_url( 123 ) );

		// Without a post ID there is no single response to open — fall back to the list.
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_single_response_admin_url() );
	}

	/**
	 * Capture where redirect_dashboard_url_cross_variant() sends the request.
	 *
	 * The method ends in `wp_safe_redirect()` + `exit`, so the redirect is
	 * intercepted at the `wp_redirect` filter and aborted with an exception before
	 * either headers or the exit are reached.
	 *
	 * @return string|null The redirect target, or null if no redirect happened.
	 */
	private function capture_cross_variant_redirect() {
		$redirect = null;

		// Declared in the docblock rather than as a native `never` return type: this
		// package supports PHP 7.4 and `never` is 8.1+.
		$capture = /** @return never */ function ( $location ) use ( &$redirect ) {
			$redirect = $location;
			throw new \RuntimeException( 'redirected' );
		};

		add_filter( 'wp_redirect', $capture );

		try {
			Dashboard::redirect_dashboard_url_cross_variant();
		} catch ( \RuntimeException $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Expected — stands in for the `exit` after the redirect.
		} finally {
			remove_filter( 'wp_redirect', $capture );
		}

		return $redirect;
	}

	/**
	 * Test get_forms_admin_url without tab for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_without_tab() {
		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url() );
	}

	/**
	 * Test get_forms_admin_url with tab for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_with_tab() {

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'inbox' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=%2Fforms';
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'forms' ) );

		$expected = get_admin_url() . 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '&p=' . rawurlencode( '/responses/inbox' );
		$this->assertEquals( $expected, Dashboard::get_forms_admin_url( 'responses/inbox' ) );
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
	 * The dashboard page is detected from the slug alone.
	 */
	public function test_is_wp_build_dashboard_page_true_on_wpbuild_slug() {
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		$this->assertTrue( Dashboard::is_wp_build_dashboard_page() );
	}

	/**
	 * Links generated before the legacy dashboard was retired still carry its slug.
	 * They must land on the dashboard rather than a page that no longer registers.
	 */
	public function test_redirect_cross_variant_sends_legacy_slug_to_wp_build() {
		$_GET['page'] = Dashboard::ADMIN_SLUG;

		$redirect = $this->capture_cross_variant_redirect();

		$this->assertNotNull( $redirect, 'A legacy dashboard URL must redirect.' );
		$this->assertStringContainsString( 'page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $redirect );
	}

	/**
	 * The dashboard slug is already correct, so it must not bounce.
	 */
	public function test_redirect_cross_variant_leaves_the_wp_build_slug_alone() {
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		$this->assertNull( $this->capture_cross_variant_redirect() );
	}

	/**
	 * `jetpack_forms_alpha` no longer selects anything, so anyone still filtering it
	 * is told rather than left wondering why their filter stopped working.
	 */
	public function test_init_announces_the_retired_filter() {
		$announced = array();
		add_filter( 'deprecated_hook_trigger_error', '__return_false' );
		add_action(
			'deprecated_hook_run',
			function ( $hook ) use ( &$announced ) {
				$announced[] = $hook;
			}
		);

		add_filter( 'jetpack_forms_alpha', '__return_false' );
		( new Dashboard() )->init();
		remove_filter( 'jetpack_forms_alpha', '__return_false' );

		$this->assertContains( 'jetpack_forms_alpha', $announced );
	}

	/**
	 * ...and stays quiet for the overwhelming majority who never used it.
	 */
	public function test_init_is_silent_without_the_retired_filter() {
		$announced = array();
		add_filter( 'deprecated_hook_trigger_error', '__return_false' );
		add_action(
			'deprecated_hook_run',
			function ( $hook ) use ( &$announced ) {
				$announced[] = $hook;
			}
		);

		( new Dashboard() )->init();

		$this->assertNotContains( 'jetpack_forms_alpha', $announced );
	}

	/**
	 * The legacy dashboard slug is not treated as the wp-build page.
	 */
	public function test_is_wp_build_dashboard_page_false_on_legacy_slug() {
		$_GET['page'] = Dashboard::ADMIN_SLUG;

		$this->assertFalse( Dashboard::is_wp_build_dashboard_page() );
	}

	/**
	 * With no page requested, this is not the wp-build dashboard page.
	 */
	public function test_is_wp_build_dashboard_page_false_without_page() {
		unset( $_GET['page'] );

		$this->assertFalse( Dashboard::is_wp_build_dashboard_page() );
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
	 * Test get_forms_admin_url with screen ID equivalents for wp-build dashboard
	 */
	public function test_get_forms_admin_url_wp_build_with_screen_id_equivalents() {

		$url_form = Dashboard::get_forms_admin_url( 'forms' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_form );
		$this->assertStringContainsString( '&p=%2Fforms', $url_form );

		$url_feedback = Dashboard::get_forms_admin_url( 'inbox' );
		$this->assertStringContainsString( 'admin.php?page=' . Dashboard::FORMS_WPBUILD_ADMIN_SLUG, $url_feedback );
		$this->assertStringContainsString( '&p=%2Fresponses%2Finbox', $url_feedback );
	}

	/**
	 * Register the wp-build submenu and hand back its entry.
	 *
	 * Runs with the missing-build report captured, because a test process never has
	 * the real build/build.php and would otherwise trip the suite's warning gate.
	 *
	 * @return array|null The registered menu entry.
	 */
	private function register_wp_build_submenu() {
		$this->capture_doing_it_wrong();

		$this->dashboard = new Dashboard();
		$this->dashboard->add_admin_submenu();

		return Admin_Menu::remove_menu( Dashboard::FORMS_WPBUILD_ADMIN_SLUG );
	}

	/**
	 * Point the build-entry lookup at a path of our choosing.
	 *
	 * The real build/ is gitignored and CI runs no build step, so without this the
	 * result would depend on whether the developer happens to have built the package.
	 *
	 * @param string $path Path to stand in for build/build.php.
	 */
	private function set_wp_build_index( $path ) {
		$property = new \ReflectionProperty( Dashboard::class, 'wp_build_index' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $path );
	}

	/**
	 * Record _doing_it_wrong() calls instead of letting them raise.
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) {
				$this->doing_it_wrong[] = $function_name;
			}
		);
	}

	/**
	 * With no generated callback, the page must fall back to the notice — never to the
	 * legacy mount point, which would render blank because load_admin_scripts() does
	 * not enqueue the legacy bundle on this screen.
	 *
	 * Runs isolated so the callback is reliably absent: a sibling test requires
	 * build/build.php when a local build exists, which would otherwise define it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_add_admin_submenu_registers_the_notice_without_the_generated_callback() {
		$this->set_wp_build_index( __DIR__ . '/../fixtures/build-entry/absent.php' );
		$this->assertFalse( function_exists( 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page' ) );

		$menu_item = $this->register_wp_build_submenu();

		$this->assertIsArray( $menu_item );
		$this->assertSame( array( $this->dashboard, 'render_wp_build_unavailable' ), $menu_item['function'] );
		$this->assertContains( Dashboard::class . '::add_admin_submenu', $this->doing_it_wrong );
	}

	/**
	 * With the generated callback present, the page must wire it directly.
	 *
	 * This is the half that catches drift: the callback name is derived from the page
	 * slug at build time, so a rename on either side silently drops every user onto the
	 * missing-assets notice. Asserting the literal name is what makes that fail loudly.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_add_admin_submenu_wires_the_generated_render_callback() {
		$fixture = __DIR__ . '/../fixtures/build-entry/build.php';
		$this->set_wp_build_index( $fixture );
		require_once $fixture;

		$menu_item = $this->register_wp_build_submenu();

		$this->assertIsArray( $menu_item );
		$this->assertSame( 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page', $menu_item['function'] );
		$this->assertSame( array(), $this->doing_it_wrong, 'A present build must not report a missing one.' );
	}

	/**
	 * Test the fallback renders an error notice rather than an empty container.
	 */
	public function test_render_wp_build_unavailable_outputs_error_notice() {
		$dashboard = new Dashboard();

		ob_start();
		$dashboard->render_wp_build_unavailable();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
		$this->assertStringContainsString( 'missing the files it needs', $output );
		$this->assertStringNotContainsString( 'jp-forms-dashboard', $output );
	}
}
