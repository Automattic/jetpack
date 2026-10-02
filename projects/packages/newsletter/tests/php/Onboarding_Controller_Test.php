<?php
/**
 * Tests for the Newsletter onboarding controller.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Onboarding_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Test class for Onboarding_Controller.
 *
 * @covers \Automattic\Jetpack\Newsletter\Onboarding_Controller
 */
#[CoversClass( Onboarding_Controller::class )]
class Onboarding_Controller_Test extends BaseTestCase {

	public function set_up() {
		parent::set_up();

		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			delete_option( Onboarding_Controller::get_option_name( $step_id ) );
		}
		delete_option( Onboarding_Controller::FIELD_NAME );
	}

	public function tear_down() {
		foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
			delete_option( Onboarding_Controller::get_option_name( $step_id ) );
		}
		delete_option( Onboarding_Controller::FIELD_NAME );
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

	public function test_skip_step_validation_accepts_only_a_list_of_supported_ids() {
		$this->assertTrue( Onboarding_Controller::validate_skipped_steps( array( 'subscribe_form', 'subscribers' ) ) );

		foreach ( array( array( 'subscribe_form', 'start' ), array( 'subscribe_form', 7 ), 'subscribe_form', array( 'subscribe_form' => 'subscribers' ) ) as $invalid ) {
			$this->assertInstanceOf( WP_Error::class, Onboarding_Controller::validate_skipped_steps( $invalid ) );
		}
	}

	public function test_add_rejects_invalid_or_malformed_ids_before_writing_any_options() {
		foreach ( array( array( 'subscribe_form', 'start' ), array( 'subscribe_form', 7 ), 'subscribe_form', array( 'subscribe_form' => 'subscribers' ) ) as $invalid ) {
			$result = Onboarding_Controller::add_skipped_steps( $invalid );
			$this->assertInstanceOf( WP_Error::class, $result );
			foreach ( Onboarding_Controller::STEP_IDS as $step_id ) {
				$this->assertFalse( get_option( Onboarding_Controller::get_option_name( $step_id ), false ) );
			}
		}
	}
}
