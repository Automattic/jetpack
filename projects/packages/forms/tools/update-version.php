<?php
/**
 * Generate version file for Jetpack_Forms to match the version in package.json
 * Creates a version file in the dist folder with timestamped version info
 *
 * @package automattic/jetpack-forms
 */

$package_json_path = __DIR__ . '/../package.json';
$dist_path         = __DIR__ . '/../dist';
$version_file_path = $dist_path . '/version.php';

// Read the version from package.json
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- This is a build script, not web-facing code
$package_json = json_decode( file_get_contents( $package_json_path ), true );
if ( ! $package_json ) {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
	echo "❌ Error: Could not read package.json\n";
	exit( 1 );
}

$version              = $package_json['version'];
$timestamp            = time();
$time_stamped_version = $version . '-' . $timestamp;

// Ensure dist directory exists
if ( ! is_dir( $dist_path ) ) {
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir -- This is a build script, not web-facing code
	if ( ! mkdir( $dist_path, 0755, true ) ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
		echo "❌ Error: Could not create dist directory\n";
		exit( 1 );
	}
}

// Generate version file content
$version_file_content = "<?php
/**
 * Version information for Jetpack Forms package
 * Generated automatically during build process
 *
 * @package automattic/jetpack-forms
 */

return array(
	'version'           => '$version',
	'timestamp'         => $timestamp,
	'timestamped_version' => '$time_stamped_version',
	'build_date'        => '" . gmdate( 'Y-m-d H:i:s', $timestamp ) . " UTC',
);
";

// Write the version file
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- This is a build script, not web-facing code
if ( file_put_contents( $version_file_path, $version_file_content ) === false ) {
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
	echo "❌ Error: Could not write version file\n";
	exit( 1 );
}

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- This is a CLI script
echo "✅ Generated version file with version '$time_stamped_version' in dist/version.php\n";
