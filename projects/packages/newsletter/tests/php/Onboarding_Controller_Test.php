<?php
/**
 * Tests for the Newsletter onboarding controller.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Onboarding_Controller;
use Automattic\Jetpack\Newsletter\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Test class for Onboarding_Controller.
 *
 * @covers \Automattic\Jetpack\Newsletter\Onboarding_Controller
 */
#[CoversClass( Onboarding_Controller::class )]
class Onboarding_Controller_Test extends BaseTestCase {

	/**
	 * Registered controller under test.
	 *
	 * @var Onboarding_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		\Automattic\Jetpack\Constants::clear_constants();
		\Automattic\Jetpack\Status\Cache::clear();
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Settings::OVERVIEW_FEATURE_FLAG );
		add_filter( 'jetpack_feature_flag_enabled_' . Settings::OVERVIEW_FEATURE_FLAG, '__return_true' );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		$this->controller = new Onboarding_Controller();
		add_action(
			'rest_api_init',
			function () {
				( new \WP_REST_Settings_Controller() )->register_routes();
			}
		);
	}

	private function create_user( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_onboarding_' . $role . '_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'newsletter-onboarding-' . $role . '-' . wp_rand() . '@example.com',
				'role'       => $role,
			)
		);

		if ( is_wp_error( $user_id ) ) {
			$this->fail( $user_id->get_error_message() );
		}

		return $user_id;
	}

	public function tear_down() {
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			delete_option( Onboarding_Controller::get_option_name( $step_id ) );
		}
		delete_option( Onboarding_Controller::FIELD_NAME );
		unregister_setting( 'general', Onboarding_Controller::FIELD_NAME );
		remove_filter( 'rest_pre_get_setting', array( Onboarding_Controller::class, 'get_rest_setting' ) );
		remove_filter( 'rest_pre_update_setting', array( Onboarding_Controller::class, 'update_rest_setting' ) );
		remove_filter( 'rest_request_after_callbacks', array( Onboarding_Controller::class, 'filter_rest_response' ) );
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Settings::OVERVIEW_FEATURE_FLAG );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_get_projects_existing_site_options_in_canonical_order_without_creating_defaults() {
		add_option( Onboarding_Controller::get_option_name( 'send_newsletter' ), true, '', false );
		add_option( Onboarding_Controller::get_option_name( 'subscribe_form' ), true, '', false );

		$this->assertSame( array( 'subscribe_form', 'send_newsletter' ), Onboarding_Controller::get_skipped_steps() );
		$this->assertFalse( get_option( Onboarding_Controller::FIELD_NAME, false ) );
		$this->assertFalse( get_option( Onboarding_Controller::get_option_name( 'subscribers' ), false ) );
	}

	public function test_add_is_add_only_idempotent_and_stores_individual_site_options() {
		$this->assertSame( array( 'subscribe_form', 'subscribers' ), Onboarding_Controller::add_skipped_steps( array( 'subscribers', 'subscribe_form' ) ) );
		$this->assertSame( array( 'subscribe_form', 'subscribers' ), Onboarding_Controller::add_skipped_steps( array( 'subscribers', 'subscribe_form' ) ) );

		foreach ( array( 'subscribe_form', 'subscribers' ) as $step_id ) {
			$this->assertTrue( (bool) get_option( Onboarding_Controller::get_option_name( $step_id ) ) );
		}
		$this->assertFalse( get_option( Onboarding_Controller::FIELD_NAME, false ) );
	}

	public function test_empty_add_is_a_noop_and_does_not_clear_existing_skips() {
		add_option( Onboarding_Controller::get_option_name( 'subscribers' ), true, '', false );

		$this->assertSame( array( 'subscribers' ), Onboarding_Controller::add_skipped_steps( array() ) );
		$this->assertTrue( (bool) get_option( Onboarding_Controller::get_option_name( 'subscribers' ) ) );
	}

	public function test_rejects_invalid_or_malformed_ids_before_writing_any_options() {
		foreach ( array( array( 'subscribe_form', 'start' ), array( 'subscribe_form', 7 ), 'subscribe_form', array( 'subscribe_form' => 'subscribers' ) ) as $invalid ) {
			$result = Onboarding_Controller::add_skipped_steps( $invalid );
			$this->assertInstanceOf( WP_Error::class, $result );
			foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
				$this->assertFalse( get_option( Onboarding_Controller::get_option_name( $step_id ), false ) );
			}
		}
	}

	public function test_register_fields_skips_simple_sites_and_disabled_overview_flag() {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		\Automattic\Jetpack\Status\Cache::clear();
		$this->controller->register_fields();
		$this->assertArrayNotHasKey( Onboarding_Controller::FIELD_NAME, get_registered_settings() );

		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', false );
		\Automattic\Jetpack\Status\Cache::clear();
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Settings::OVERVIEW_FEATURE_FLAG );
		$this->controller->register_fields();
		$this->assertArrayNotHasKey( Onboarding_Controller::FIELD_NAME, get_registered_settings() );
	}

	public function test_rest_settings_field_reads_and_writes_the_projection() {
		$user_id = $this->create_user( 'administrator' );
		wp_set_current_user( $user_id );
		$this->controller->register_fields();
		do_action( 'rest_api_init' );

		$get_response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/settings' ) );
		$this->assertSame( 200, $get_response->get_status() );
		$this->assertSame( array(), $get_response->get_data()[ Onboarding_Controller::FIELD_NAME ] );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( Onboarding_Controller::FIELD_NAME => array( 'send_newsletter', 'subscribers' ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'subscribers', 'send_newsletter' ), $response->get_data()[ Onboarding_Controller::FIELD_NAME ] );
		$this->assertSame( array( 'subscribers', 'send_newsletter' ), Onboarding_Controller::get_skipped_steps() );
		$this->assertFalse( get_option( Onboarding_Controller::FIELD_NAME, false ) );
	}

	public function test_rest_settings_field_rejects_start_and_non_admin_writes() {
		$admin_id = $this->create_user( 'administrator' );
		wp_set_current_user( $admin_id );
		$this->controller->register_fields();
		do_action( 'rest_api_init' );

		$invalid = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$invalid->set_body_params( array( Onboarding_Controller::FIELD_NAME => array( 'start' ) ) );
		$this->assertSame( 400, rest_get_server()->dispatch( $invalid )->get_status() );

		$subscriber_id = $this->create_user( 'subscriber' );
		wp_set_current_user( $subscriber_id );
		$unauthorized = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$unauthorized->set_body_params( array( Onboarding_Controller::FIELD_NAME => array( 'subscribe_form' ) ) );
		$this->assertSame( 403, rest_get_server()->dispatch( $unauthorized )->get_status() );
		$this->assertFalse( get_option( Onboarding_Controller::get_option_name( 'subscribe_form' ), false ) );
	}
}
