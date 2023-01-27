<?php
/**
 * A utility for transforming a raw code coverage
 * report into a clover.xml file for consumption.
 *
 * @package automattic/jetpack-autoloader
 */

use SebastianBergmann\CodeCoverage\Report\Clover;
use SebastianBergmann\CodeCoverage\Version;

// phpcs:disabled WordPress.Security.EscapeOutput.OutputNotEscaped

define( 'ROOT_DIR', dirname( dirname( dirname( __DIR__ ) ) ) );

require_once ROOT_DIR . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';

/**
 * Returns the path to the clover.xml output file.
 *
 * @return string The path to the output file.
 */
function get_output_file() {
	global $argc;
	global $argv;

	if ( $argc < 2 ) {
		echo "Usage: test-coverage [clover.xml file]\n";
		exit( -1 );
	}

	return $argv[1];
}

/**
 * Attempts to load the report from the tmp file we should have generated.
 *
 * @return SebastianBergmann\CodeCoverage\CodeCoverage The unserialized code coverage object.
 */
function load_report() {
	$coverage_report = implode( DIRECTORY_SEPARATOR, array( ROOT_DIR, 'tests', 'php', 'tmp', 'coverage-report.php' ) );
	if ( ! file_exists( $coverage_report ) ) {
		echo "There is no coverage report to process.\n";
		exit( -1 );
	}

	return require_once $coverage_report;
}

/**
 * Evaluates the version of sebastianbergmann/php-code-coverage that we've generated the coverage report using.
 *
 * @return string The version for the code coverage package.
 */
function get_coverage_version() {
	return Version::id();
}

/**
 * Counts the number of lines in a file before the `class` keyword.
 *
 * @param string $file The file to check.
 * @return int|null The number of lines or null if there is no class keyword.
 */
function count_lines_before_class_keyword( $file ) {
	// Find the line that the `class` keyword occurs on so that we can use it to calculate an offset from the header.
	$content = file_get_contents( $file );

	// Find the class keyword and capture the number of characters in the string before this point.
	if ( 0 === preg_match_all( '/^class /m', $content, $matches, PREG_OFFSET_CAPTURE ) ) {
		return null;
	}

	// Count the line endings leading up to the `class` keyword.
	$newlines = substr_count( $content, "\n", 0, $matches[0][0][1] );
	if ( $newlines > 0 ) {
		return $newlines + 1;
	}

	return null;
}

/**
 * Creates a map for converting file paths to src paths.
 *
 * @param string[] $report_file_paths An array containing all of the paths for the report.
 * @return array A map describing how to transform built files into src coverage.
 */
function get_path_transformation_map( $report_file_paths ) {
	// We're going to create a map describing how to transform files to src files.
	// We're also going to store any metadata needed to perform the merge safetly.
	$transformation_map = array();

	// Scan the src directory so that we can create the map to convert between files.
	$raw_src_files = scandir( ROOT_DIR . DIRECTORY_SEPARATOR . 'src' );
	$src_file_map  = array();
	foreach ( $raw_src_files as $file ) {
		// Only PHP files will be copied.
		if ( substr( $file, -4 ) !== '.php' ) {
			continue;
		}

		$file = ROOT_DIR . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . $file;
		if ( ! file_exists( $file ) ) {
			continue;
		}

		// We need to use the class keyword to address the line offset from injecting the header.
		$class_line = count_lines_before_class_keyword( $file );
		if ( null === $class_line ) {
			// The autoloader only has class files and so this is fine.
			continue;
		}

		$src_file_map[ $file ] = array(
			'file'       => $file,
			'class_line' => $class_line,
		);
	}

	// Create a map describing the file transformations.
	foreach ( $report_file_paths as $report_file_path ) {
		// We will use the class line from the report file to calculate the offset from the src file to apply to coverage lines.
		$class_line = count_lines_before_class_keyword( $report_file_path );
		if ( ! isset( $class_line ) ) {
			continue;
		}

		// Attempt to find the original file.
		// Note: This does not support nested directories!
		$src_file_path = null;
		foreach ( $src_file_map as $src_file ) {
			// We don't need to perform any transformations if the file path is the same.
			if ( $src_file['file'] === $report_file_path ) {
				continue;
			}

			if ( basename( $src_file['file'] ) === basename( $report_file_path ) ) {
				$src_file_path = $src_file['file'];
				break;
			}
		}
		if ( ! $src_file_path ) {
			continue;
		}

		// We can finally calculate the line offset since we have the class line for both.
		$line_offset = $class_line - $src_file_map[ $src_file_path ]['class_line'];

		// Record the file in the transformation map.
		$transformation_map[ $report_file_path ] = array(
			'src'         => $src_file_path,
			'line_offset' => $line_offset,
		);
	}

	return $transformation_map;
}

/**
 * Processes a v9 CodeCoverage report.
 *
 * @param SebastianBergmann\CodeCoverage\CodeCoverage $report The report to process.
 * @return SebastianBergmann\CodeCoverage\CodeCoverage The processed report.
 */
function process_coverage_9( $report ) {
	$data      = $report->getData( true );
	$classname = get_class( $data );

	// We're going to merge the line coverage from compiled files into the src files.
	$line_coverage   = $data->lineCoverage();
	$transformations = get_path_transformation_map( array_keys( $line_coverage ) );

	$removed_files = array();
	foreach ( $line_coverage as $file => $lines ) {
		if ( ! isset( $transformations[ $file ] ) ) {
			continue;
		}

		// Prepare the transformations we are going to make.
		$src_file    = $transformations[ $file ]['src'];
		$line_offset = $transformations[ $file ]['line_offset'];

		// Create a new line coverage mapped to the src file.
		$new_coverage = array();
		foreach ( $lines as $line => $coverage ) {
			$new_coverage[ $src_file ][ $line - $line_offset ] = $coverage;
		}

		// Merge the coverage since multiple compiled files may map to a single src file.
		$merge = new $classname();
		$merge->setLineCoverage( $new_coverage );
		$data->merge( $merge );

		// Mark the file for removal from the original coverage.
		$removed_files[] = $file;
	}

	// Remove all of the files that we've transformed from the coverage.
	$line_coverage = $data->lineCoverage();
	foreach ( $removed_files as $file ) {
		// Make sure the uncovered file does not show up in the report.
		$report->filter()->excludeFile( $file );
		unset( $line_coverage[ $file ] );
	}
	$data->setLineCoverage( $line_coverage );

	return $report;
}

/**
 * Processes the code coverage report and outputs a clover.xml file.
 */
function process_coverage() {
	echo "Aggregating compiled coverage into unified code coverage report\n";

	// We're going to transform the code coverage object into a Clover XML report.
	$output_file = get_output_file();

	// Since there is no backwards compatibility guarantee in place for the code coverage
	// object we need to handle it according to each major version independently.
	$coverage_version = get_coverage_version();
	$major_version    = substr( $coverage_version, 0, strpos( $coverage_version, '.' ) );

	$function = 'process_coverage_' . $major_version;
	if ( ! function_exists( $function ) ) {
		echo "No handler defined for major version $major_version\n";
		die( -1 );
	}

	// We can finally load the report that we're wanting to process.
	$report = load_report();

	// Process the report using the handler.
	$report = call_user_func( $function, $report );

	// Generate the XML file for the report.
	$clover = new Clover();
	$clover->process( $report, $output_file );
	echo "Generated code coverage report in Clover format\n";
}

// Process the coverage report into the new output.
process_coverage();
