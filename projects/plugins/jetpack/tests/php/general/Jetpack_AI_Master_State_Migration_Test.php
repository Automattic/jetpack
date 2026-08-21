<?php
/**
 * Tests for the Jetpack AI master-state migration.
 *
 * The first 16.2 alpha did not auto-activate the new `ai` module because its
 * prerelease version compared lower than the module's original stable 16.2
 * introduction boundary. The repair maps the legacy setting to durable module
 * state: explicit opt-outs stay off, while absent or truthy settings turn AI on.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Jetpack_AI_Master_State_Migration_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_AI_Master_State_Migration_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the platform, migration guards, legacy option, connection, and module state.
	 */
	public function tear_down() {
		delete_option( 'jetpack_ai_enabled' );
		delete_option( 'jetpack_ai_master_optout_migrated' );
		delete_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION );
		remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		remove_filter( 'jetpack_is_connection_ready', '__return_false', 1000 );
		remove_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		remove_filter( 'jetpack_offline_mode', '__return_false', 1000 );
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );
		\Jetpack_Options::delete_option( array( 'master_user', 'user_tokens', 'id', 'blog_token' ) );
		( new Connection_Manager( 'jetpack' ) )->reset_connection_status();
		Status_Cache::clear();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Put the site off-Simple, make its connection ready, and set the initial AI module state.
	 *
	 * @param bool $active Whether the AI module starts active.
	 */
	private function set_up_connected_off_simple( $active ) {
		Constants::set_constant( 'IS_WPCOM', false );
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		\Jetpack_Options::update_option( 'active_modules', $active ? array( 'ai' ) : array() );
		$this->set_up_connected_owner();
	}

	/**
	 * Add a connected owner to the current site.
	 */
	private function set_up_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new Connection_Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * An explicit legacy opt-out wins over upgrade auto-activation.
	 */
	public function test_explicit_optout_survives_auto_activation() {
		update_option( 'jetpack_ai_enabled', 0 );
		update_option( 'jetpack_ai_master_optout_migrated', true );
		$this->set_up_connected_off_simple( false );
		( new Modules() )->update_active( array( 'ai' ) );

		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
		$this->assertFalse( (bool) get_option( 'jetpack_ai_master_optout_migrated' ) );
	}

	/**
	 * A missing legacy option means AI was default-on, so the migration repairs an inactive module.
	 */
	public function test_absent_option_activates_module() {
		delete_option( 'jetpack_ai_enabled' );
		$this->set_up_connected_off_simple( false );

		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * A truthy legacy option means AI was enabled, so the migration repairs an inactive module.
	 */
	public function test_truthy_option_activates_module() {
		update_option( 'jetpack_ai_enabled', 1 );
		$this->set_up_connected_off_simple( false );

		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * The first alpha set the old migration guard even when activation was skipped.
	 * That poisoned guard must not suppress the repaired migration.
	 */
	public function test_old_migration_guard_does_not_suppress_repair() {
		update_option( 'jetpack_ai_master_optout_migrated', true );
		$this->set_up_connected_off_simple( false );

		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * A disconnected site remains pending and is repaired after its connection becomes ready.
	 */
	public function test_disconnected_site_retries_after_connection_is_ready() {
		Constants::set_constant( 'IS_WPCOM', false );
		add_filter( 'jetpack_is_connection_ready', '__return_false', 1000 );
		\Jetpack_Options::update_option( 'active_modules', array() );
		$this->set_up_connected_owner();

		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );

		remove_filter( 'jetpack_is_connection_ready', '__return_false', 1000 );
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );

		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * A site-level connection remains pending until a connected owner can use AI.
	 */
	public function test_site_only_connection_retries_after_owner_connects() {
		Constants::set_constant( 'IS_WPCOM', false );
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		\Jetpack_Options::update_option( 'active_modules', array() );

		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );

		$this->set_up_connected_owner();
		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * A legacy opt-out is enforced before an owner connects, but remains pending until then.
	 */
	public function test_site_only_connection_preserves_explicit_optout() {
		Constants::set_constant( 'IS_WPCOM', false );
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		update_option( 'jetpack_ai_enabled', 0 );
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );

		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );

		$this->set_up_connected_owner();
		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * Offline mode remains pending even when connection tokens are present.
	 */
	public function test_offline_site_retries_after_offline_mode_ends() {
		$this->set_up_connected_off_simple( false );
		add_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		Status_Cache::clear();

		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );

		remove_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		add_filter( 'jetpack_offline_mode', '__return_false', 1000 );
		Status_Cache::clear();
		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * A legacy opt-out is enforced in offline mode, but remains pending until offline mode ends.
	 */
	public function test_offline_site_preserves_explicit_optout() {
		update_option( 'jetpack_ai_enabled', 0 );
		$this->set_up_connected_off_simple( true );
		add_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		Status_Cache::clear();

		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );

		remove_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		add_filter( 'jetpack_offline_mode', '__return_false', 1000 );
		Status_Cache::clear();
		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * A failed active-modules write does not complete the migration, allowing a later retry.
	 */
	public function test_failed_module_write_is_retried() {
		$this->set_up_connected_off_simple( false );

		$block_update = static function ( $new_value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_jetpack_active_modules', $block_update, 10, 2 );

		try {
			Jetpack::reconcile_ai_master_state();
		} finally {
			remove_filter( 'pre_update_option_jetpack_active_modules', $block_update, 10 );
		}

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );

		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * After migration, the legacy option cannot override a later module change.
	 */
	public function test_completed_migration_does_not_override_later_module_change() {
		update_option( 'jetpack_ai_enabled', 0 );
		$this->set_up_connected_off_simple( true );

		Jetpack::reconcile_ai_master_state();
		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );

		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );
		Jetpack::reconcile_ai_master_state();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
	}

	/**
	 * A later module opt-out also remains off after an enabled legacy state was migrated.
	 */
	public function test_completed_migration_does_not_override_later_module_optout() {
		update_option( 'jetpack_ai_enabled', 1 );
		$this->set_up_connected_off_simple( false );

		Jetpack::reconcile_ai_master_state();
		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );

		\Jetpack_Options::update_option( 'active_modules', array() );
		Jetpack::reconcile_ai_master_state();

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
	}

	/**
	 * WordPress.com Simple continues to use the legacy option and never migrates module state.
	 */
	public function test_no_op_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( 'jetpack_ai_enabled', 0 );
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );

		Jetpack::reconcile_ai_master_state();

		$this->assertContains( 'ai', (array) \Jetpack_Options::get_option( 'active_modules' ) );
		$this->assertFalse( (bool) get_option( Jetpack::AI_MASTER_STATE_MIGRATED_OPTION ) );
	}

	/**
	 * The next alpha is the one-time activation boundary. Stable 16.2 must not
	 * activate the module again after the repaired migration has completed.
	 */
	public function test_module_activation_version_windows() {
		$this->assertContains( 'ai', Jetpack::get_default_modules( '16.2-a.1', '16.2-a.2' ) );
		$this->assertNotContains( 'ai', Jetpack::get_default_modules( '16.2-a.2', '16.2' ) );
		$this->assertContains( 'ai', Jetpack::get_default_modules( '16.1.2', '16.2' ) );
	}

	/**
	 * Upgrade auto-activation runs before the globally registered state migration.
	 */
	public function test_global_reconcile_runs_after_upgrade_activation() {
		// Upgrade activation and global reconciliation are registered from different production paths.
		Jetpack::register_upgrade_init_hooks();

		$activate_priority  = has_action( 'init', array( 'Jetpack', 'activate_new_modules' ) );
		$reconcile_priority = has_action( 'init', array( 'Jetpack', 'reconcile_ai_master_state' ) );

		$this->assertNotFalse( $activate_priority, 'activate_new_modules is registered on init.' );
		$this->assertSame( 20, $reconcile_priority, 'The migration is registered globally for retries.' );
		$this->assertGreaterThan(
			$activate_priority,
			$reconcile_priority,
			'reconcile_ai_master_state must run after activate_new_modules.'
		);
	}
}
