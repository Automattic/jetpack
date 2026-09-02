<?php
/**
 * Tests for the repair of the `ai` module a General settings save switched off.
 *
 * Until the AI options moved to their own settings group, submitting Settings > General
 * emptied the master option, and {@see Jetpack::reconcile_ai_master_optout()} read that
 * empty row as an explicit opt-out and deactivated the module.
 * {@see Jetpack::repair_ai_module_deactivated_by_wipe()} puts the module back once.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Jetpack_AI_Module_Wipe_Repair_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_AI_Module_Wipe_Repair_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the platform, both migration guards, the option, and module state.
	 */
	public function tear_down() {
		delete_option( 'jetpack_ai_enabled' );
		delete_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION );
		delete_option( Jetpack::AI_MODULE_WIPE_REPAIRED_OPTION );
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );

		parent::tear_down();
	}

	/**
	 * Put the site in the state reconcile_ai_master_optout() left behind: the master row
	 * emptied by a General save, the opt-out migration already spent on it, no `ai` module.
	 */
	private function set_up_burned_site() {
		Constants::set_constant( 'IS_WPCOM', false );
		update_option( 'jetpack_ai_enabled', null );
		wp_cache_flush();
		update_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION, true );
		\Jetpack_Options::update_option( 'active_modules', array() );
	}

	/**
	 * Store the opt-out the way a site made it before the option was registered: with no
	 * sanitize callback in the way, a falsey write lands as '0'. Once the setting is
	 * registered, rest_sanitize_boolean turns every falsey write into '' instead — which is
	 * why '' means an emptied row and '0' means somebody chose it.
	 */
	private function store_legacy_optout() {
		remove_all_filters( 'sanitize_option_jetpack_ai_enabled' );
		update_option( 'jetpack_ai_enabled', 0 );
		wp_cache_flush();
		$this->assertSame( '0', get_option( 'jetpack_ai_enabled' ), 'Precondition: a legacy opt-out reads as "0".' );
	}

	/**
	 * THE repair property: a module deactivated because the master row was emptied comes back.
	 */
	public function test_repair_reactivates_a_module_the_wipe_deactivated() {
		$this->set_up_burned_site();

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertContains(
			'ai',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'A module deactivated by the emptied master row must be reactivated.'
		);
	}

	/**
	 * The empty row is a lie about the site's choice, so the repair clears it.
	 */
	public function test_repair_deletes_the_emptied_master_row() {
		$this->set_up_burned_site();

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertFalse( get_option( 'jetpack_ai_enabled', false ), 'The emptied row is deleted.' );
	}

	/**
	 * A real opt-out stores '0', never ''. It must survive the repair untouched.
	 */
	public function test_repair_leaves_a_real_optout_deactivated() {
		$this->set_up_burned_site();
		$this->store_legacy_optout();

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertNotContains(
			'ai',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'An explicit opt-out is not a wipe: the module stays off.'
		);
	}

	/**
	 * With no stored row there was nothing to misread, so there is nothing to repair.
	 */
	public function test_repair_leaves_an_absent_option_alone() {
		$this->set_up_burned_site();
		delete_option( 'jetpack_ai_enabled' );

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertNotContains( 'ai', (array) \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * Without the opt-out migration having run, the module is off for some other reason —
	 * auto-activation owns that state, so the repair keeps its hands off.
	 */
	public function test_repair_does_nothing_before_the_optout_migration_has_run() {
		$this->set_up_burned_site();
		delete_option( Jetpack::AI_MASTER_OPTOUT_MIGRATED_OPTION );

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertNotContains( 'ai', (array) \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * The repair runs once, so AI switched off afterwards stays off.
	 */
	public function test_repair_runs_only_once() {
		$this->set_up_burned_site();

		Jetpack::repair_ai_module_deactivated_by_wipe();
		$this->assertTrue( (bool) get_option( Jetpack::AI_MODULE_WIPE_REPAIRED_OPTION ), 'The guard flag is set.' );

		// The user turns AI back off, and the emptied row is re-created underneath them.
		$this->set_up_burned_site();

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertNotContains(
			'ai',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'A second run is a no-op: the guard prevents re-enabling a module the user turned off.'
		);
	}

	/**
	 * Simple never runs modules, and jetpack-mu-wpcom repairs its options.
	 */
	public function test_repair_is_a_no_op_on_wpcom_simple() {
		$this->set_up_burned_site();
		Constants::set_constant( 'IS_WPCOM', true );

		Jetpack::repair_ai_module_deactivated_by_wipe();

		$this->assertNotContains( 'ai', (array) \Jetpack_Options::get_option( 'active_modules' ) );
		$this->assertFalse( get_option( Jetpack::AI_MODULE_WIPE_REPAIRED_OPTION, false ) );
	}

	/**
	 * The Atomic shim filters `ai` into the reported module list without storing it, so a
	 * repair that trusted Modules::is_active() would skip exactly the sites that need it.
	 */
	public function test_repair_ignores_a_module_only_filtered_active() {
		$this->set_up_burned_site();
		$force_active = function ( $modules ) {
			$modules[] = 'ai';
			return $modules;
		};
		add_filter( 'jetpack_active_modules', $force_active );

		Jetpack::repair_ai_module_deactivated_by_wipe();

		remove_filter( 'jetpack_active_modules', $force_active );

		$this->assertContains(
			'ai',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'The stored list is what the repair reads and writes, not the filtered one.'
		);
	}

	/**
	 * The ordering contract, locked against the production registration: the repair must run
	 * at a LATER init priority than the opt-out migration whose result it corrects.
	 */
	public function test_repair_hooked_after_the_optout_migration_on_upgrade() {
		Jetpack::register_upgrade_init_hooks();

		$reconcile_priority = has_action( 'init', array( 'Jetpack', 'reconcile_ai_master_optout' ) );
		$repair_priority    = has_action( 'init', array( 'Jetpack', 'repair_ai_module_deactivated_by_wipe' ) );

		$this->assertNotFalse( $repair_priority, 'repair_ai_module_deactivated_by_wipe is registered on init.' );
		$this->assertGreaterThan(
			$reconcile_priority,
			$repair_priority,
			'The repair must run at a later init priority than reconcile_ai_master_optout.'
		);
	}
}
