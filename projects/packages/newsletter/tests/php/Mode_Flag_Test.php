<?php
/**
 * Tests for the Newsletter Mode enabled flag.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use Automattic\Jetpack\Newsletter\Mode_REST_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The mode is gated by availability and then a plain per-site option.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Flag_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'mode_flag_admin',
				'user_pass'  => 'password',
				'user_email' => 'mode_flag_admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $user_id );
		delete_option( Mode::OPTION_NAME );
		remove_action( 'rest_api_init', array( Mode_REST_Controller::class, 'register_routes' ) );
		$this->reset_initialized_state();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		delete_option( Mode::OPTION_NAME );
		remove_action( 'rest_api_init', array( Mode_REST_Controller::class, 'register_routes' ) );
		$this->reset_initialized_state();

		parent::tear_down();
	}

	/**
	 * The dark-launch availability gate wins over the stored option.
	 */
	public function test_unavailable_mode_is_never_enabled() {
		update_option( Mode::OPTION_NAME, true );

		$this->assertFalse( Mode::is_available() );
		$this->assertFalse( Mode::is_enabled() );
	}

	/**
	 * Once available, the stored option controls the enabled state.
	 */
	public function test_available_mode_reads_the_stored_option() {
		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		$this->assertTrue( Mode::is_available() );
		$this->assertFalse( Mode::is_enabled() );

		update_option( Mode::OPTION_NAME, true );

		$this->assertTrue( Mode::is_enabled() );
	}

	/**
	 * Initialization remains inert while the temporary feature sticker is off.
	 */
	public function test_init_does_not_register_hooks_when_unavailable() {
		Mode::init();

		$this->assertFalse(
			has_action( 'rest_api_init', array( Mode_REST_Controller::class, 'register_routes' ) )
		);
	}

	/**
	 * Initialization registers mode hooks once the feature sticker is on.
	 */
	public function test_init_registers_hooks_when_available() {
		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		Mode::init();

		$this->assertSame(
			10,
			has_action( 'rest_api_init', array( Mode_REST_Controller::class, 'register_routes' ) )
		);
	}

	/**
	 * Reset the idempotence guard between tests.
	 *
	 * @return void
	 */
	private function reset_initialized_state() {
		$initialized = new \ReflectionProperty( Mode::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, false );
	}
}
