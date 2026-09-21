<?php
/**
 * Runs a generated standalone bootstrap the way `auto_prepend_file` would and reports what it left behind.
 *
 * @package automattic/jetpack-waf
 */

require $argv[1];

$autoloaders = spl_autoload_functions();

echo json_encode(
	array(
		'run'           => defined( 'JETPACK_WAF_RUN' ) ? JETPACK_WAF_RUN : null,
		'autoloaders'   => $autoloaders ? count( $autoloaders ) : 0,
		'variables'     => array_values( array_intersect( array_keys( get_defined_vars() ), array( 'jetpack_waf_classmap_file', 'jetpack_waf_classmap', 'jetpack_waf_autoloader' ) ) ),
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
