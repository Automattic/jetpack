<?php
/**
 * Mock for Activitypub\Collection\Actors.
 *
 * @package wpcomsh
 */

// phpcs:ignoreFile -- Mock file with multiple namespaced classes.

namespace Activitypub\Collection;

if ( ! class_exists( 'Activitypub\Collection\Actors' ) ) {
	/**
	 * Mock Actor returned by the Actors collection.
	 */
	class Actor {
		/**
		 * Actor ID.
		 *
		 * @var string
		 */
		private $id;

		/**
		 * Constructor.
		 *
		 * @param string $id Actor ID.
		 */
		public function __construct( $id ) {
			$this->id = $id;
		}

		/**
		 * Get the actor ID.
		 *
		 * @return string
		 */
		public function get_id() {
			return $this->id;
		}
	}

	/**
	 * Mock for the Activitypub Actors collection class.
	 */
	class Actors {
		/**
		 * The value to return from get_by_id.
		 *
		 * @var mixed
		 */
		private static $mock_return;

		/**
		 * Set the mock return value for get_by_id.
		 *
		 * @param mixed $value The value to return.
		 */
		public static function set_mock_return( $value ) {
			self::$mock_return = $value;
		}

		/**
		 * Mock get_by_id.
		 *
		 * @param int $id Actor ID.
		 * @return mixed
		 */
		public static function get_by_id( $id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return self::$mock_return;
		}
	}
}
