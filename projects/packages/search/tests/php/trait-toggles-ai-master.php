<?php
/**
 * Helpers for flipping the site-wide Jetpack AI master switch in tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * On a real site the master exists twice: as the `ai` module (read by
 * should_enforce_master()) and as the Jetpack plugin's restrictive callback on
 * the `jetpack_search_ai_answers_enabled` filter (read by is_master_enabled()).
 * These helpers stand in for both so the two predicates agree the way they do
 * in production. Call remove_ai_master_filters() in tearDown().
 */
trait Toggles_Ai_Master {

	/**
	 * Register `ai` as an available module, the way the Jetpack plugin does.
	 *
	 * @param array $modules Available module slugs.
	 * @return array
	 */
	public function add_ai_module( $modules ) {
		$modules[] = AI_Answers::AI_MODULE;
		return $modules;
	}

	/**
	 * Report `ai` among the active modules.
	 *
	 * @param mixed  $value Option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function activate_ai_module( $value, $name ) {
		if ( 'active_modules' !== $name ) {
			return $value;
		}
		// Append rather than replace, so a test that activated other modules
		// (e.g. search) doesn't silently lose them.
		return array_unique( array_merge( (array) $value, array( AI_Answers::AI_MODULE ) ) );
	}

	/**
	 * The plugin's filter gate with the master off: restrictive for any input.
	 *
	 * @return bool
	 */
	public function apply_master_off_gate() {
		return false;
	}

	/**
	 * The plugin's filter gate with the master on: passes the value through.
	 *
	 * @param mixed $enabled Filtered value.
	 * @return bool
	 */
	public function apply_master_on_gate( $enabled ) {
		return (bool) $enabled;
	}

	/**
	 * Only the module half, off: `ai` available but inactive, no filter gate.
	 * Models the package-side view alone — used by the env-scoping tests, which
	 * pin should_enforce_master() without the plugin's chain in the way.
	 */
	protected function turn_ai_module_off() {
		$this->remove_ai_master_filters();
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_ai_module' ) );
	}

	/**
	 * Site has a master switch and it is off: the `ai` module is available but
	 * inactive, and the plugin's filter gate folds false into the chain.
	 */
	protected function turn_ai_master_off() {
		$this->turn_ai_module_off();
		add_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_off_gate' ) );
	}

	/**
	 * Site has a master switch and it is on.
	 */
	protected function turn_ai_master_on() {
		$this->remove_ai_master_filters();
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_ai_module' ) );
		add_filter( 'jetpack_options', array( $this, 'activate_ai_module' ), 10, 2 );
		add_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_on_gate' ) );
	}

	/**
	 * Drop everything the helpers added.
	 */
	protected function remove_ai_master_filters() {
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_ai_module' ) );
		remove_filter( 'jetpack_options', array( $this, 'activate_ai_module' ) );
		remove_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_off_gate' ) );
		remove_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_on_gate' ) );
	}
}
