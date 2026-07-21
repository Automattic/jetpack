<?php
/**
 * Tests for the Social_Admin_Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Tests for Social_Admin_Page.
 */
class Social_Admin_Page_Test extends BaseTestCase {
	/**
	 * Flag to assert that a plan refresh was triggered.
	 *
	 * @var bool
	 */
	protected $refresh_called = false;

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		Jetpack_Options::update_option( 'id', 123 );
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_plan_request' ), 10, 3 );
		add_filter( 'jetpack_social_should_refresh_plan_data', array( $this, 'capture_refresh_attempt' ) );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_plan_request' ), 10 );
		remove_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ), 10 );
		remove_filter( 'jetpack_social_should_refresh_plan_data', array( $this, 'capture_refresh_attempt' ) );

		unset( $_GET['refresh_plan_data'], $_GET['_wpnonce'] );
		$this->refresh_called = false;
		Jetpack_Options::delete_option( 'id' );

		if ( $this->admin_id ) {
			wp_delete_user( $this->admin_id );
		}

		parent::tear_down();
	}

	/**
	 * Mock WPCOM plan request to avoid outbound calls.
	 *
	 * @param mixed  $preempt Whether to preempt the request.
	 * @param array  $args    Request args.
	 * @param string $url     Request URL.
	 * @return array Mocked HTTP response.
	 */
	public function mock_wpcom_plan_request( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->refresh_called = true;

		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'plan'     => array( 'product_slug' => 'jetpack_free' ),
					'products' => array(),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
			),
			'headers'  => array(),
			'cookies'  => array(),
		);
	}

	/**
	 * Capture refresh attempts while allowing tests to short-circuit.
	 *
	 * @return bool
	 */
	public function capture_refresh_attempt() {
		$this->refresh_called = true;
		return false;
	}

	/**
	 * Custom wp_die handler for assertions.
	 *
	 * @return callable
	 */
	public function throw_on_wp_die() {
		/**
		 * Custom wp_die handler that throws an exception to allow assertions on wp_die calls.
		 *
		 * @param string|\Stringable $message Error message passed to wp_die.
		 *
		 * @return never
		 *
		 * @throws \Exception When invoked for assertions.
		 */
		return static function ( $message ) {
			throw new \Exception( esc_html( $message ) );
		};
	}

	/**
	 * It refreshes plan data when the nonce is valid.
	 */
	public function test_admin_init_refreshes_plan_with_valid_nonce() {
		$_GET['refresh_plan_data']     = '1';
		$_REQUEST['refresh_plan_data'] = '1';
		$_REQUEST['_wpnonce']          = wp_create_nonce( Social_Admin_Page::REFRESH_PLAN_NONCE_ACTION );
		$_GET['_wpnonce']              = $_REQUEST['_wpnonce'];

		Social_Admin_Page::init()->admin_init();

		$this->assertTrue( $this->refresh_called );
	}

	/**
	 * Modernization now defaults ON, so with the wp-build chassis available and no
	 * filter overriding the default, the legacy admin script is NOT enqueued — the
	 * wp-build dashboard owns the page.
	 */
	public function test_enqueue_skips_legacy_script_by_default() {
		// Define the wp-build render fn in the GLOBAL namespace (via fixture) so
		// is_wp_build_dashboard_active()'s function_exists() check passes. No
		// modernization filter is set, so this exercises the new default-on behavior.
		require_once __DIR__ . '/fixtures/wp-build-render-fn.php';

		Social_Admin_Page::init()->enqueue_admin_scripts();

		$this->assertFalse(
			wp_script_is( 'social-admin-page', 'enqueued' ),
			'Legacy script should not be enqueued by default now that modernization is on.'
		);
	}

	/**
	 * When modernization is ON, the legacy admin script is NOT enqueued
	 * (the wp-build chassis owns its own enqueue pipeline).
	 */
	public function test_enqueue_skips_legacy_script_when_modernized() {
		add_filter( Social_Admin_Page::MODERNIZATION_FILTER, '__return_true' );
		// Define the wp-build render fn in the GLOBAL namespace (via fixture) so
		// is_wp_build_dashboard_active()'s function_exists() check passes. A function
		// declared inline in this namespaced test file would land in
		// Automattic\Jetpack\Publicize, which function_exists() (global) won't find.
		require_once __DIR__ . '/fixtures/wp-build-render-fn.php';

		Social_Admin_Page::init()->enqueue_admin_scripts();

		$this->assertFalse(
			wp_script_is( 'social-admin-page', 'enqueued' ),
			'Legacy script should not be enqueued when the wp-build chassis is active.'
		);

		remove_filter( Social_Admin_Page::MODERNIZATION_FILTER, '__return_true' );
	}

	/**
	 * Kill switch: when the modernization filter is forced false, the wp-build
	 * dashboard is inactive even if the chassis render function is defined, so
	 * the legacy admin script IS enqueued (legacy fallback).
	 */
	public function test_enqueue_loads_legacy_script_when_kill_switch_engaged() {
		add_filter( Social_Admin_Page::MODERNIZATION_FILTER, '__return_false' );
		// Define the wp-build render fn in the GLOBAL namespace (via fixture) so
		// is_wp_build_dashboard_active()'s function_exists() check passes. The
		// kill switch must still win, gating the dashboard off despite a loaded
		// chassis.
		require_once __DIR__ . '/fixtures/wp-build-render-fn.php';

		Social_Admin_Page::init()->enqueue_admin_scripts();

		$this->assertTrue(
			wp_script_is( 'social-admin-page', 'enqueued' ),
			'Legacy script should be enqueued when the modernization kill switch is engaged.'
		);

		wp_dequeue_script( 'social-admin-page' );
		wp_deregister_script( 'social-admin-page' );
		remove_filter( Social_Admin_Page::MODERNIZATION_FILTER, '__return_false' );
	}

	/**
	 * It rejects plan refresh when the nonce is missing or invalid.
	 */
	public function test_admin_init_rejects_plan_refresh_without_valid_nonce() {
		$this->expectException( \Exception::class );

		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ), 10 );

		$_GET['refresh_plan_data']     = '1';
		$_REQUEST['refresh_plan_data'] = '1';
		$_REQUEST['_wpnonce']          = 'invalid';
		$_GET['_wpnonce']              = $_REQUEST['_wpnonce'];

		Social_Admin_Page::init()->admin_init();
	}
}
