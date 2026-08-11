<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionMethod;

/**
 * Unit tests for the pre-connection pricing screen.
 *
 * @package automattic/jetpack-stats-admin
 */
class Pricing_Page_Test extends Stats_TestCase {
	/**
	 * Odyssey scopes all of its CSS to a fixed set of mount markers, so a class outside that
	 * set leaves the screen unstyled.
	 */
	public function test_render_mounts_under_the_odyssey_scope() {
		$this->expectOutputRegex( '/<div id="jp-stats-pricing" class="jp-stats-pricing">/i' );
		( new Pricing_Page() )->render();
	}

	/**
	 * The screen shares the dashboard's menu slug, so a bookmark and the plugin action link
	 * stay valid once the site connects and the dashboard takes the slug over.
	 */
	public function test_menu_registers_under_the_dashboard_slug() {
		$GLOBALS['menu'] = array();
		$this->become_admin();

		( new Pricing_Page() )->add_wp_admin_menu();

		$this->assertContains( Pricing_Page::PAGE_SLUG, array_column( $GLOBALS['menu'], 2 ) );
	}

	/**
	 * The route is registered from `init_hooks()`, which only runs on a site with no
	 * connection — the one state where the screen has to record anything.
	 */
	public function test_choice_route_is_registered() {
		( new Pricing_Page() )->init_hooks();

		// Registering anywhere but on this action is what WordPress warns about, so drive the
		// hook rather than the method: that covers the wiring as well as the route itself.
		do_action( 'rest_api_init' );

		$this->assertArrayHasKey(
			'/jetpack/v4/stats-app/pricing-choice',
			rest_get_server()->get_routes()
		);
	}

	/**
	 * WordPress.com identifies the site by its suffix during a siteless checkout, and the free
	 * plan needs somewhere to send the visitor. Neither can be recovered later in JavaScript.
	 */
	public function test_config_data_carries_what_the_calls_to_action_need() {
		$config = $this->get_config_data();

		$this->assertNotEmpty( $config['site_suffix'] );
		$this->assertStringContainsString( 'page=my-jetpack', $config['connect_url'] );
		$this->assertStringContainsString( 'page=stats', $config['stats_url'] );
	}

	/**
	 * The screen runs before the site has a blog ID, so shipping the key at all would hand the
	 * app a value it must not trust.
	 */
	public function test_config_data_omits_connection_only_keys() {
		$config = $this->get_config_data();

		$this->assertArrayNotHasKey( 'blog_id', $config );
		$this->assertArrayNotHasKey( 'intial_state', $config );
	}

	/**
	 * A site that has never been offered the choice must still get the dashboard's own pricing
	 * grid once it connects, so the flag has to start unset.
	 */
	public function test_no_choice_is_recorded_by_default() {
		$this->assertFalse( Pricing_Page::has_recorded_choice() );
	}

	/**
	 * The whole point of the flag: a visitor who answered here is not asked again after the
	 * site connects.
	 */
	public function test_recording_a_choice_persists() {
		Pricing_Page::mark_choice_recorded();

		$this->assertTrue( Pricing_Page::has_recorded_choice() );
	}

	/**
	 * The dashboard reads the flag from its config payload, so a recorded choice has to reach
	 * it there rather than only living in the database.
	 */
	public function test_config_data_reports_a_recorded_choice() {
		$this->assertFalse( ( new Odyssey_Config_Data() )->get_pricing_data()['stats_pricing_choice_recorded'] );

		Pricing_Page::mark_choice_recorded();

		$this->assertTrue( ( new Odyssey_Config_Data() )->get_pricing_data()['stats_pricing_choice_recorded'] );
	}

	/**
	 * Recording a choice writes an option, so it cannot be open to any visitor.
	 */
	public function test_recording_is_denied_to_a_logged_out_visitor() {
		wp_set_current_user( 0 );

		$this->assertFalse( ( new Pricing_Page() )->can_record_choice() );
	}

	/**
	 * The counterpart: whoever can reach the screen must be able to answer it, or the choice
	 * is silently dropped for every real user and the grid returns after connecting.
	 */
	public function test_recording_is_allowed_for_an_administrator() {
		$this->become_admin();

		$this->assertTrue( ( new Pricing_Page() )->can_record_choice() );
	}

	/**
	 * A visitor who cannot manage the site has no business changing its onboarding state.
	 */
	public function test_recording_is_denied_to_a_subscriber() {
		$subscriber = wp_insert_user(
			array(
				'user_login' => 'pricing_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber );

		$this->assertFalse( ( new Pricing_Page() )->can_record_choice() );
	}

	/**
	 * Sign in as an administrator.
	 *
	 * `add_menu_page()` and the permission callback both check capabilities, so the tests that
	 * exercise them need a real user rather than the default logged-out state.
	 *
	 * @return int The user id.
	 */
	private function become_admin() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'pricing_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		return $admin_id;
	}

	/**
	 * Read the screen's protected config builder.
	 *
	 * @return array
	 */
	private function get_config_data() {
		$method = new ReflectionMethod( Pricing_Page::class, 'get_config_data' );

		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( new Pricing_Page() );
	}
}
