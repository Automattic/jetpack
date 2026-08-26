<?php
/**
 * Package Provenance WP-CLI command.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Predicts, for a WordPress and Gutenberg pair, which runtime serves each package
 * that wp-build-polyfills can polyfill, and whether the site's bundles would be
 * rejected by the winning private-apis allowlist.
 */
class Package_Provenance_CLI {

	/**
	 * Predicts package providers for one or more WordPress/Gutenberg cells.
	 *
	 * Core versions other than the running one are read from the WordPress/WordPress
	 * mirror on GitHub, Gutenberg releases from GitHub Releases; both are cached in the
	 * system temp directory. The command exits with status 1 when any cell rejects an
	 * opt-in.
	 *
	 * ## OPTIONS
	 *
	 * [--wp=<versions>]
	 * : Comma-separated WordPress versions, or `trunk`. Defaults to the running version.
	 *
	 * [--gutenberg=<specs>]
	 * : Comma-separated Gutenberg specs: `off`, `active`, a release version, or a path to a plugin zip or directory. Default `off`.
	 *
	 * [--plugins=<dirs>]
	 * : Comma-separated directories to scan for bundles. Defaults to the active plugins and mu-plugins.
	 *
	 * [--refresh]
	 * : Ignore cached downloads.
	 *
	 * [--format=<format>]
	 * : Output format.
	 * ---
	 * default: table
	 * options:
	 *   - table
	 *   - json
	 *   - yaml
	 *   - csv
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     wp jetpack-debug provenance predict --wp=7.0.4,7.1 --gutenberg=off,23.8.0
	 *     wp jetpack-debug provenance predict --wp=7.1 --gutenberg=/tmp/gutenberg.zip --format=json
	 *
	 * @subcommand predict
	 *
	 * @param array $args       Positional arguments (unused).
	 * @param array $assoc_args Named arguments.
	 */
	public function predict( $args, $assoc_args ) {
		try {
			$this->run( $assoc_args );
		} catch ( RuntimeException $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	}

	/**
	 * Builds the inventories, predicts every cell and prints the result.
	 *
	 * @param array $assoc_args Named arguments.
	 * @throws RuntimeException When an inventory cannot be built.
	 */
	private function run( $assoc_args ) {
		$format  = $assoc_args['format'] ?? 'table';
		$sources = new Package_Provenance_Sources( ! empty( $assoc_args['refresh'] ) );

		$wp_versions = $this->split( $assoc_args['wp'] ?? (string) $GLOBALS['wp_version'] );
		$gb_specs    = $this->split( $assoc_args['gutenberg'] ?? 'off' );
		$dirs        = isset( $assoc_args['plugins'] ) ? $this->split( $assoc_args['plugins'] ) : $sources->default_bundle_dirs();

		$polyfill = $sources->polyfill_inventory();
		$optins   = $sources->optins( $dirs, $polyfill['root'] );

		$cells = array();
		foreach ( $wp_versions as $wp ) {
			$core = $sources->core_inventory( $wp );
			foreach ( $gb_specs as $spec ) {
				$gutenberg = $sources->gutenberg_inventory( $spec );
				$version   = null;
				if ( null !== $gutenberg ) {
					$version = '' !== $gutenberg['version'] ? $gutenberg['version'] : $spec;
				}
				$modes = \Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::predict_registration( 'trunk' === $wp ? '99' : $wp, $version );

				$cells[] = Package_Provenance_Predictor::predict(
					array(
						'wp'                  => $wp,
						'gutenberg'           => $version,
						'modes'               => $modes,
						'core'                => $core,
						'gutenberg_inventory' => $gutenberg,
						'polyfill'            => $polyfill,
						'optins'              => $optins,
					)
				);
			}
		}

		$rejections = 0;
		if ( 'table' === $format ) {
			WP_CLI::log( sprintf( 'Bundles scanned in: %s', implode( ', ', $dirs ) ) );
			WP_CLI::log( sprintf( 'wp-build-polyfills %s from %s', $polyfill['version'], $polyfill['root'] ) );
			if ( array() === $optins ) {
				WP_CLI::warning( 'No private-apis opt-ins found in the scanned bundles. Unbuilt plugins hide rejections; build them or pass --plugins.' );
			}
			foreach ( $cells as $cell ) {
				WP_CLI::log( '' );
				WP_CLI::log( sprintf( '== WP %s · Gutenberg %s ==', $cell['wp'], $cell['gutenberg'] ?? 'inactive' ) );
				WP_CLI\Utils\format_items( 'table', $cell['rows'], array( 'package', 'type', 'provider', 'reason' ) );
				WP_CLI::log( sprintf( 'private-apis served by %s (allowlist: %d modules)', $cell['private_apis']['provider'], $cell['private_apis']['allowlist_size'] ) );
				foreach ( $cell['private_apis']['rejected'] as $module => $files ) {
					++$rejections;
					WP_CLI::warning( sprintf( 'opt-in rejected: %s (%s)', $module, implode( ', ', $files ) ) );
				}
			}
		} else {
			foreach ( $cells as $cell ) {
				$rejections += count( $cell['private_apis']['rejected'] );
			}
			WP_CLI::print_value( $cells, array( 'format' => $format ) );
		}

		if ( $rejections > 0 ) {
			WP_CLI::halt( 1 );
		}
	}

	/**
	 * Splits a comma-separated list.
	 *
	 * @param string $value Raw value.
	 * @return string[]
	 */
	private function split( $value ) {
		return array_values( array_filter( array_map( 'trim', explode( ',', (string) $value ) ), 'strlen' ) );
	}
}
