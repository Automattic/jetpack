<?php
/**
 * WP-CLI commands for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use WP_CLI;
use WP_CLI_Command;

if ( ! class_exists( 'WP_CLI_Command' ) ) {
	return;
}

/**
 * Manage Jetpack Forms responses.
 */
class CLI extends WP_CLI_Command {
	/**
	 * Export form responses as CSV, in the same format as the dashboard's CSV download.
	 *
	 * Responses are read in small batches, so this works however many a site has.
	 *
	 * ## OPTIONS
	 *
	 * [--file=<path>]
	 * : Write the CSV to this file instead of standard output.
	 *
	 * [--form=<post-id>]
	 * : Only export responses to the form on this post or page.
	 *
	 * [--status=<status>]
	 * : Which folder to export.
	 * ---
	 * default: inbox
	 * options:
	 *   - inbox
	 *   - spam
	 *   - trash
	 * ---
	 *
	 * [--search=<term>]
	 * : Only export responses matching this search term.
	 *
	 * [--after=<date>]
	 * : Only export responses received after this date, e.g. 2026-01-31.
	 *
	 * [--before=<date>]
	 * : Only export responses received before this date.
	 *
	 * [--source=<post-id>]
	 * : Only export responses submitted from this post or page.
	 *
	 * [--include-test]
	 * : Include test responses submitted from the form preview.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jetpack-forms export --file=responses.csv
	 *     wp jetpack-forms export --form=123 --after=2026-01-01 > responses.csv
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 */
	public function export( $args, $assoc_args ) {
		$plugin = Contact_Form_Plugin::init();

		foreach ( array( 'after', 'before' ) as $bound ) {
			if ( isset( $assoc_args[ $bound ] ) && ! strtotime( $assoc_args[ $bound ] ) ) {
				WP_CLI::error( sprintf( 'Invalid --%s date: %s', $bound, $assoc_args[ $bound ] ) );
			}
		}

		$feedback_ids = $plugin->get_export_feedback_ids(
			array(
				'form'   => (int) ( $assoc_args['form'] ?? 0 ),
				'status' => $assoc_args['status'] ?? 'inbox',
				'search' => $assoc_args['search'] ?? '',
				'after'  => $assoc_args['after'] ?? '',
				'before' => $assoc_args['before'] ?? '',
				'source' => (int) ( $assoc_args['source'] ?? 0 ),
			)
		);

		$rows = $plugin->get_export_rows( $feedback_ids, (bool) WP_CLI\Utils\get_flag_value( $assoc_args, 'include-test', false ) );
		if ( ! $rows->valid() ) {
			WP_CLI::warning( 'No responses match.' );
			return;
		}

		$file = $assoc_args['file'] ?? null;
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
		$output = null === $file ? STDOUT : fopen( $file, 'w' );
		if ( false === $output ) {
			WP_CLI::error( sprintf( 'Could not open %s for writing.', $file ) );
		}

		fputcsv( $output, $rows->current(), ',', '"', '' );
		$rows->next();

		$count = 0;
		while ( $rows->valid() ) {
			fputcsv( $output, array_map( array( $plugin, 'esc_csv' ), $rows->current() ), ',', '"', '' );
			++$count;
			$rows->next();
		}

		if ( null !== $file ) {
			fclose( $output ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
			WP_CLI::success( sprintf( 'Exported %d responses to %s.', $count, $file ) );
		}
	}
}
