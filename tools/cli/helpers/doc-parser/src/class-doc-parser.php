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

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Generate a JSON file containing the PHPDoc markup, and save to filesystem.
	 *
	 * @param Array $args this function takes a path as its argument,
	 * as well as optionally an output file name.
	 */
	public function generate( $args ) {
		list( $directories, $output_file ) = $args;

		if ( empty( $output_file ) ) {
			$output_file = 'phpdoc.json';
		}

		$json = array();
		foreach ( $directories as $directory ) {
			$directory = realpath( $directory );
			echo PHP_EOL;

			// Get data from the PHPDoc
			$json[] = $this->get_phpdoc_data( $directory, 'raw' );
		}

		$output = json_encode( $json );
		// Write to $output_file
		$error = ! file_put_contents( $output_file, $output );

		if ( $error ) {
			printf(
				'Problem writing %1$s bytes of data to %2$s' . PHP_EOL,
				strlen( $output ),
				$output_file
			);
			exit( 1 );
		}

		printf( 'Data exported to %1$s' . PHP_EOL, $output_file );
	}

	/**
	 * Generate the data from the PHPDoc markup.
	 *
	 * @param string $path Directory to scan for PHPDoc.
	 * @param string $format Optional. What format the data is returned in: [json*|array].
	 * @return string
	 */
	protected function get_phpdoc_data( $path, $format = 'json' ) {
		printf( 'Extracting PHPDoc from %1$s.' . PHP_EOL, $path );

		// Find the files to get the PHPDoc data from. $path can either be a folder or an absolute ref to a file.
		if ( is_file( $path ) ) {
			$files = array( $path );
			$path  = dirname( $path );

		} else {
			ob_start();
			$files = \WP_Parser\get_wp_files( $path );
			$error = ob_get_clean();

			if ( $error ) {
				printf( 'Problem with %1$s: %2$s' . PHP_EOL, $path, $error );
				exit( 1 );
			}
		}

		// Maybe we should automatically import definitions from .gitignore.
		$ignore = array(
			'/.sass-cache/',
			'/node_modules',
			'vendor/',
			'jetpack_vendor/',
			'/.nova/',
			'/.vscode/',
			'/logs',
			'/allure-results/',
			'tests/',
			'wordpress/',
		);

		$files = array_filter(
			$files,
			function ( $item ) use ( $ignore ) {
				foreach ( $ignore as $path_chunk ) {
					if ( false !== strpos( $item, $path_chunk ) ) {
						return false;
					}
				}
				return true;
			}
		);

		// Extract PHPDoc.
		ob_start();
		$output = \WP_Parser\parse_files( $files, $path );
		ob_end_clean();

		if ( 'json' === $format ) {
			$output = json_encode( $output, JSON_PRETTY_PRINT );
		}

		return $output;
	}
}
