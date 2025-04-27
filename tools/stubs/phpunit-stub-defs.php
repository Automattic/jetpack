<?php
/**
 * Stub config for PHPUnit.
 *
 * PHPUnit 11.5 that we currently use has some stuff that doesn't work with Phan.
 * So we extract the stubs and then munge them appropriately.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

chdir( "$work_dir/phpunit" );
$version = trim( (string) shell_exec( 'composer info phpunit/phpunit --format=json | jq -r \'.versions[0]\'' ) );
if ( ! preg_match( '/^(\d+\.\d+\.\d+)$/', $version ) ) {
	throw new RuntimeException( 'Failed to determine PHPUnit version' );
}

$config = array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from PHPUnit $version
	 * using the definition file `tools/stubs/phpunit-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/phpunit/",
	'files'   => array(),
);

$iter = new AppendIterator();
$iter->append(
	new RecursiveIteratorIterator( new RecursiveDirectoryIterator( 'vendor/phpunit' ) )
);
$iter->append(
	new RecursiveIteratorIterator( new RecursiveDirectoryIterator( 'vendor/sebastian' ) )
);
foreach ( $iter as $k => $v ) {
	if ( str_ends_with( $k, '.php' ) ) {
		$config['files'][ $k ] = '*';
	}
}
ksort( $config['files'] );

return $config;
