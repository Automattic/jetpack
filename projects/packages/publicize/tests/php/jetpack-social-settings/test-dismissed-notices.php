<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Dismissed Notices functionality.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Dismissed_Notices;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
class Dismissed_Notices_Test extends BaseTestCase {

	/**
	 * Instance of the Dismissed Notices class.
	 *
	 * @var Dismissed_Notices $notices
	 */
	protected $notices;
	/**
	 * Initialize tests
	 *
	 * @before
	 */
	public function set_up() {
		add_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		$this->notices = new Dismissed_Notices();
		$this->notices->register();
	}

	/**
	 * Tear down
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		remove_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Mock Publicize being active.
	 *
	 * @return array
	 */
	public function mock_publicize_being_active() {
		return array( 'publicize' );
	}

	/**
	 * Test that the option is registered.
	 */
	public function test_option_is_registered() {
		$this->assertArrayHasKey( $this->notices::DISMISSED_NOTICES_OPTION, get_registered_settings() );
	}

	/**
	 * Test that getter returns option
	 */
	public function test_getter_returns_option_default_value() {
		$this->assertEquals( array(), $this->notices->get_dismissed_notices() );
	}

	/**
	 * Test the notice is dismissed.
	 */
	public function test_notice_is_dismissed() {
		$dismissed_notices = array(
			'instagram' => 0,
		);
		$this->notices->update_dismissed_notices( true, $this->notices::DISMISSED_NOTICES_OPTION, $dismissed_notices );
		$this->assertEquals( array( 'instagram' => 0 ), get_option( $this->notices::DISMISSED_NOTICES_OPTION ) );
	}

	/**
	 * Test that multiple notices are dismissed.
	 */
	public function test_multiple_notices_are_dismissed() {
		$this->notices->update_dismissed_notices(
			true,
			$this->notices::DISMISSED_NOTICES_OPTION,
			array(
				'instagram' => 0,
			)
		);

		$this->notices->update_dismissed_notices(
			true,
			$this->notices::DISMISSED_NOTICES_OPTION,
			array(
				'advanced-upgrade-nudge-admin' => 0,
			)
		);
		$this->assertEquals(
			array(
				'instagram'                    => 0,
				'advanced-upgrade-nudge-admin' => 0,
			),
			get_option( $this->notices::DISMISSED_NOTICES_OPTION )
		);
	}
}
