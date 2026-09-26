<?php
/**
 * Tests for the post-restore DB upgrade check.
 *
 * @package wpcomsh
 */

/**
 * Class RestoreDbUpgradeTest.
 */
class RestoreDbUpgradeTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The real $wp_db_version, restored after each test.
	 *
	 * @var int
	 */
	private $original_db_version;

	/**
	 * Set up.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		global $wp_db_version;
		$this->original_db_version = $wp_db_version;

		set_current_screen( 'dashboard' );
		delete_option( 'wpcomsh_db_upgrade_attempted' );
	}

	/**
	 * Tear down.
	 *
	 * @return void
	 */
	public function tear_down() {
		global $wp_db_version;
		$wp_db_version = $this->original_db_version; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		update_option( 'db_version', $this->original_db_version );
		delete_option( 'wpcomsh_db_upgrade_attempted' );
		delete_option( 'wpcomsh_db_version_before_restore_upgrade' );
		set_current_screen( 'front' );

		parent::tear_down();
	}

	/**
	 * A stale db_version on an admin request should be upgraded.
	 *
	 * @return void
	 */
	public function test_stale_db_version_should_upgrade() {
		update_option( 'db_version', $this->original_db_version - 1 );

		$this->assertTrue( wpcomsh_should_upgrade_db_after_restore() );
	}

	/**
	 * A current db_version is left alone.
	 *
	 * @return void
	 */
	public function test_current_db_version_should_not_upgrade() {
		update_option( 'db_version', $this->original_db_version );

		$this->assertFalse( wpcomsh_should_upgrade_db_after_restore() );
	}

	/**
	 * A db_version ahead of core is left alone rather than walked backwards.
	 *
	 * @return void
	 */
	public function test_db_version_ahead_of_core_should_not_upgrade() {
		update_option( 'db_version', $this->original_db_version + 1 );

		$this->assertFalse( wpcomsh_should_upgrade_db_after_restore() );
	}

	/**
	 * Only one attempt is made per core DB version.
	 *
	 * @return void
	 */
	public function test_previous_attempt_should_not_retry() {
		update_option( 'db_version', $this->original_db_version - 1 );
		update_option( 'wpcomsh_db_upgrade_attempted', $this->original_db_version, false );

		$this->assertFalse( wpcomsh_should_upgrade_db_after_restore() );
	}

	/**
	 * An attempt recorded against an older core release does not block a retry.
	 *
	 * @return void
	 */
	public function test_stale_attempt_marker_should_upgrade() {
		update_option( 'db_version', $this->original_db_version - 2 );
		update_option( 'wpcomsh_db_upgrade_attempted', $this->original_db_version - 1, false );

		$this->assertTrue( wpcomsh_should_upgrade_db_after_restore() );
	}

	/**
	 * Front end requests never trigger the upgrade.
	 *
	 * @return void
	 */
	public function test_front_end_request_should_not_upgrade() {
		update_option( 'db_version', $this->original_db_version - 1 );
		set_current_screen( 'front' );

		$this->assertFalse( wpcomsh_should_upgrade_db_after_restore() );
	}
}
