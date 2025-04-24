<?php
/**
 * Mocks for Storage_Post_Type tests
 *
 * @package automattic/jetpack-boost
 */

if ( ! class_exists( 'wpdb' ) ) {
	/**
	 * Mock wpdb class.
	 */
	// phpcs:ignore PEAR.NamingConventions.ValidClassName.StartWithCapital
	class wpdb {
		/**
		 * Options table name.
		 *
		 * @var string
		 */
		public $options = 'wp_options';

		/**
		 * Posts table name.
		 *
		 * @var string
		 */
		public $posts = 'wp_posts';

		/**
		 * Mock delete method.
		 *
		 * @param string $table Table name.
		 * @param array  $where Where conditions.
		 * @param array  $where_format Where format.
		 * @return bool
		 */
		public function delete( $table, $where, $where_format = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return true;
		}

		/**
		 * Mock prepare method.
		 *
		 * @param string $query Query to prepare.
		 * @param mixed  ...$args Query arguments.
		 * @return string
		 */
		public function prepare( $query, ...$args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $query;
		}

		/**
		 * Mock query method.
		 *
		 * @param string $query Query to execute.
		 * @return bool
		 */
		public function query( $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return true;
		}
	}
}

// Create global $wpdb instance if it doesn't exist
if ( ! isset( $GLOBALS['wpdb'] ) ) {
	$GLOBALS['wpdb'] = new wpdb();
}
