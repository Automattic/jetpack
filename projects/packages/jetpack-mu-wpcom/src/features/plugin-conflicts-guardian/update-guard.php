<?php
/**
 * Update guard — refuses plugin installs / updates when the unpacked
 * package contains PHP parse errors.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_filter( 'upgrader_source_selection', 'pcg_update_guard_check', 99, 4 );
add_action( 'admin_notices', 'pcg_update_guard_render_retry_notice' );

/**
 * Wall-clock budget (seconds) for scanning a package for parse errors.
 * Big packages (looking at you, WooCommerce) can have thousands of PHP
 * files; we'd rather bail out cleanly than blow the cron / request
 * timeout.
 */
const PCG_UPDATE_GUARD_BUDGET_SECONDS = 8.0;

/**
 * Capability that gates the update guard for a given upgrader action.
 * `install` → `install_plugins`; everything else (i.e. `update`) → `update_plugins`.
 * Stock WP roles bundle both on administrator, but a custom role plugin
 * could split them — derive the cap from the action so we honor that.
 *
 * @param string $action `install` or `update`.
 * @return string
 */
function pcg_update_guard_cap_for_action( $action ) {
	return 'install' === $action ? 'install_plugins' : 'update_plugins';
}

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
	if ( ! apply_filters( 'pcg_guard_updates', true ) ) {
		return $source;
	}
	$type   = $hook_extra['type'] ?? '';
	$action = (string) ( $hook_extra['action'] ?? '' );
	if ( 'plugin' !== $type || ! in_array( $action, array( 'install', 'update' ), true ) ) {
		return $source;
	}
	if ( pcg_force_override_active( pcg_update_guard_cap_for_action( $action ) ) ) {
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
	pcg_update_guard_stash_retry_context( $action, $hook_extra, (string) $source );

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
 * Log a refused install/update to logstash. Best-effort.
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
 * Stash the slug/action of a blocked install or update so the next admin
 * page render can offer a force-retry button. Only logged-in users with
 * `update_plugins` get a stash (the only callers who'll see the notice).
 *
 * @param string $action     `install` or `update`.
 * @param array  $hook_extra Hook payload from `upgrader_source_selection`.
 * @param string $source     Extracted package directory — fallback slug source on installs,
 *                           since `Plugin_Upgrader::install()` doesn't populate `hook_extra['plugin']`.
 * @return void
 */
function pcg_update_guard_stash_retry_context( $action, array $hook_extra, $source = '' ) {
	if ( ! is_user_logged_in() || ! current_user_can( pcg_update_guard_cap_for_action( $action ) ) ) {
		return;
	}
	$slug = (string) ( $hook_extra['plugin'] ?? '' );
	if ( '' === $slug && '' !== $source ) {
		$slug = basename( untrailingslashit( $source ) );
	}
	if ( '' === $slug ) {
		return;
	}
	set_transient(
		'pcg_update_blocked_' . get_current_user_id(),
		array(
			'slug'   => $slug,
			'action' => (string) $action,
		),
		5 * MINUTE_IN_SECONDS
	);
}

/**
 * Render an admin notice that offers force-retry options after an update
 * block. The transient is set by the upgrader filter; we consume it here.
 */
function pcg_update_guard_render_retry_notice() {
	if ( ! is_user_logged_in() ) {
		return;
	}
	$key = 'pcg_update_blocked_' . get_current_user_id();
	$ctx = get_transient( $key );
	if ( ! is_array( $ctx ) || empty( $ctx['slug'] ) ) {
		return;
	}
	$action = (string) ( $ctx['action'] ?? '' );
	if ( ! current_user_can( pcg_update_guard_cap_for_action( $action ) ) ) {
		return;
	}
	delete_transient( $key );

	$slug      = (string) $ctx['slug'];
	$is_update = 'install' !== $action;
	// One-shot retry only makes sense for updates: the original update
	// request is replay-safe (the .org zip URL is reproducible). Installs
	// from an uploaded zip aren't — there's no zip to replay — and even
	// .org installs would need the user back on the Add Plugin page, so
	// we only surface the bypass-then-retry path for installs.
	$retry = $is_update
		? wp_nonce_url(
			add_query_arg(
				array(
					'action'    => 'upgrade-plugin',
					'plugin'    => $slug,
					'pcg_force' => '1',
				),
				self_admin_url( 'update.php' )
			),
			'upgrade-plugin_' . $slug
		)
		: '';
	?>
	<div class="notice notice-warning">
		<p>
			<strong>
				<?php
				if ( $is_update ) {
					esc_html_e( 'WordPress.com blocked the last plugin update because the package failed PCG checks:', 'jetpack-mu-wpcom' );
				} else {
					esc_html_e( 'WordPress.com blocked the last plugin install because the package failed PCG checks:', 'jetpack-mu-wpcom' );
				}
				?>
			</strong>
			<code><?php echo esc_html( $slug ); ?></code>.
			<?php esc_html_e( 'Try one of these overrides:', 'jetpack-mu-wpcom' ); ?>
		</p>
		<ul style="list-style:disc;padding-inline-start:24px;margin-block-end:0;">
			<?php if ( $is_update ) : ?>
				<?php $plugin_name = function_exists( 'pcg_guard_plugin_display_name' ) ? pcg_guard_plugin_display_name( $slug ) : ''; ?>
				<li>
					<a href="<?php echo esc_url( $retry ); ?>" class="button-link">
						<?php
						if ( '' !== $plugin_name ) {
							printf(
								/* translators: %s: plugin display name. */
								esc_html__( 'Update %s anyway', 'jetpack-mu-wpcom' ),
								esc_html( $plugin_name )
							);
						} else {
							esc_html_e( 'Update anyway', 'jetpack-mu-wpcom' );
						}
						?>
					</a>
				</li>
			<?php endif; ?>
			<li><?php pcg_force_render_bypass_form(); ?></li>
		</ul>
	</div>
	<?php
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
