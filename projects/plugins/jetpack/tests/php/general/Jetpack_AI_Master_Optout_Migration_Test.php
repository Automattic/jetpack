<?php
/**
 * Tests for the Jetpack AI master-switch opt-out migration.
 *
 * When the `ai` module becomes the site-wide master switch off WordPress.com
 * Simple, it is "Auto Activate: Yes", so activate_new_modules() turns it on for
 * connected sites on upgrade — the desired default-on / auto-enable behavior.
 * The one thing that must not happen is silently re-enabling AI on a site that
 * had explicitly opted out (the jetpack_ai_enabled option stored as '0').
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
	 * Store the opt-out the way a site made it before the option was registered: with no
	 * sanitize callback in the way, a falsey write lands as '0'. Once the setting is
	 * registered, rest_sanitize_boolean turns every falsey write into '' instead, so a test
	 * that just called update_option() here would exercise the emptied-row path by mistake.
	 */
	private function store_legacy_optout() {
		remove_all_filters( 'sanitize_option_jetpack_ai_enabled' );
		update_option( 'jetpack_ai_enabled', 0 );
		wp_cache_flush();
		$this->assertSame( '0', get_option( 'jetpack_ai_enabled' ), 'Precondition: a legacy opt-out reads as "0".' );
	}

	/**
	 * THE safety property: a site that explicitly opted out (option present and
	 * falsey) ends with the module INACTIVE, even though auto-activation turned it
	 * on first. Reconciliation runs after auto-activation and has the final word.
	 */
	public function test_explicit_optout_survives_auto_activation() {
		$this->store_legacy_optout();
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
		$this->store_legacy_optout();

		// Auto-activation, the way the upgrade routine really does it.
		( new Modules() )->update_active( array( 'ai' ) );

		Jetpack::reconcile_ai_master_optout();

		$this->assertFalse(
			( new Modules() )->is_active( 'ai' ),
			'An explicit opt-out must survive auto-activation run through the module hook.'
		);
	}

	/**
	 * A row holding an empty string is what a Settings > General save left behind, not a
	 * choice anybody made, so it must not be honored as an opt-out.
	 */
	public function test_emptied_option_is_not_an_optout() {
		update_option( 'jetpack_ai_enabled', null );
		wp_cache_flush();
		$this->set_up_auto_activated_off_simple();

		Jetpack::reconcile_ai_master_optout();

		$this->assertTrue(
			( new Modules() )->is_active( 'ai' ),
			'An emptied row is not an opt-out: auto-activation is preserved.'
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
		$this->store_legacy_optout();
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
