<?php
/**
 * Tests for the AI Launchpad no-CLI test-enable handler.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

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
	 * With neither param present the handler does nothing and returns no redirect.
	 */
	public function test_no_params_is_a_noop() {
		$this->login_as( 'administrator' );

		$this->assertSame( AI_Launchpad_Dev_Enable::REDIRECT_NONE, AI_Launchpad_Dev_Enable::handle() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_enabled' ) );
	}

	/**
	 * A non-admin cannot enable the feature even with the param present.
	 */
	public function test_non_admin_cannot_enable() {
		$this->login_as( 'subscriber' );
		$_GET['enable-ai-launchpad'] = '1';

		$this->assertSame( AI_Launchpad_Dev_Enable::REDIRECT_NONE, AI_Launchpad_Dev_Enable::handle() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_enabled' ) );
	}

	/**
	 * `?enable-ai-launchpad=1` sets the per-site option and routes to the page.
	 */
	public function test_enable_sets_the_option() {
		$this->login_as( 'administrator' );
		$_GET['enable-ai-launchpad'] = '1';

		$this->assertSame( AI_Launchpad_Dev_Enable::REDIRECT_PAGE, AI_Launchpad_Dev_Enable::handle() );
		$this->assertSame( 1, get_option( 'wpcom_ai_launchpad_enabled' ) );
	}

	/**
	 * `?enable-ai-launchpad=0` removes the option and routes to the dashboard
	 * (not the now-inaccessible launchpad page).
	 */
	public function test_enable_zero_deletes_the_option() {
		$this->login_as( 'administrator' );
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		$_GET['enable-ai-launchpad'] = '0';

		$this->assertSame( AI_Launchpad_Dev_Enable::REDIRECT_DASHBOARD, AI_Launchpad_Dev_Enable::handle() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_enabled' ) );
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
