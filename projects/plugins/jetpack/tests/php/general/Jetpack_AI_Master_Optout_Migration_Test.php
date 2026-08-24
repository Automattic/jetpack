<?php
/**
 * Tests for the Jetpack AI master-switch opt-out migration.
 *
 * When the `ai` module becomes the site-wide master switch off WordPress.com
 * Simple, it is "Auto Activate: Yes", so activate_new_modules() turns it on for
 * connected sites on upgrade — the desired default-on / auto-enable behavior.
 * The one thing that must not happen is silently re-enabling AI on a site that
 * had explicitly opted out (the jetpack_ai_enabled option present and falsey).
 * {@see Jetpack::reconcile_ai_master_optout()} runs at a later init priority than
 * the auto-activation and deactivates the module for exactly those sites.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Jetpack_AI_Master_Optout_Migration_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_AI_Master_Optout_Migration_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the platform, the migration guard, the option, and module state.
	 */
	public function tear_down() {
		delete_option( 'jetpack_ai_enabled' );
		delete_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION );
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );

		parent::tear_down();
	}

	/**
	 * Put the site off-Simple with the `ai` module already auto-activated, as
	 * activate_new_modules() would leave it on upgrade.
	 */
	private function set_up_auto_activated_off_simple() {
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );
		$this->assertTrue( ( new Modules() )->is_active( 'ai' ), 'Precondition: the module is auto-activated.' );
	}

	/**
	 * THE safety property: a site that explicitly opted out (option present and
	 * falsey) ends with the module INACTIVE, even though auto-activation turned it
	 * on first. Reconciliation runs after auto-activation and has the final word.
	 */
	public function test_explicit_optout_survives_auto_activation() {
		update_option( 'jetpack_ai_enabled', 0 );
		$this->set_up_auto_activated_off_simple();

		Jetpack::reconcile_ai_master_optout();

		$this->assertFalse(
			( new Modules() )->is_active( 'ai' ),
			'An explicit opt-out must survive the module becoming the master: the module ends inactive.'
		);
	}

	/**
	 * The same safety property, but with the module activated through the REAL path
	 * Modules::update_active() (as activate_default_modules() does on upgrade), which
	 * fires jetpack_activate_module_ai. The seed-active_modules-directly tests never
	 * exercise that hook: this guards against any module-activation side effect
	 * overwriting the jetpack_ai_enabled opt-out before reconcile reads it.
	 */
	public function test_explicit_optout_survives_auto_activation_via_module_hook() {
		Constants::set_constant( 'IS_WPCOM', false );
		update_option( 'jetpack_ai_enabled', 0 );

		// Auto-activation, the way the upgrade routine really does it.
		( new Modules() )->update_active( array( 'ai' ) );

		Jetpack::reconcile_ai_master_optout();

		$this->assertFalse(
			( new Modules() )->is_active( 'ai' ),
			'An explicit opt-out must survive auto-activation run through the module hook.'
		);
	}

	/**
	 * An absent option means no explicit opt-out, so auto-activation is preserved
	 * (default-on / auto-enable-on-connection).
	 */
	public function test_absent_option_leaves_module_active() {
		delete_option( 'jetpack_ai_enabled' );
		$this->set_up_auto_activated_off_simple();

		Jetpack::reconcile_ai_master_optout();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ), 'No opt-out: auto-activation is preserved.' );
	}

	/**
	 * A truthy option is not an opt-out, so the module stays active.
	 */
	public function test_truthy_option_leaves_module_active() {
		update_option( 'jetpack_ai_enabled', 1 );
		$this->set_up_auto_activated_off_simple();

		Jetpack::reconcile_ai_master_optout();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
	}

	/**
	 * The migration runs once. After it has reconciled an opt-out, a later
	 * re-enable of the module is not reverted on a subsequent run — the guard
	 * blocks it, so a now-stale falsey option can't keep turning AI back off.
	 */
	public function test_migration_is_idempotent_and_guarded() {
		update_option( 'jetpack_ai_enabled', 0 );
		$this->set_up_auto_activated_off_simple();

		Jetpack::reconcile_ai_master_optout();
		$this->assertFalse( ( new Modules() )->is_active( 'ai' ), 'First run deactivates the opted-out module.' );
		$this->assertTrue( (bool) get_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION ), 'The guard flag is set.' );

		// The user turns AI back on (the module), while the old option is still falsey.
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );

		Jetpack::reconcile_ai_master_optout();

		$this->assertTrue(
			( new Modules() )->is_active( 'ai' ),
			'A second run is a no-op: the guard prevents re-deactivating a module the user re-enabled.'
		);
	}

	/**
	 * On WordPress.com Simple the option stays the master and modules do not run,
	 * so the reconciliation is a no-op: it must not touch module state.
	 */
	public function test_no_op_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( 'jetpack_ai_enabled', 0 );
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );

		Jetpack::reconcile_ai_master_optout();

		$this->assertContains(
			'ai',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'On Simple the migration leaves active_modules untouched.'
		);
	}

	/**
	 * The one-shot must not be consumed while the module is inactive.
	 *
	 * This ran on the alpha train before module auto-activation understood prerelease versions:
	 * `ai` declares `First Introduced: 16.2` and version_compare() sorts `16.2-a.1` below `16.2`,
	 * so the module could not auto-activate, yet this method still ran at init:20, found nothing to
	 * do, and marked the migration complete. Once auto-activation was fixed the module would turn
	 * on with the migration already spent, and an explicit opt-out would be silently overridden.
	 */
	public function test_migration_flag_is_not_consumed_while_the_module_is_inactive() {
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );
		update_option( 'jetpack_ai_enabled', 0 );

		Jetpack::reconcile_ai_master_optout();

		$this->assertFalse(
			get_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION, false ),
			'The migration must stay pending until the module is genuinely active.'
		);
	}

	/**
	 * The companion: once the module really is active, the opt-out is honored and the one-shot is
	 * spent. Together with the test above this pins the ordering the guard depends on.
	 */
	public function test_optout_is_honoured_on_the_upgrade_that_activates_the_module() {
		$this->set_up_auto_activated_off_simple();
		update_option( 'jetpack_ai_enabled', 0 );

		Jetpack::reconcile_ai_master_optout();

		$this->assertNotContains(
			'ai',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'The opt-out is honored on the upgrade that activates the module.'
		);
		$this->assertTrue(
			(bool) get_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION ),
			'And the one-shot is spent at that point, not before.'
		);
	}

	/**
	 * A module reported active only by a filter - the jetpack-mu-wpcom stopgap does exactly this on
	 * Atomic - must not spend the one-shot either, since the module is not really on.
	 */
	public function test_migration_flag_is_not_consumed_by_a_filter_reported_module() {
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );
		update_option( 'jetpack_ai_enabled', 0 );

		$stopgap = function ( $modules ) {
			$modules[] = 'ai';
			return array_unique( $modules );
		};
		add_filter( 'jetpack_active_modules', $stopgap );

		Jetpack::reconcile_ai_master_optout();

		remove_filter( 'jetpack_active_modules', $stopgap );

		$this->assertFalse(
			get_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION, false ),
			'A filter reporting the module active must not spend the migration.'
		);
	}

	/**
	 * The ordering contract, locked against the *production* registration (not a
	 * priority hand-picked in the test): reconcile_ai_master_optout must be hooked
	 * to run at a LATER init priority than activate_new_modules. Auto-activation
	 * turns the module on; reconcile then deactivates it for an opted-out site — a
	 * lower priority would let auto-activation win and silently re-enable AI.
	 */
	public function test_reconcile_hooked_after_activate_new_modules_on_upgrade() {
		// Call the production registration directly — plugin_upgrade()'s guards (the
		// upgrade lock, held across tests under wpcomsh's persistent cache) make it
		// unreliable to trigger in the full suite.
		Jetpack::register_upgrade_init_hooks();

		$activate_priority  = has_action( 'init', array( 'Jetpack', 'activate_new_modules' ) );
		$reconcile_priority = has_action( 'init', array( 'Jetpack', 'reconcile_ai_master_optout' ) );

		$this->assertNotFalse( $activate_priority, 'activate_new_modules is registered on init.' );
		$this->assertNotFalse( $reconcile_priority, 'reconcile_ai_master_optout is registered on init.' );
		$this->assertGreaterThan(
			$activate_priority,
			$reconcile_priority,
			'reconcile_ai_master_optout must run at a later init priority than activate_new_modules.'
		);
	}
}
