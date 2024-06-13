#!/usr/bin/env php
<?php
/**
 * A tool to generate a GitHub Actions matrix for the CI workflow.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.GlobalVariablesOverride

chdir( __DIR__ . '/../../' );

// Default versions for PHP and Node.
$versions = array();
foreach ( file( '.github/versions.sh' ) as $line ) {
	$line = trim( $line );
	if ( '' === $line || '#' === $line[0] ) {
		continue;
	}
	list( $k, $v )  = explode( '=', $line, 2 );
	$versions[ $k ] = $v;
}

// Default matrix variables. See inline for docs.
$default_matrix_vars = array(
	// {string} Name for the job. Required, and must be unique.
	'name'                => null,

	// {string} Composer script for the job. Required.
	'script'              => null,

	// {string} PHP version to use.
	'php'                 => $versions['PHP_VERSION'],

	// {string} Node version to use.
	'node'                => $versions['NODE_VERSION'],

	// {string} WordPress version to check out: 'latest', 'previous', 'trunk', or 'none'.
	'wp'                  => 'none',

	// {bool} Whether the check is experimental, i.e. it won't make the workflow fail. Don't set this when the job is required!
	'experimental'        => false,

	// {bool} Whether to force package tests to run. Normally they only run when 'wp' is 'latest' or 'none'.
	'force-package-tests' => false,

	// {int} Job timeout in minutes.
	'timeout'             => 10,

	// {string} A valid artifact name for any generated artifacts. If not given, will be derived from the name.
	'artifact'            => null,

	// {bool} Whether to install WooCommerce.
	'with-woocommerce'    => false,
);

// Matrix definitions. Each will be combined with `$default_matrix_vars` later in processing.
$matrix = array();

// Add PHP tests.
foreach ( array( '7.0', '7.2', '7.3', '7.4', '8.0', '8.1', '8.2', '8.3' ) as $php ) {
	$matrix[] = array(
		'name'    => "PHP tests: PHP $php WP latest",
		'script'  => 'test-php',
		'php'     => $php,
		'wp'      => 'latest',
		'timeout' => 20, // 2023-08-17: Successful runs seem to take up to ~12 minutes.
	);
}

foreach ( array( 'previous', 'trunk' ) as $wp ) {
	$phpver   = $versions['PHP_VERSION'];
	$matrix[] = array(
		'name'    => "PHP tests: PHP {$phpver} WP $wp",
		'script'  => 'test-php',
		'php'     => $phpver,
		'wp'      => $wp,
		'timeout' => 15, // 2021-01-18: Successful runs seem to take ~8 minutes for the 7.4 trunk run, ~5.5-6 for 7.x and 8.0.
	);
}

// Add WooCommerce tests.
$matrix[] = array(
	'name'             => 'PHP tests: PHP 7.4 WP latest with WooCommerce',
	'script'           => 'test-php',
	'php'              => '7.4',
	'wp'               => 'latest',
	'timeout'          => 20,
	'with-woocommerce' => true,
);

/**
 * Here is the place where wpcomsh tests would be introduced by adding 'with-wpcomsh' property set to true.
 * This adds a new run into the matrix that would enable wpcomsh loading with unit tests.
 */

// Add JS tests.
$matrix[] = array(
	'name'    => 'JS tests',
	'script'  => 'test-js',
	'timeout' => 15, // 2021-01-18: Successful runs seem to take ~5 minutes.
);

// END matrix definitions.
// Now, validation.

$any_errors = false;

/**
 * Output an error for GH Actions.
 *
 * @param string $fmt Format string for printf.
 * @param mixed  ...$args Arguments as for printf.
 */
function error( $fmt, ...$args ) {
	global $any_errors;

	$any_errors = true;

	$msg = strtr(
		sprintf( $fmt, ...$args ),
		array(
			"\r" => '',
			"\n" => '%0A',
		)
	);
	fprintf( STDERR, "---\n::error::%s\n---\n", $msg );
}

/**
 * Join an array with commas and "or".
 *
 * @param array $vals Values to join.
 * @return string
 */
function join_or( $vals ) {
	if ( count( $vals ) > 1 ) {
		$vals                       = array_values( $vals );
		$vals[ count( $vals ) - 1 ] = 'or ' . $vals[ count( $vals ) - 1 ];
	}
	return implode( count( $vals ) > 2 ? ', ' : ' ', $vals );
}

$names     = array();
$artifacts = array();
foreach ( $matrix as &$m ) {
	$orig = json_encode( $m, JSON_FORCE_OBJECT | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
	$m   += $default_matrix_vars;

	// Name must be a non-empty string, and must be unique.
	if ( ! is_string( $m['name'] ) || '' === $m['name'] ) {
		error( "Matrix entry does not have a valid `name`:\n%s", $orig );
		continue;
	}
	if ( isset( $names[ $m['name'] ] ) ) {
		error( "Duplicate entries for name '%s':\n%s\n%s", $m['name'], $names[ $m['name'] ], $orig );
	} else {
		$names[ $m['name'] ] = $orig;
	}

	// Script must be a non-empty string.
	if ( ! is_string( $m['script'] ) || '' === $m['script'] ) {
		error( "Matrix entry does not have a `script`:\n%s", $orig );
	}

	// Default artifact from name.
	if ( null === $m['artifact'] ) {
		$m['artifact'] = strtr(
			$m['name'],
			array(
				': ' => ' - ',
			)
		);
	}

	// Validate artifact characters.
	// @see https://github.com/actions/toolkit/blob/main/packages/artifact/docs/additional-information.md#non-supported-characters .
	$chars = array(
		'"'  => 'double quotes',
		':'  => 'colons',
		'<'  => 'angle brackets',
		'>'  => 'angle brackets',
		'|'  => 'pipes',
		'*'  => 'asterisks',
		'?'  => 'question marks',
		'\\' => 'backslashes',
		'/'  => 'slashes',
	);
	$bad   = array();
	foreach ( $chars as $char => $name ) {
		if ( strpos( $m['artifact'], $char ) !== false ) {
			$bad[] = $name;
		}
	}
	if ( $bad ) {
		$bad = join_or( array_unique( $bad ) );
		error( "Artifact name '%s' cannot contain $bad", $m['artifact'] );
	}

	// Artifact name must be unique.
	if ( isset( $artifacts[ $m['artifact'] ] ) ) {
		error( "Duplicate entries for artifact '%s':\n%s\n%s", $m['artifact'], $artifacts[ $m['artifact'] ], $orig );
	} else {
		$artifacts[ $m['artifact'] ] = $orig;
	}

	// Values for `php` and `node` must be strings, floats will break.
	foreach ( array( 'php', 'node' ) as $key ) {
		if ( ! is_string( $m[ $key ] ) ) {
			error( "Key '%s' must be a string\n%s", $key, $orig );
		}
	}

	// Only specific values allowed for `wp`.
	$valid_wp = array( 'latest', 'previous', 'trunk', 'none' );
	if ( ! in_array( $m['wp'], $valid_wp, true ) ) {
		$valid_wp = join_or(
			array_map(
				function ( $v ) {
					return "'$v'";
				},
				$valid_wp
			)
		);
		error( "Key `wp` must be %s\n%s", $valid_wp, $orig );
	}
}
unset( $m );

if ( $any_errors ) {
	exit( 1 );
}

echo json_encode( $matrix, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "\n";
