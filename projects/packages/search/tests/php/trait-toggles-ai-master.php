<?php
/**
 * Helpers for flipping the site-wide Jetpack AI master switch in tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * The Jetpack plugin enforces the master switch (and the host's AI opt-out)
 * through the `jetpack_search_ai_answers_enabled` filter; these helpers stand
 * in for its gate callback. Call remove_ai_master_filters() in tearDown().
 */
trait Toggles_Ai_Master {

	/**
	 * The plugin's gate callback with the master off: restrictive for any input.
	 *
	 * @return bool
	 */
	public function apply_master_off_gate() {
		return false;
	}

	/**
	 * The plugin's gate callback with the master on: passes the value through.
	 *
	 * @param mixed $enabled Filtered value.
	 * @return bool
	 */
	public function apply_master_on_gate( $enabled ) {
		return (bool) $enabled;
	}

	/**
	 * Site has a master switch and it is off.
	 */
	protected function turn_ai_master_off() {
		$this->remove_ai_master_filters();
		add_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_off_gate' ) );
	}

	/**
	 * Site has a master switch and it is on.
	 */
	protected function turn_ai_master_on() {
		$this->remove_ai_master_filters();
		add_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_on_gate' ) );
	}

	/**
	 * Drop everything the helpers added.
	 */
	protected function remove_ai_master_filters() {
		remove_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_off_gate' ) );
		remove_filter( 'jetpack_search_ai_answers_enabled', array( $this, 'apply_master_on_gate' ) );
	}
}
