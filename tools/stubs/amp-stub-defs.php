<?php
/**
 * Stub config for AMP and AMP for WP functions and such needed in the Jetpack monorepo.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

$data = file_get_contents( "$work_dir/amp/amp.php" );
if ( ! preg_match( '/^ \* Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/amp/amp.php" );
}
$amp_version = trim( $m[1] );

$data = file_get_contents( "$work_dir/accelerated-mobile-pages/accelerated-moblie-pages.php" );
if ( ! preg_match( '/^Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/accelerated-mobile-pages/accelerated-moblie-pages.php" );
}
$ampforwp_version = trim( $m[1] );

return array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from AMP $amp_version and AMP for WP $ampforwp_version
	 * using the definition file `tools/stubs/amp-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/",
	'files'   => array(
		'amp/includes/amp-helper-functions.php' => array(
			'function' => array( 'amp_get_permalink', 'amp_is_available', 'amp_is_canonical', 'amp_is_legacy', 'amp_is_request', 'is_amp_endpoint' ),
		),
		'amp/includes/options/class-amp-options-manager.php' => array(
			'class' => array(
				'AMP_Options_Manager' => array(
					'method' => array( 'get_option' ),
				),
			),
		),
		'amp/includes/admin/functions.php'      => array(
			'function' => array( 'amp_add_customizer_link' ),
		),
		'accelerated-mobile-pages/accelerated-moblie-pages.php' => array(
			'function' => array( 'ampforwp_is_amp_endpoint' ),
		),
	),
);
