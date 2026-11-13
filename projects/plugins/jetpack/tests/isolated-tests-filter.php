<?php
/**
 * Prints a PHPUnit `--filter` regex matching every test that runs in a separate process.
 *
 * Usage: php tests/isolated-tests-filter.php [--exclude]
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.Security.EscapeOutput.OutputNotEscaped

/**
 * Returns the identifier that directly follows token $i, or null.
 *
 * @param array $tokens Tokens from token_get_all().
 * @param int   $i      Index of the T_CLASS or T_FUNCTION token.
 * @return string|null
 */
function jetpack_isolated_tests_next_name( array $tokens, int $i ) {
	$prev = $tokens[ $i - 1 ] ?? null;
	if ( is_array( $prev ) && T_DOUBLE_COLON === $prev[0] ) {
		return null;
	}
	$next = $tokens[ $i + 1 ] ?? null;
	if ( is_array( $next ) && T_WHITESPACE === $next[0] ) {
		$next = $tokens[ $i + 2 ] ?? null;
	}
	return is_array( $next ) && T_STRING === $next[0] ? $next[1] : null;
}

$exclude = in_array( '--exclude', $argv, true );
$names   = array();

$files = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( __DIR__ . '/php', FilesystemIterator::SKIP_DOTS ) );
foreach ( $files as $file ) {
	if ( 'Test.php' !== substr( $file->getFilename(), -8 ) ) {
		continue;
	}

	$tokens = token_get_all( file_get_contents( $file->getPathname() ) );
	$class  = null;
	$meta   = '';
	foreach ( $tokens as $i => $token ) {
		if ( ! is_array( $token ) ) {
			if ( '{' !== $token && ';' !== $token ) {
				continue;
			}
			$meta = '';
			continue;
		}

		switch ( $token[0] ) {
			case T_DOC_COMMENT:
			case T_COMMENT: // `#[...]` on PHP 7.4.
			case T_STRING: // Attribute contents on PHP 8.
				$meta .= $token[1];
				break;
			case T_CLASS:
				$name = jetpack_isolated_tests_next_name( $tokens, $i );
				if ( null === $name ) {
					break; // `Foo::class`, or an anonymous class.
				}
				$class = $name;
				if ( preg_match( '/RunTestsInSeparateProcesses|@runTestsInSeparateProcesses/', $meta ) ) {
					$names[] = preg_quote( $class, '/' ) . '::\w+';
				}
				$meta = '';
				break;
			case T_FUNCTION:
				$method = jetpack_isolated_tests_next_name( $tokens, $i );
				if ( $class && $method && preg_match( '/RunInSeparateProcess\b|@runInSeparateProcess\b/', $meta ) ) {
					$names[] = preg_quote( "$class::$method", '/' );
				}
				$meta = '';
				break;
		}
	}
}

if ( ! $names ) {
	fwrite( STDERR, "No tests run in a separate process.\n" );
	exit( 1 );
}

sort( $names );
$match = '(?:' . implode( '|', array_unique( $names ) ) . ')(?: |$)';
echo $exclude ? "/^(?!$match)/" : "/^$match/";
