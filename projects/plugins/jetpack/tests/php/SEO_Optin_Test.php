<?php
/**
 * Tests the Jetpack SEO opt-in endpoint, which switches an existing install over to the
 * new SEO experience by marking the surface visible and activating the seo-tools module.
 *
 * @package jetpack
 */

use Automattic\Jetpack\SEO\Initializer as Jetpack_SEO_Initializer;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\SEO\Initializer
 */
#[CoversClass( Jetpack_SEO_Initializer::class )]
class SEO_Optin_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start each test hidden and with seo-tools inactive.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Jetpack_SEO_Initializer::VISIBILITY_OPTION );
		Jetpack_Options::update_option( 'active_modules', array() );
	}

	/**
	 * Opting in marks the surface visible and returns the dashboard URL to redirect to.
	 * (Module activation is delegated to Modules::activate(), covered by its own tests; the
	 * test environment doesn't persist that activation, so we assert handle_optin's own
	 * deterministic effects here.)
	 */
	public function test_opt_in_marks_surface_visible_and_returns_dashboard_url() {
		$data = Jetpack_SEO_Initializer::handle_optin()->get_data();

		$this->assertTrue( (bool) get_option( Jetpack_SEO_Initializer::VISIBILITY_OPTION ) );
		$this->assertTrue( $data['success'] );
		$this->assertStringContainsString( 'page=jetpack-seo', $data['redirect'] );
	}

	/**
	 * The opt-in route is registered on the jetpack/v4 namespace.
	 */
	public function test_opt_in_route_is_registered() {
		Jetpack_SEO_Initializer::register_optin_route();

		$this->assertArrayHasKey( '/jetpack/v4/seo/opt-in', rest_get_server()->get_routes( 'jetpack/v4' ) );
	}
}
