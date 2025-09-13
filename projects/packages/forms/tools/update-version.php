<?php
/**
 * Update the PACKAGE_VERSION and PACKAGE_VERSION_AND_TIMESTAMP constants in Jetpack_Forms class
 * to match the version in package.json
 *
 * @package automattic/jetpack-forms
 */

$package_json_path  = __DIR__ . '/../package.json';
$jetpack_forms_path = __DIR__ . '/../src/class-jetpack-forms.php';

// Read the version from package.json
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- This is a build script, not web-facing code
$package_json = json_decode( file_get_contents( $package_json_path ), true );
if ( ! $package_json ) {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
	echo "❌ Error: Could not read package.json\n";
	exit( 1 );
}

$version = $package_json['version'];

// Read the PHP file
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- This is a build script, not web-facing code
$php_content = file_get_contents( $jetpack_forms_path );
if ( $php_content === false ) {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
	echo "❌ Error: Could not read class-jetpack-forms.php\n";
	exit( 1 );
}

$time_stamped_version = $version . '-' . time();

$timestamp_pattern     = "/const PACKAGE_VERSION_AND_TIMESTAMP = '[^']+';/";
$timestamp_replacement = "const PACKAGE_VERSION_AND_TIMESTAMP = '$time_stamped_version';";

$updated = false;

// Update PACKAGE_VERSION_AND_TIMESTAMP constant
if ( preg_match( $timestamp_pattern, $php_content ) ) {
	$php_content = preg_replace( $timestamp_pattern, $timestamp_replacement, $php_content );
	$updated     = true;
}

if ( $updated ) {
	// Write the updated content back
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- This is a build script, not web-facing code
	if ( file_put_contents( $jetpack_forms_path, $php_content ) === false ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
		echo "❌ Error: Could not write to class-jetpack-forms.php\n";
		exit( 1 );
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
	echo "✅ Updated PACKAGE_VERSION_AND_TIMESTAMP constant to '$time_stamped_version' in class-jetpack-forms.php\n";
} else {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
	echo "❌ Error: Could not find PACKAGE_VERSION_AND_TIMESTAMP constants to update\n";
	exit( 1 );
}
