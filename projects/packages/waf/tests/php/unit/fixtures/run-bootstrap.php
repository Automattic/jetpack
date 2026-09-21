<?php
/**
 * Runs a generated standalone bootstrap the way `auto_prepend_file` would and reports what it left behind.
 *
 * @package automattic/jetpack-waf
 */

$before = array_keys( get_defined_vars() );

require $argv[1];

$leaked      = array_values( array_diff( array_keys( get_defined_vars() ), $before, array( 'before' ) ) );
$autoloaders = spl_autoload_functions();

echo json_encode(
	array(
		'run'           => defined( 'JETPACK_WAF_RUN' ) ? JETPACK_WAF_RUN : null,
		'autoloaders'   => $autoloaders ? count( $autoloaders ) : 0,
		'variables'     => $leaked,
		'runner_loaded' => class_exists( Automattic\Jetpack\Waf\Waf_Runner::class, false ),
		'package_files' => array_values(
			array_filter(
				get_included_files(),
				function ( $file ) {
					return substr( $file, -11 ) === 'actions.php' || substr( $file, -7 ) === 'cli.php';
				}
			)
		),
	),
	JSON_UNESCAPED_SLASHES
);
