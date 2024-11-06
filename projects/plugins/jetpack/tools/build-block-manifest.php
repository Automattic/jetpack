<?php
/**
 * Build script to generate a PHP manifest file containing block metadata from block.json files.
 * This reduces filesystem reads and JSON parsing at runtime.
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DevelopmentFunctions.error_log_var_export

function build_block_manifest() {
	$base_path = __DIR__ . '/../extensions/blocks';

	$blocks = array();
	$files = glob( $base_path . '/**/block.json' );

	foreach ( $files as $file ) {
		$dir_name = basename( dirname( $file ) );
		$blocks[$dir_name] = json_decode( file_get_contents( $file ), true );
	}

	$output_path = $base_path . '/blocks-manifest.php';
	$content = sprintf(
		"<?php\n" .
		"/**\n" .
		" * Generated block metadata manifest.\n" .
		" * @generated This file is generated. Do not modify it manually.\n" .
		" */\n\n" .
		"return %s;\n",
		var_export( $blocks, true )
	);

	file_put_contents( $output_path, $content );

	echo "✅ Generated block manifest at " . $output_path . "\n";
	echo "Found " . count( $blocks ) . " blocks\n";
}

build_block_manifest();
