<?php // phpcs:disable
/**
 * Mock WP-CLI classes for testing.
 *
 * Provides minimal implementations of WP-CLI classes needed for testing
 * the VideoPress CLI command without requiring the full wp-cli/wp-cli package.
 *
 * @package automattic/jetpack-videopress
 */

namespace WP_CLI {
	/**
	 * Exception thrown when WP_CLI::error() is called.
	 */
	class ExitException extends \Exception {}
}

namespace WP_CLI\Utils {
	/**
	 * Get a flag value from associative arguments.
	 *
	 * @param array  $assoc_args Associative arguments.
	 * @param string $flag       The flag name.
	 * @param mixed  $default    Default value if flag is not set.
	 * @return mixed The flag value or default.
	 */
	function get_flag_value( $assoc_args, $flag, $default = null ) {
		return $assoc_args[ $flag ] ?? $default;
	}
}

namespace {
	/**
	 * Mock WP_CLI_Command base class.
	 */
	class WP_CLI_Command {}

	/**
	 * Mock WP_CLI class with static methods for output.
	 */
	class WP_CLI {
		/**
		 * Output an error message and exit.
		 *
		 * @param string $message The error message.
		 * @throws \WP_CLI\ExitException Always thrown to simulate CLI exit.
		 */
		public static function error( $message ) {
			throw new \WP_CLI\ExitException( $message );
		}

		/**
		 * Output a warning message.
		 *
		 * @param string $message The warning message.
		 */
		public static function warning( $message ) {
			// In tests, we don't need to output anything.
		}

		/**
		 * Output a log message.
		 *
		 * @param string $message The log message.
		 */
		public static function log( $message ) {
			// In tests, we don't need to output anything.
		}

		/**
		 * Output a success message.
		 *
		 * @param string $message The success message.
		 */
		public static function success( $message ) {
			// In tests, we don't need to output anything.
		}
	}
}
