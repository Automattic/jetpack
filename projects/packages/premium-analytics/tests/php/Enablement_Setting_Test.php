<?php
/**
 * Tests for Enablement_Setting.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Enablement_Setting
 */
#[CoversClass( Enablement_Setting::class )]
class Enablement_Setting_Test extends BaseTestCase {

	const ROUTE = '/wp/v2/settings';

	/**
	 * Stand up a REST server with core's settings route and the package's setting on it.
	 *
	 * Sibling test classes strip `rest_api_init` on teardown, which takes core's own
	 * create_initial_rest_routes() with it for the rest of the process, so the settings route is
	 * stood up by hand here rather than left to the ambient hook.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Enablement_Setting::class, 'register' ) );
		add_action( 'rest_api_init', array( $this, 'register_core_settings_route' ), 99 );
		do_action( 'rest_api_init' );
	}

	/**
	 * Register core's settings route, at the priority core itself uses.
	 *
	 * @return void
	 */
	public function register_core_settings_route() {
		( new \WP_REST_Settings_Controller() )->register_routes();
	}

	/**
	 * Drop the option and everything the test hooked up.
	 */
	public function tear_down() {
		delete_option( Enablement_Setting::ENABLED_OPTION );
		unregister_setting( 'general', Enablement_Setting::ENABLED_OPTION );
		remove_all_filters( 'jetpack_premium_analytics_enabled' );
		remove_action( 'rest_api_init', array( Enablement_Setting::class, 'register' ) );
		remove_action( 'rest_api_init', array( $this, 'register_core_settings_route' ), 99 );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Make the current user an administrator.
	 *
	 * @return int User ID.
	 */
	private function log_in_as_admin(): int {
		return $this->log_in_as( 'administrator' );
	}

	/**
	 * Log in as a user holding a given role.
	 *
	 * @param string $role Role to grant.
	 * @return int User ID.
	 */
	private function log_in_as( string $role ): int {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'pa-' . $role,
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Read the site settings.
	 *
	 * @return \WP_REST_Response
	 */
	private function get_settings() {
		return rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );
	}

	/**
	 * Write the opt-in through the site settings.
	 *
	 * @param bool $enabled Value to send.
	 * @return \WP_REST_Response
	 */
	private function post_enabled( bool $enabled ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( Enablement_Setting::ENABLED_OPTION, $enabled );

		return rest_get_server()->dispatch( $request );
	}

	public function test_the_opt_in_is_exposed_as_a_site_setting() {
		$this->log_in_as_admin();

		$response = $this->get_settings();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( Enablement_Setting::ENABLED_OPTION, $response->get_data() );
	}

	public function test_get_reports_disabled_when_the_site_has_not_opted_in() {
		$this->log_in_as_admin();

		$this->assertFalse( $this->get_settings()->get_data()[ Enablement_Setting::ENABLED_OPTION ] );
	}

	public function test_get_reports_the_stored_opt_in() {
		$this->log_in_as_admin();
		update_option( Enablement_Setting::ENABLED_OPTION, 1 );

		$this->assertTrue( $this->get_settings()->get_data()[ Enablement_Setting::ENABLED_OPTION ] );
	}

	/**
	 * Guards against reinstating the effective-value read this route used to do. The filter is the
	 * host's, and nothing in this package consults it, so the assertion only fails if someone
	 * teaches the setting to answer with an override again.
	 */
	public function test_get_reports_the_opt_in_not_an_override() {
		$this->log_in_as_admin();
		add_filter( 'jetpack_premium_analytics_enabled', '__return_true' );

		$this->assertFalse( $this->get_settings()->get_data()[ Enablement_Setting::ENABLED_OPTION ] );
		$this->assertFalse( (bool) get_option( Enablement_Setting::ENABLED_OPTION ) );
	}

	public function test_post_enables_the_dashboard_by_writing_the_option() {
		$this->log_in_as_admin();

		$response = $this->post_enabled( true );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()[ Enablement_Setting::ENABLED_OPTION ] );
		$this->assertTrue( (bool) get_option( Enablement_Setting::ENABLED_OPTION ) );
	}

	public function test_post_disables_the_dashboard_by_writing_the_option() {
		$this->log_in_as_admin();
		update_option( Enablement_Setting::ENABLED_OPTION, 1 );

		$response = $this->post_enabled( false );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()[ Enablement_Setting::ENABLED_OPTION ] );
		$this->assertFalse( (bool) get_option( Enablement_Setting::ENABLED_OPTION ) );
	}

	/**
	 * The same guard on the write path, which core answers by re-reading the setting: the response
	 * has to describe the opt-in that was just written, not an override sitting over it.
	 */
	public function test_post_reports_what_it_wrote_under_an_override() {
		$this->log_in_as_admin();
		add_filter( 'jetpack_premium_analytics_enabled', '__return_true' );

		$response = $this->post_enabled( false );

		$this->assertFalse( $response->get_data()[ Enablement_Setting::ENABLED_OPTION ] );
		$this->assertFalse( (bool) get_option( Enablement_Setting::ENABLED_OPTION ) );
	}

	/**
	 * Switching off must not store `''`: the REST schema rejects it as a boolean, so a disabled
	 * site would read back as `null`. WorDBless keeps PHP types through the options table where
	 * MySQL does not, so this pins the sanitiser rather than the round trip.
	 */
	public function test_the_opt_in_is_stored_as_an_integer() {
		$this->assertSame( 1, Enablement_Setting::sanitize_enabled( true ) );
		$this->assertSame( 0, Enablement_Setting::sanitize_enabled( false ) );
		$this->assertSame( 0, Enablement_Setting::sanitize_enabled( 'false' ) );
	}

	public function test_reads_are_rejected_for_an_anonymous_caller() {
		$this->assertSame( 401, $this->get_settings()->get_status() );
	}

	public function test_writes_are_rejected_for_an_anonymous_caller() {
		$this->assertSame( 401, $this->post_enabled( true )->get_status() );
		$this->assertFalse( (bool) get_option( Enablement_Setting::ENABLED_OPTION ) );
	}

	public function test_writes_are_rejected_for_a_user_who_cannot_manage_options() {
		$this->log_in_as( 'editor' );

		$this->assertSame( 403, $this->post_enabled( true )->get_status() );
		$this->assertFalse( (bool) get_option( Enablement_Setting::ENABLED_OPTION ) );
	}

	/**
	 * Both hosts may register, so a second call has to leave a single, unchanged declaration.
	 */
	public function test_register_is_idempotent() {
		Enablement_Setting::register();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentional: testing that a second call is a no-op.
		Enablement_Setting::register();

		$registered = get_registered_settings();

		$this->assertArrayHasKey( Enablement_Setting::ENABLED_OPTION, $registered );
		$this->assertSame( 'boolean', $registered[ Enablement_Setting::ENABLED_OPTION ]['type'] );
		$this->assertTrue( $registered[ Enablement_Setting::ENABLED_OPTION ]['show_in_rest'] );
	}
}
