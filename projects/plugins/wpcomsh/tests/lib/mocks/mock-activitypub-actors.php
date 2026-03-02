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
		 * WebFinger handle.
		 *
		 * @var string|null
		 */
		private $webfinger;

		/**
		 * Constructor.
		 *
		 * @param string      $id        Actor ID.
		 * @param string|null $webfinger Webfinger handle.
		 */
		public function __construct( $id, $webfinger = null ) {
			$this->id        = $id;
			$this->webfinger = $webfinger;
		}

		/**
		 * Get the actor ID.
		 *
		 * @return string
		 */
		public function get_id() {
			return $this->id;
		}

		/**
		 * Get the WebFinger handle.
		 *
		 * @return string|null
		 */
		public function get_webfinger() {
			return $this->webfinger;
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
