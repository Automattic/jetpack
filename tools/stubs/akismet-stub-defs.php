<?php
/**
 * Stub config for Akismet classes and such needed in the Jetpack monorepo.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

$data = file_get_contents( "$work_dir/akismet/akismet.php" );
if ( ! preg_match( '/^Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/akismet/akismet.php" );
}
$version = $m[1];

return array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from Akismet $version
	 * using the definition file `tools/stubs/akismet-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/akismet/",
	'files'   => array(
		'class.akismet.php'       => array(
			'class' => array(
				'Akismet' => array(
					'method' => array(
						'check_key_status',
						'get_api_key',
						'get_comment_history',
						'get_ip_address',
						'http_post',
						'verify_key',
					),
				),
			),
		),
		'class.akismet-admin.php' => array(
			'class' => array(
				'Akismet_Admin' => array(
					'method' => array(
						'admin_menu',
						'display_page',
						'get_akismet_user',
					),
				),
			),
		),
		'wrapper.php'             => array(
			'function' => array( 'akismet_http_post' ),
		),
	),
);
