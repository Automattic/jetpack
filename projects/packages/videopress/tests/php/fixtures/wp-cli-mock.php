<?php // phpcs:disable
/**
 * Mock WP-CLI classes for testing.
 *
 * Provides minimal implementations of WP-CLI classes needed for testing
 * the VideoPress CLI command without requiring the full wp-cli/wp-cli package.
 * Each declaration is class_exists/function_exists guarded so this file is safe
 * to load alongside the real wp-cli/wp-cli (e.g. via wp-cli-stubs in another
 * test context that pulls this fixture transitively).
 *
 * @package automattic/jetpack-videopress
 */

namespace WP_CLI {
	if ( ! class_exists( __NAMESPACE__ . '\\ExitException' ) ) {
		/**
		 * Exception thrown when WP_CLI::error() is called.
		 */
		class ExitException extends \Exception {}
	}
}

namespace WP_CLI\Utils {
	if ( ! function_exists( __NAMESPACE__ . '\\get_flag_value' ) ) {
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
}

namespace {
	if ( ! class_exists( 'WP_CLI_Command' ) ) {
		/**
		 * Mock WP_CLI_Command base class.
		 */
		class WP_CLI_Command {}
	}

	if ( ! class_exists( 'WP_CLI' ) ) {
		/**
		 * Mock WP_CLI class with static methods for output.
		 *
		 * Captures messages by level (warning/log/success) so tests can assert
		 * the right output was produced. Tests should call WP_CLI::reset_capture()
		 * in their set_up() to clear state between runs.
		 */
		class WP_CLI {
			/**
			 * Captured messages keyed by level.
			 *
			 * @var array<string,string[]>
			 */
			public static $captured = array(
				'warning' => array(),
				'log'     => array(),
				'success' => array(),
			);

			/**
			 * Reset captured messages between tests.
			 */
			public static function reset_capture() {
				self::$captured = array(
					'warning' => array(),
					'log'     => array(),
					'success' => array(),
				);
			}

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
			 * Capture a warning message.
			 *
			 * @param string $message The warning message.
			 */
			public static function warning( $message ) {
				self::$captured['warning'][] = $message;
			}

			/**
			 * Capture a log message.
			 *
			 * @param string $message The log message.
			 */
			public static function log( $message ) {
				self::$captured['log'][] = $message;
			}

			/**
			 * Capture a success message.
			 *
			 * @param string $message The success message.
			 */
			public static function success( $message ) {
				self::$captured['success'][] = $message;
			}
		}
	}
}
