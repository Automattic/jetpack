<?php
/**
 * Update guard — refuses plugin installs / updates when the unpacked
 * package contains PHP parse errors.
 *
 * See README.md for the "why syntax-only" rationale.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_filter( 'upgrader_source_selection', 'pcg_update_guard_check', 99, 4 );

/**
 * Filter callback. Returns a WP_Error (aborts the install/update) when
 * the extracted source contains any PHP parse errors.
 *
 * @param string|WP_Error $source        Extracted source directory, or error from a prior filter.
 * @param string          $remote_source Original remote source path (unused).
 * @param WP_Upgrader     $upgrader      Upgrader instance (unused).
 * @param array           $hook_extra    { type, action, plugin?, theme? }.
 * @return string|WP_Error
 */
function pcg_update_guard_check( $source, $remote_source, $upgrader, $hook_extra = array() ) {
	unset( $remote_source, $upgrader );

	if ( is_wp_error( $source ) ) {
		return $source;
	}
	if ( ! apply_filters( 'pcg_guard_activation', true ) ) {
		return $source;
	}
	if ( 'plugin' !== ( $hook_extra['type'] ?? '' ) ) {
		return $source;
	}
	$action = (string) ( $hook_extra['action'] ?? '' );
	if ( ! in_array( $action, array( 'install', 'update' ), true ) ) {
		return $source;
	}

	$errors = pcg_update_guard_scan_for_parse_errors( (string) $source );
	if ( empty( $errors ) ) {
		return $source;
	}

	$label = 'update' === $action ? 'update' : 'install';
	$lines = array();
	foreach ( array_slice( $errors, 0, 5 ) as $err ) {
		$lines[] = sprintf(
			'%s (line %d): %s',
			basename( $err['file'] ),
			$err['line'],
			$err['message']
		);
	}
	if ( count( $errors ) > 5 ) {
		$lines[] = sprintf( '… and %d more.', count( $errors ) - 5 );
	}

	return new WP_Error(
		'pcg_update_parse_error',
		sprintf(
			"WordPress.com blocked the %s: the package contains PHP parse error(s).\n- %s",
			$label,
			implode( "\n- ", $lines )
		)
	);
}

/**
 * Tokenize every `.php` under $dir with TOKEN_PARSE and return the failures.
 *
 * @param string $dir Extracted package directory.
 * @return array<int,array{file:string,line:int,message:string}>
 */
function pcg_update_guard_scan_for_parse_errors( $dir ) {
	if ( '' === $dir || ! is_dir( $dir ) ) {
		return array();
	}

	$errors = array();
	$iter   = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS )
	);
	foreach ( $iter as $path => $file ) {
		if ( ! $file->isFile() || 'php' !== strtolower( $file->getExtension() ) ) {
			continue;
		}
		$code = @file_get_contents( (string) $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local read; errors are non-fatal and skipped.
		if ( false === $code ) {
			continue;
		}
		try {
			// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariableAssignmentInFunctionBeforeUse -- called for its parse-error side effect.
			$tokens = token_get_all( $code, TOKEN_PARSE );
			unset( $tokens );
		} catch ( \ParseError $e ) {
			$errors[] = array(
				'file'    => (string) $path,
				'line'    => $e->getLine(),
				'message' => $e->getMessage(),
			);
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- tolerate weird files.
			// Fall through.
		}
	}
	return $errors;
}
