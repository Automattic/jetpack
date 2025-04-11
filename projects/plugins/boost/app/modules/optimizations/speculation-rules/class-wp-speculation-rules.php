<?php
/**
 * Polyfill for WP_Speculation_Rules class that will be available in WordPress 6.8.0
 *
 * @package Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules
 */

if ( ! class_exists( 'WP_Speculation_Rules' ) ) {
	/**
	 * Class WP_Speculation_Rules
	 *
	 * Temporary implementation until WordPress 6.8.0 is released.
	 */
	class WP_Speculation_Rules {
		/**
		 * Array of rules.
		 *
		 * @var array
		 */
		private $rules = array();

		/**
		 * Add a speculation rule
		 *
		 * @param string $type The type of rule (e.g., 'prerender').
		 * @param string $name The name of the rule.
		 * @param array  $args The rule arguments.
		 * @return void
		 */
		public function add_rule( $type, $name, $args ) {
			$this->rules[] = array(
				'type' => $type,
				'name' => $name,
				'args' => $args,
			);
		}

		/**
		 * Get all rules
		 *
		 * @return array
		 */
		public function get_rules() {
			return $this->rules;
		}
	}
}
