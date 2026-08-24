<?php
/**
 * Tests for the Jetpack AI admin page script data.
 *
 * The contract worth locking down: the pre-release gate flag rides the
 * jetpackAiSettings inline script and follows the a8c proxy, so the Features view
 * stays hidden on unproxied requests while the MCP-only page keeps working. The
 * Tracks properties in the same payload keep following the broader environment
 * check, which is what they are for.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-ai-page.php';

/**
 * Class Jetpack_AI_Page_Test
 *
 * @covers \Jetpack_AI_Page
 */
#[CoversClass( Jetpack_AI_Page::class )]
class Jetpack_AI_Page_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Saved siteurl option for restoration in tear_down.
	 *
	 * @var string|null
	 */
	private $saved_siteurl;

	/**
	 * Record the siteurl option and clear the proxied-request marker.
	 */
	public function set_up() {
		parent::set_up();

		$this->saved_siteurl = get_option( 'siteurl' );
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
	}

	/**
	 * Reset the siteurl option, the proxied-request marker and the scripts registry.
	 */
	public function tear_down() {
		if ( null !== $this->saved_siteurl ) {
			update_option( 'siteurl', $this->saved_siteurl );
		}
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		unset( $GLOBALS['wp_scripts'] );

		parent::tear_down();
	}

	/**
	 * Run page_admin_scripts() against a fresh scripts registry and decode the
	 * jetpackAiSettings payload it injects.
	 *
	 * @return array Decoded payload.
	 */
	private function get_injected_settings() {
		unset( $GLOBALS['wp_scripts'] );

		( new Jetpack_AI_Page() )->page_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( 'jetpack-ai-admin', 'before' ) ) );
		$this->assertSame( 1, preg_match( '/var jetpackAiSettings = (\{.*\});/', $inline, $matches ) );

		$settings = json_decode( $matches[1], true );
		$this->assertIsArray( $settings );

		return $settings;
	}

	/**
	 * An unproxied request does not get the Features view flag.
	 */
	public function test_features_view_flag_is_off_by_default() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'showFeaturesView', $settings );
		$this->assertFalse( $settings['showFeaturesView'] );
	}

	/**
	 * A proxied a8c request turns the Features view flag on.
	 */
	public function test_features_view_flag_follows_the_a8c_proxy() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['showFeaturesView'] );
	}

	/**
	 * The proxy marker rides every request, carrying '0' when the proxy is off, so
	 * the gate has to read its value rather than the key's presence.
	 */
	public function test_features_view_flag_is_off_when_the_proxy_marker_is_zero() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '0';

		$settings = $this->get_injected_settings();

		$this->assertFalse( $settings['showFeaturesView'] );
	}

	/**
	 * A testing hostname on its own no longer opens the gate, which is the whole
	 * point: an unproxied Jurassic Ninja visitor sees what an end user sees.
	 */
	public function test_features_view_flag_ignores_testing_hostnames() {
		update_option( 'siteurl', 'https://mysite.jurassic.ninja' );

		$settings = $this->get_injected_settings();

		$this->assertTrue( jetpack_is_internal_testing_environment() );
		$this->assertFalse( $settings['showFeaturesView'] );
	}

	/**
	 * The Tracks environment flag keeps following the broader check, so traffic from
	 * a testing hostname stays tagged as test traffic even with the proxy off.
	 */
	public function test_tracks_is_test_still_follows_testing_hostnames() {
		update_option( 'siteurl', 'https://mysite.jurassic.ninja' );

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['isTest'] );
	}

	/**
	 * The Tracks audience properties ride the same payload (AIINT-586): isTest
	 * is the environment flag, isA11n the identity flag. The test environment
	 * defines no is_automattician() and connects no user, so isA11n is false.
	 */
	public function test_tracks_audience_properties_default_to_false() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'isA11n', $settings );
		$this->assertArrayHasKey( 'isTest', $settings );
		$this->assertFalse( $settings['isA11n'] );
		$this->assertFalse( $settings['isTest'] );
	}

	/**
	 * A proxied request is a test environment regardless of who made it, so
	 * isTest follows jetpack_is_internal_testing_environment().
	 */
	public function test_tracks_is_test_follows_internal_testing_environment() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['isTest'] );
	}
}
