<?php
/**
 * Test helper trait for simulating the `ai` module being active.
 *
 * @package automattic/jetpack
 */

/**
 * Forces the `ai` module active for the duration of a test.
 *
 * Off WordPress.com Simple (self-hosted and Atomic) the `ai` module is the AI
 * master switch that {@see Jetpack_AI_Settings::is_master_enabled()} reads, so
 * every AI feature gates off when it is inactive. The PHPUnit environment never
 * runs activate_default_modules(), which leaves the module inactive, so tests
 * that assume AI is on must force it active. This filters `jetpack_active_modules`
 * to append `ai`, mirroring the connected-and-on baseline a live site has — the
 * same approach Jetpack_AI_Settings_Test uses.
 *
 * On WordPress.com Simple this is unnecessary: Modules::is_active() is true
 * unconditionally there and the master reads the `jetpack_ai_enabled` option
 * instead, so the filter is a harmless no-op.
 */
trait Activates_Ai_Module {

	/**
	 * The `jetpack_active_modules` filter callback that appends `ai`. Stored so it
	 * can be removed again — both to exercise master-off assertions and to keep the
	 * filter from leaking into the next test.
	 *
	 * @var callable|null
	 */
	private $activates_ai_module_filter = null;

	/**
	 * Force the `ai` module active so is_master_enabled() reads on off-Simple.
	 *
	 * @return void
	 */
	protected function activate_ai_module_for_test() {
		if ( null !== $this->activates_ai_module_filter ) {
			return;
		}

		$this->activates_ai_module_filter = static function ( $modules ) {
			$modules   = is_array( $modules ) ? $modules : array();
			$modules[] = 'ai';
			return array_values( array_unique( $modules ) );
		};

		add_filter( 'jetpack_active_modules', $this->activates_ai_module_filter );
	}

	/**
	 * Remove the forced `ai` module activation, so is_master_enabled() reads off
	 * again (for master-off assertions) and no filter leaks into the next test.
	 *
	 * @return void
	 */
	protected function deactivate_ai_module_for_test() {
		if ( null === $this->activates_ai_module_filter ) {
			return;
		}

		remove_filter( 'jetpack_active_modules', $this->activates_ai_module_filter );
		$this->activates_ai_module_filter = null;
	}

	/**
	 * Master enforcement only runs on internal testing environments while the
	 * AI controls are gated; tests asserting master-off behavior must opt in.
	 * The predicate treats a proxied A8C request as internal — callers unset
	 * $_SERVER['A8C_PROXIED_REQUEST'] in tear_down().
	 *
	 * @return void
	 */
	protected function force_master_enforcement_for_test() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
	}
}
