<?php
/**
 * Minimal WP-CLI stand-ins so the CLI command class can load outside WP-CLI.
 *
 * @package automattic/jetpack-waf
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

/**
 * Stand-in for WP_CLI_Command.
 */
class WP_CLI_Command {}

/**
 * Stand-in for WP_CLI that throws on error, like the real one exits.
 */
class WP_CLI {
	/**
	 * Swallow success output.
	 *
	 * @param string $message Message.
	 */
	public static function success( $message ) {} // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	/**
	 * Throw instead of exiting.
	 *
	 * @param string $message Message.
	 * @throws RuntimeException Always.
	 */
	public static function error( $message ) {
		throw new RuntimeException( $message );
	}
}
