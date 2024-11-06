<?php // phpcs:ignore Squiz.Commenting.FileComment.MissingPackageTag
/**
 * Build script to generate a PHP manifest file containing block metadata from block.json files.
 * This reduces filesystem reads and JSON parsing at runtime.
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DevelopmentFunctions.error_log_var_export

/**
 * Generates a manifest file containing block metadata from block.json files.
 *
 * Scans the extensions/blocks directory for block.json files, combines their
 * metadata into a single PHP file that returns an array. This improves performance
 * by avoiding filesystem reads and JSON parsing at runtime.
 *
 * The function will exit with status code 1 if:
 * - The input directory doesn't exist
 * - No block.json files are found
 * - No valid block.json files could be processed
 * - Unable to write the output file
 *
 * @return void
 */
function build_block_manifest() {
	$base_path = __DIR__ . '/../extensions/blocks';

	if ( ! file_exists( $base_path ) ) {
		fwrite( STDERR, "\033[31mError:\033[0m Input directory does not exist: {$base_path}\n" );
		exit( 1 );
	}

	$blocks = array();
	$files  = glob( $base_path . '/**/block.json' );

	if ( empty( $files ) ) {
		fwrite( STDERR, "\033[31mError:\033[0m No block.json files found in: {$base_path}\n" );
		exit( 1 );
	}

	foreach ( $files as $file ) {
		if ( ! file_exists( $file ) ) {
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
		fwrite( STDERR, "\033[31mError:\033[0m No valid block.json files were processed\n" );
		exit( 1 );
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
		fwrite( STDERR, "\033[31mError:\033[0m Failed to write manifest file: {$output_path}\n" );
		exit( 1 );
	}

	echo '✅ Generated block manifest at ' . $output_path . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo 'Found ' . count( $blocks ) . " blocks\n";
}

build_block_manifest();
