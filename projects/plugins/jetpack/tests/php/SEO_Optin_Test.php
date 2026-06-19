<?php
/**
 * Tests the Jetpack SEO opt-in endpoint, which switches an existing install over to the
 * new SEO experience by marking the surface visible and activating the seo-tools module.
 *
 * @package jetpack
 */

use Automattic\Jetpack\SEO\Initializer as Jetpack_SEO_Initializer;

/**
 * Integration test: exercises the SEO package's opt-in REST route + handler from the
 * plugin's WP_UnitTestCase environment. No coverage annotation — Initializer lives in
 * the seo package, which is outside this suite's coverage scope, and the package's own
 * unit tests measure its coverage.
 */
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

	/**
	 * The route is gated on `manage_options`: a user without it is rejected and the request
	 * has no side effects (the surface stays hidden). Dispatched through the REST server so the
	 * `permission_callback` actually runs — calling the handler directly would bypass it.
	 */
	public function test_opt_in_requires_manage_options() {
		Jetpack_SEO_Initializer::register_optin_route();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'POST', '/jetpack/v4/seo/opt-in' ) );

		$this->assertSame( 403, $response->get_status() );
		// The rejected request never reached the handler, so the surface is still hidden.
		$this->assertFalse( (bool) get_option( Jetpack_SEO_Initializer::VISIBILITY_OPTION ) );
	}
}
