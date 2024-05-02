<?php
/**
 * Stub config for WordPress.com Editing Toolkit classes and such needed in the Jetpack monorepo.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

$data = file_get_contents( "$work_dir/full-site-editing/full-site-editing-plugin.php" );
if ( ! preg_match( '/^ \* Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/full-site-editing/full-site-editing-plugin.php" );
}
$version = $m[1];

return array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from WordPress.com Editing Toolkit $version
	 * using the definition file `tools/stubs/full-site-editing-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/full-site-editing/",
	'files'   => array(
		'wpcom-global-styles/index.php' => array(
			'function' => array( 'wpcom_global_styles_in_use', 'wpcom_should_limit_global_styles' ),
		),
		'dotcom-fse/helpers.php'        => array(
			'function' => array( 'A8C\FSE\is_full_site_editing_active', 'A8C\FSE\is_site_eligible_for_full_site_editing' ),
		),
	),
);
