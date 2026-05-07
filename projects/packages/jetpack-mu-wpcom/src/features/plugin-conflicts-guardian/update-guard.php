<?php
/**
 * Update guard — refuses plugin installs / updates when the unpacked
 * package contains PHP parse errors.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_filter( 'upgrader_source_selection', 'pcg_update_guard_check', 99, 4 );

/**
 * Wall-clock budget (seconds) for scanning a package for parse errors.
 * Big packages (looking at you, WooCommerce) can have thousands of PHP
 * files; we'd rather bail out cleanly than blow the cron / request
 * timeout.
 */
const PCG_UPDATE_GUARD_BUDGET_SECONDS = 8.0;

/**
 * Filter callback. Returns a WP_Error (aborts the install/update) when
 * the extracted source contains any PHP parse errors.
 *
 * @param string|WP_Error  $source        Extracted source directory, or error from a prior filter.
 * @param string           $remote_source Original remote source path (unused).
 * @param WP_Upgrader|null $upgrader      Upgrader instance (unused).
 * @param array            $hook_extra    { type, action, plugin?, theme? }.
 * @return string|WP_Error
 */
function pcg_update_guard_check( $source, $remote_source, $upgrader, $hook_extra = array() ) {
	unset( $remote_source, $upgrader );

	if ( is_wp_error( $source ) ) {
		return $source;
	}
	if ( ! apply_filters( 'pcg_guard_activation', false ) ) {
		return $source;
	}
	$type   = $hook_extra['type'] ?? '';
	$action = (string) ( $hook_extra['action'] ?? '' );
	if ( 'plugin' !== $type || ! in_array( $action, array( 'install', 'update' ), true ) ) {
		return $source;
	}

	$scan = pcg_update_guard_scan_for_parse_errors( (string) $source );

	if ( empty( $scan['errors'] ) ) {
		if ( $scan['budget_exceeded'] ) {
			// Don't fail-closed on a slow scan; log so we can see how often
			// this fires and which packages trip it.
			$slug = (string) ( $hook_extra['plugin'] ?? ( $hook_extra['theme'] ?? '' ) );
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				sprintf( 'PCG update guard: scan exceeded %.1fs budget for %s; allowing %s.', PCG_UPDATE_GUARD_BUDGET_SECONDS, $slug, $action )
			);
		}
		return $source;
	}

	$first = $scan['errors'][0];

	pcg_update_guard_log_blocked( $action, $hook_extra, $scan, (string) $source );

	return new WP_Error(
		'pcg_update_parse_error',
		sprintf(
			/* translators: 1: install or update, 2: file name, 3: line number, 4: PHP parse-error message. */
			__( 'WordPress.com blocked the %1$s: the package contains a PHP parse error in %2$s (line %3$d): %4$s', 'jetpack-mu-wpcom' ),
			'update' === $action ? __( 'update', 'jetpack-mu-wpcom' ) : __( 'install', 'jetpack-mu-wpcom' ),
			basename( $first['file'] ),
			(int) $first['line'],
			(string) $first['message']
		),
		array( 'errors' => $scan['errors'] )
	);
}

/**
 * Log a refused install/update to logstash. Best-effort; no-op off WordPress.com.
 *
 * @param string $action     `install` or `update`.
 * @param array  $hook_extra Hook payload from `upgrader_source_selection`.
 * @param array  $scan       Result from `pcg_update_guard_scan_for_parse_errors()`.
 * @param string $source     Extracted package directory (fallback slug source on installs,
 *                           since `Plugin_Upgrader::install()` doesn't populate `hook_extra['plugin']`).
 * @return void
 */
function pcg_update_guard_log_blocked( $action, array $hook_extra, array $scan, $source = '' ) {
	$first = $scan['errors'][0];

	$slug = (string) ( $hook_extra['plugin'] ?? ( $hook_extra['theme'] ?? '' ) );
	if ( '' === $slug && '' !== $source ) {
		$slug = basename( untrailingslashit( $source ) );
	}

	pcg_log_event(
		'Update blocked',
		array(
			'action'      => (string) $action,
			'slug'        => $slug,
			// Basename only — absolute paths leak install layout.
			'file'        => basename( (string) $first['file'] ),
			'line'        => (int) $first['line'],
			'reason'      => (string) $first['message'],
			'error_count' => count( $scan['errors'] ),
		)
	);
}

/**
 * Tokenize every `.php` under $dir with TOKEN_PARSE and collect the failures.
 * Bails out once the wall-clock budget is exceeded.
 *
 * @param string $dir Extracted package directory.
 * @return array{errors:array<int,array{file:string,line:int,message:string}>,budget_exceeded:bool}
 */
function pcg_update_guard_scan_for_parse_errors( $dir ) {
	$result = array(
		'errors'          => array(),
		'budget_exceeded' => false,
	);
	if ( '' === $dir || ! is_dir( $dir ) ) {
		return $result;
	}

	$started_at = microtime( true );
	$iter       = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS )
	);
	foreach ( $iter as $path => $file ) {
		if ( ! $file->isFile() || 'php' !== strtolower( $file->getExtension() ) ) {
			continue;
		}
		if ( ! is_readable( (string) $path ) ) {
			continue;
		}
		if ( ( microtime( true ) - $started_at ) > PCG_UPDATE_GUARD_BUDGET_SECONDS ) {
			$result['budget_exceeded'] = true;
			return $result;
		}
		$code = file_get_contents( (string) $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local read inside a scan loop; WP_Filesystem is overkill here.
		if ( false === $code ) {
			continue;
		}
		try {
			// @phan-suppress-next-line PhanPluginUseReturnValueInternalKnown -- called only for the ParseError it throws under TOKEN_PARSE; tokens themselves are unused.
			token_get_all( $code, TOKEN_PARSE );
		} catch ( \ParseError $e ) {
			$result['errors'][] = array(
				'file'    => (string) $path,
				'line'    => $e->getLine(),
				'message' => $e->getMessage(),
			);
		} catch ( \Throwable $e ) {
			unset( $e );
		}
	}
	return $result;
}
