<?php
/**
 * WP-CLI command for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * `wp plugin-compat check <slug>`
 *
 * Prints the verdict (safe/warn/block) plus the human-readable reasons
 * that produced it. Useful for quick checks without touching the admin
 * page.
 */
class PCG_CLI_Command {

	/**
	 * Run a pre-flight check against a plugin slug.
	 *
	 * ## OPTIONS
	 *
	 * <slug>
	 * : WordPress.org plugin slug (e.g. "elementor").
	 *
	 * [--json]
	 * : Emit the full verdict (including raw payloads) as JSON.
	 *
	 * ## EXAMPLES
	 *
	 *     wp plugin-compat check elementor
	 *     wp plugin-compat check woocommerce --json
	 *
	 * @param array $args       Positional args.
	 * @param array $assoc_args Flags.
	 */
	public function check( $args, $assoc_args ) {
		list( $slug ) = $args;

		$checker = new PCG_Compat_Checker( new PCG_Wporg_Source(), new PCG_Site_State() );
		$verdict = $checker->check( (string) $slug );

		if ( ! empty( $assoc_args['json'] ) ) {
			WP_CLI::print_value( $verdict->to_array(), array( 'format' => 'json' ) );
			return;
		}

		$label = strtoupper( $verdict->status );
		WP_CLI::line( sprintf( 'VERDICT: %s', $label ) );
		foreach ( $verdict->reasons as $reason ) {
			WP_CLI::line( '  - ' . $reason );
		}

		if ( PCG_Verdict::STATUS_BLOCK === $verdict->status ) {
			WP_CLI::halt( 2 );
		}
	}
}

WP_CLI::add_command( 'plugin-compat', 'PCG_CLI_Command' );
