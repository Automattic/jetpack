<?php
/**
 * Tests for the AI Launchpad no-CLI test-enable handler.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

// class-ai-launchpad-rest.php defines the OPTION_* constants referenced by
// AI_Launchpad_Dev_Enable::RESET_OPTIONS; load it first so the handler file is
// self-contained. Neither file pulls in eligibility.php, so this does not leak
// wpcom_ai_launchpad_is_eligible() into the shared process (which would break
// the REST test's Brain Monkey mock).
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-rest.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-dev-enable.php';

/**
 * Test class for AI_Launchpad_Dev_Enable.
 *
 * @covers \AI_Launchpad_Dev_Enable
 */
#[CoversClass( AI_Launchpad_Dev_Enable::class )]
class AI_Launchpad_Dev_Enable_Test extends \WorDBless\BaseTestCase {
	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $_GET['enable-ai-launchpad'], $_GET['reset-ai-launchpad'] );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Sets the current user to one with or without `manage_options`.
	 *
	 * @param string $role A role granting manage_options ('administrator') or not ('subscriber').
	 */
	private function login_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test_' . wp_rand() . '@example.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * The enablement param sets or deletes the per-site option and routes accordingly — but only
	 * for a `manage_options` user, and only when the param is actually present. Disabling lands on
	 * the dashboard rather than the now-inaccessible launchpad page.
	 *
	 * @dataProvider provide_enable_requests
	 *
	 * @param string      $role             The role of the requesting user.
	 * @param string|null $param            The `enable-ai-launchpad` value, or null to omit the param.
	 * @param bool        $already_enabled  Whether the option is already set going in.
	 * @param string      $expected_target  The expected REDIRECT_* token.
	 * @param mixed       $expected_enabled The expected option value afterwards.
	 */
	#[DataProvider( 'provide_enable_requests' )]
	public function test_handle_enablement( $role, $param, $already_enabled, $expected_target, $expected_enabled ) {
		$this->login_as( $role );
		if ( $already_enabled ) {
			update_option( 'wpcom_ai_launchpad_enabled', 1 );
		}
		if ( null !== $param ) {
			$_GET['enable-ai-launchpad'] = $param;
		}

		$this->assertSame( $expected_target, AI_Launchpad_Dev_Enable::handle() );
		$this->assertSame( $expected_enabled, get_option( 'wpcom_ai_launchpad_enabled' ) );
	}

	/**
	 * Data provider for test_handle_enablement.
	 *
	 * @return array
	 */
	public static function provide_enable_requests() {
		return array(
			'no params is a noop'                => array( 'administrator', null, false, AI_Launchpad_Dev_Enable::REDIRECT_NONE, false ),
			'a non-admin cannot enable'          => array( 'subscriber', '1', false, AI_Launchpad_Dev_Enable::REDIRECT_NONE, false ),
			'enable=1 sets the option'           => array( 'administrator', '1', false, AI_Launchpad_Dev_Enable::REDIRECT_PAGE, 1 ),
			'enable=0 deletes it and lands home' => array( 'administrator', '0', true, AI_Launchpad_Dev_Enable::REDIRECT_DASHBOARD, false ),
		);
	}

	/**
	 * `?reset-ai-launchpad=1` clears the wizard / AI-output / dismissed / status
	 * options while leaving the enablement option untouched.
	 */
	public function test_reset_clears_state_options() {
		$this->login_as( 'administrator' );
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		update_option( 'wpcom_ai_launchpad_wizard', array( 'foo' => 'bar' ) );
		update_option( 'wpcom_ai_launchpad_ai_output', array( 'source' => 'ai' ) );
		update_option( 'wpcom_ai_launchpad_dismissed', 1 );
		update_option( 'launchpad_checklist_tasks_statuses', array( 'x' => true ) );
		$_GET['reset-ai-launchpad'] = '1';

		$this->assertSame( AI_Launchpad_Dev_Enable::REDIRECT_PAGE, AI_Launchpad_Dev_Enable::handle() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_wizard' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_dismissed' ) );
		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
		// Reset leaves enablement alone.
		$this->assertSame( 1, get_option( 'wpcom_ai_launchpad_enabled' ) );
	}
}
