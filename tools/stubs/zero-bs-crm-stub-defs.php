<?php
/**
 * Stub config for Jetpack CRM (Zero BS CRM) functions needed in the Jetpack monorepo.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

$data = file_get_contents( "$work_dir/zero-bs-crm/ZeroBSCRM.php" );
if ( ! preg_match( '/^ \* Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/zero-bs-crm/ZeroBSCRM.php" );
}
$version = $m[1];

return array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from Jetpack CRM $version
	 * using the definition file `tools/stubs/zero-bs-crm-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/zero-bs-crm/",
	'files'   => array(
		'includes/ZeroBSCRM.Core.Extensions.php' => array(
			'function' => array(
				'zeroBSCRM_isExtensionInstalled',
				'zeroBSCRM_extension_install_jetpackforms',
			),
		),
	),
);
