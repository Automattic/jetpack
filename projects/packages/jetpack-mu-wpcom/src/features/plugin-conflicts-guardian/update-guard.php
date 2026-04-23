<?php
/**
 * Update guard — refuses plugin installs / updates when the unpacked
 * package contains PHP parse errors.
 *
 * Hooks `upgrader_source_selection`, which fires after WP extracts
 * the install/update zip into a temporary source directory but
 * before it copies files over the live plugin. Returning a WP_Error
 * from that filter aborts the operation; the existing plugin files
 * stay untouched.
 *
 * Why syntax-only (not a full load probe like activation-guard does):
 *   - During a plugin *update*, the active version is already loaded
 *     in the probe request, so `require`-ing the new version's main
 *     file would always fatal with "Cannot redeclare class/function"
 *     even when the new version is perfectly fine — the probe can't
 *     distinguish real failures from that benign collision.
 *   - Side-stepping the collision would need a sandboxed bootstrap
 *     (SHORTINIT or a CLI subprocess) that isn't portable across
 *     hosts — exactly the constraint that pushed the activation
 *     probe to an HTTP round-trip.
 *   - Parse errors are the high-frequency failure mode for releases
 *     (typos, unmatched braces, bad early-9x syntax). Catching them
 *     cheaply here keeps the obvious breakage out of production;
 *     runtime errors still trip on the next Activate click via the
 *     activation guard.
 *
 * Gated by the same `pcg_guard_activation` filter as the activation
 * guard so the feature's single on/off knob covers both.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_filter( 'upgrader_source_selection', 'pcg_update_guard_check', 99, 4 );

/**
 * Filter callback. Runs the syntax sweep over the extracted source
 * and returns a WP_Error (which aborts the install/update) when any
 * parse error is found.
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
 * Tokenize every `.php` file under the package with `TOKEN_PARSE` and
 * collect any that fail. Errors other than parse errors (unreadable
 * files, weird binaries) are swallowed so one bad entry doesn't
 * abort the sweep.
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
			token_get_all( $code, TOKEN_PARSE );
		} catch ( \ParseError $e ) {
			$errors[] = array(
				'file'    => (string) $path,
				'line'    => (int) $e->getLine(),
				'message' => (string) $e->getMessage(),
			);
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- tolerate weird files.
			// Fall through.
		}
	}
	return $errors;
}
