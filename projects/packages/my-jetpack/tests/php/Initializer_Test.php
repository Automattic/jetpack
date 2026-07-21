<?php
/**
 * Test the My Jetpack Initializer.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Initializer class.
 */
class Initializer_Test extends BaseTestCase {
	/**
	 * Set up before each test.
	 *
	 * Mirrors tear_down() so every test starts from a clean slate even if an
	 * earlier test in the run leaked state.
	 */
	public function set_up() {
		Constants::clear_constants();
		StatusCache::clear();
		unset( $_GET['step'] );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		Constants::clear_constants();
		StatusCache::clear();
		unset( $_GET['step'] );
	}

	/**
	 * Onboarding is available on regular (non-Simple) sites.
	 */
	public function test_onboarding_is_available_by_default() {
		$this->assertTrue( Initializer::is_onboarding_available() );
	}

	/**
	 * Onboarding is never available on WordPress.com Simple sites.
	 */
	public function test_onboarding_is_not_available_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( Initializer::is_onboarding_available() );
	}

	/**
	 * Onboarding stays available on WordPress.com Atomic (WoA) sites: only
	 * Simple sites are excluded, not the whole WordPress.com platform.
	 *
	 * The constants below make Host::is_woa_site() true, which no other test
	 * sets up, so this is the only test that would catch a broadening of the
	 * exclusion from is_wpcom_simple() to is_wpcom_platform(). Don't delete it
	 * as a duplicate of the by-default test: that one sets no constants and
	 * can't tell the two classifiers apart.
	 */
	public function test_onboarding_is_available_on_woa() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 123 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/tmp/wpcomsh/wpcomsh.php' );
		StatusCache::clear();

		$this->assertTrue( Initializer::is_onboarding_available() );
	}

	/**
	 * Data provider for the onboarding redirect decision.
	 *
	 * @return array
	 */
	public static function provide_onboarding_redirect_cases() {
		$to_onboarding = array(
			'page' => 'my-jetpack',
			'step' => 'onboarding',
		);
		$to_home       = array( 'page' => 'my-jetpack' );

		return array(
			'available, disconnected, no step: redirect to onboarding' => array( '', false, true, $to_onboarding ),
			'available, disconnected, on onboarding: stay' => array( 'onboarding', false, true, null ),
			'available, connected, no step: stay'          => array( '', true, true, null ),
			'available, connected, on onboarding: redirect home' => array( 'onboarding', true, true, $to_home ),
			'unavailable, disconnected, no step: stay'     => array( '', false, false, null ),
			'unavailable, disconnected, on onboarding: redirect home' => array( 'onboarding', false, false, $to_home ),
			'unavailable, connected, no step: stay'        => array( '', true, false, null ),
			'unavailable, connected, on onboarding: redirect home' => array( 'onboarding', true, false, $to_home ),
		);
	}

	/**
	 * The redirect decision is correct for every combination of step,
	 * connection state, and onboarding availability.
	 *
	 * @dataProvider provide_onboarding_redirect_cases
	 *
	 * @param string     $step                 The `step` query param.
	 * @param bool       $is_connected         Whether the site is connected.
	 * @param bool       $onboarding_available Whether onboarding is available on this site.
	 * @param array|null $expected             Expected redirect query args, or null to stay.
	 */
	#[DataProvider( 'provide_onboarding_redirect_cases' )]
	public function test_get_onboarding_redirect_args( $step, $is_connected, $onboarding_available, $expected ) {
		$this->assertSame( $expected, Initializer::get_onboarding_redirect_args( $step, $is_connected, $onboarding_available ) );
	}

	/**
	 * The admin page marks the container with the onboarding route when
	 * onboarding is requested and available.
	 */
	public function test_admin_page_renders_onboarding_route_when_available() {
		$_GET['step'] = 'onboarding';

		ob_start();
		Initializer::admin_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'data-route="onboarding"', $output );
	}

	/**
	 * The admin page never marks the container with the onboarding route on
	 * WordPress.com Simple sites, even when the redirect did not run.
	 */
	public function test_admin_page_does_not_render_onboarding_route_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$_GET['step'] = 'onboarding';

		ob_start();
		Initializer::admin_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="my-jetpack-container"', $output );
		$this->assertStringNotContainsString( 'data-route', $output );
	}

	/**
	 * A disconnected site with no step is funneled into onboarding by admin_init().
	 *
	 * Calls admin_init() itself (not the extracted helper) so the call-site
	 * wiring is covered: the argument order passed to
	 * get_onboarding_redirect_args() and the redirect performed on its result.
	 */
	public function test_admin_init_redirects_disconnected_site_to_onboarding() {
		$location = $this->capture_admin_init_redirect();

		$this->assertNotNull( $location, 'Expected admin_init() to redirect.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringContainsString( 'step=onboarding', $location );
	}

	/**
	 * An onboarding request on a WordPress.com Simple site is redirected home
	 * by admin_init() instead of letting the onboarding screen load.
	 */
	public function test_admin_init_redirects_onboarding_request_home_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$_GET['step'] = 'onboarding';

		$location = $this->capture_admin_init_redirect();

		$this->assertNotNull( $location, 'Expected admin_init() to redirect away from onboarding.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringNotContainsString( 'step=onboarding', $location );
	}

	/**
	 * Run Initializer::admin_init() and capture the redirect it attempts.
	 *
	 * The wp_redirect filter throws so the exit() that follows the redirect
	 * call never runs; the location is captured before the throw.
	 *
	 * @return string|null The redirect location, or null when no redirect happened.
	 */
	private function capture_admin_init_redirect() {
		$location = null;
		$capture  = function ( $redirect_location ) use ( &$location ) {
			$location = $redirect_location;
			throw new \Exception( 'Intercepted redirect to skip exit().' );
		};

		add_filter( 'wp_redirect', $capture );
		try {
			Initializer::admin_init();
		} catch ( \Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- Expected: thrown by the capture filter above.
		} finally {
			remove_filter( 'wp_redirect', $capture );
		}

		return $location;
	}
}
