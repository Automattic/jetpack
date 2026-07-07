<?php
/**
 * WP-CLI surface for the Feature Catalog.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}
if ( ! class_exists( 'WP_CLI_Command' ) ) {
	return;
}

use WP_CLI;
use WP_CLI_Command;

/**
 * Inspect the feature catalog.
 */
class CLI extends WP_CLI_Command {

	/**
	 * List all registered features with their resolved status.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jetpack features list
	 *
	 * @subcommand list
	 *
	 * @param array $args       Positional args.
	 * @param array $assoc_args Flags.
	 */
	public function list( $args, $assoc_args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$registry = Registry::instance();
		$env      = $registry->environment();
		if ( null === $env ) {
			WP_CLI::error( 'No feature environment is bound.' );
			return;
		}
		$resolver = new Status_Resolver();
		$rows     = array();
		foreach ( $registry->all() as $feature ) {
			$r      = $resolver->resolve( $feature, $env );
			$rows[] = array(
				'slug'        => $feature->slug(),
				'status'      => $r['status'],
				'reason'      => $r['reason'],
				'connection'  => $feature->connection(),
				'entitlement' => (string) $feature->entitlement(),
			);
		}
		if ( empty( $rows ) ) {
			WP_CLI::warning( 'No features registered.' );
			return;
		}
		WP_CLI\Utils\format_items( 'table', $rows, array( 'slug', 'status', 'reason', 'connection', 'entitlement' ) );
	}
}
