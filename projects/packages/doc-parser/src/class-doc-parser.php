<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-doc-parser
 */

namespace Automattic\Jetpack;

/**
 * Converts PHPDoc markup into a template ready for import to a WordPress blog.
 */
class Doc_Parser {

	const PACKAGE_VERSION = '1.0.0-alpha';

	/**
	 * Generate a JSON file containing the PHPDoc markup, and save to filesystem.
	 *
	 * @param Array $args this function takes a path as its argument,
	 * as well as optionally an output file name.
	 */
	public function generate( $args ) {
		list( $directory, $output_file ) = $args;

		if ( empty( $output_file ) ) {
			$output_file = 'phpdoc.xml';
		}

		$directory = realpath( $directory );
		echo PHP_EOL;

		// Get data from the PHPDoc
		$json = $this->get_phpdoc_data( $directory );

		// Write to $output_file
		$error = ! file_put_contents( $output_file, $json ); // phpcs:ignore

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		if ( $error ) {
			printf(
				'Problem writing %1$s bytes of data to %2$s',
				strlen( $json ),
				$output_file
			);
			exit;
		}

		printf( 'Data exported to %1$s', $output_file );
		echo PHP_EOL;
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Generate the data from the PHPDoc markup.
	 *
	 * @param string $path Directory to scan for PHPDoc.
	 * @param string $format Optional. What format the data is returned in: [json*|array].
	 * @return string
	 */
	protected function get_phpdoc_data( $path, $format = 'json' ) {
		printf( 'Extracting PHPDoc from %1$s. This may take a few minutes...' . PHP_EOL, $path ); // phpcs:ignore

		// Find the files to get the PHPDoc data from. $path can either be a folder or an absolute ref to a file.
		if ( is_file( $path ) ) {
			$files = array( $path );
			$path  = dirname( $path );

		} else {
			ob_start();
			$files = \WP_Parser\get_wp_files( $path );
			$error = ob_get_clean();

			if ( $error ) {
				printf( 'Problem with %1$s: %2$s', $path, $error ); // phpcs:ignore
				exit;
			}
		}

		// Extract PHPDoc
		$output = \WP_Parser\parse_files( $files, $path );

		if ( $format === 'json' ) {
			$output = json_encode( $output, JSON_PRETTY_PRINT ); // phpcs:ignore
		}

		return $output;
	}
}
