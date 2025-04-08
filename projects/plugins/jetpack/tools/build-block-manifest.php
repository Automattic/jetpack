<?php
/**
 * Build script to generate a PHP manifest file containing block metadata from block.json files.
 * This reduces filesystem reads and JSON parsing at runtime.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DevelopmentFunctions.error_log_var_export

/**
 * Generates a manifest file containing block metadata from block.json files.
 *
 * Scans the given directory for block.json files, combines their metadata
 * into a single PHP file that returns an array. This improves performance
 * by avoiding filesystem reads and JSON parsing at runtime.
 *
 * @param string $base_path Optional. Base directory to scan for block.json files.
 *                         Defaults to Jetpack blocks directory.
 * @return bool True on success, throws Exception with error message on failure.
 * @throws Exception If directory doesn't exist, no files found, or write fails.
 */
function build_block_manifest( $base_path = null ) {
	if ( null === $base_path ) {
		$base_path = __DIR__ . '/../_inc/blocks';
	}

	if ( ! file_exists( $base_path ) ) {
		throw new Exception( "Input directory does not exist: {$base_path}", 1 );
	}

	$blocks = array();
	$files  = glob( $base_path . '/*/block.json' );

	if ( empty( $files ) ) {
		throw new Exception( "No block.json files found in: {$base_path}", 1 );
	}

	foreach ( $files as $file ) {
		if ( ! file_exists( $file ) ) {
			// Log warning but continue processing other files.
			fwrite( STDERR, "\033[33mWarning:\033[0m Skipping missing file: {$file}\n" );
			continue;
		}

		$json_content = file_get_contents( $file );
		if ( false === $json_content ) {
			fwrite( STDERR, "\033[33mWarning:\033[0m Could not read file: {$file}\n" );
			continue;
		}

		$block_data = json_decode( $json_content, true );
		if ( null === $block_data ) {
			fwrite( STDERR, "\033[33mWarning:\033[0m Invalid JSON in file: {$file}\n" );
			continue;
		}

		$dir_name            = basename( dirname( $file ) );
		$blocks[ $dir_name ] = $block_data;
	}

	if ( empty( $blocks ) ) {
		throw new Exception( 'No valid block.json files were processed', 1 );
	}

	$output_path = $base_path . '/blocks-manifest.php';
	$content     = sprintf(
		"<?php\n" .
		"/**\n" .
		" * Generated block metadata manifest.\n" .
		" * @generated This file is generated. Do not modify it manually.\n" .
		" */\n\n" .
		"return %s;\n",
		var_export( $blocks, true )
	);

	$file_put_result = file_put_contents( $output_path, $content );
	if ( false === $file_put_result ) {
		throw new Exception( "Failed to write manifest file: {$output_path}", 1 );
	}

	echo '✅ Generated block manifest at ' . $output_path . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo 'Found ' . count( $blocks ) . " blocks\n";

	return true;
}

// Only run the function if this script is being executed directly
if ( defined( 'ABSPATH' ) && defined( 'DOING_TESTS' ) ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
	// Do nothing - we're in a test environment
} else {
	build_block_manifest();
}
