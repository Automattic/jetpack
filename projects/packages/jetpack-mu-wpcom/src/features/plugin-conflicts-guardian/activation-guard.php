<?php
/**
 * Activation guard — blocks plugin activations that fail a pre-flight
 * load probe, so a bad Activate click can't fatal the site.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_action( 'load-plugins.php', 'pcg_guard_maybe_block_activation', 0 );
add_action( 'load-update.php', 'pcg_guard_maybe_block_activation', 0 );
add_action( 'admin_notices', 'pcg_guard_render_block_notice' );

/**
 * Entry point on `load-plugins.php` / `load-update.php`. Probes each
 * plugin being activated and redirects with a notice on any failure.
 */
function pcg_guard_maybe_block_activation() {
	if ( ! apply_filters( 'pcg_guard_activation', false ) ) {
		return;
	}
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	// Bulk-action submissions from the bottom dropdown send `action=-1`
	// and the real action in `action2`.
	$action = sanitize_text_field( wp_unslash( $_REQUEST['action'] ?? '' ) );
	if ( '' === $action || '-1' === $action ) {
		$action = sanitize_text_field( wp_unslash( $_REQUEST['action2'] ?? '' ) );
	}
	if ( ! in_array( $action, array( 'activate', 'activate-plugin', 'activate-selected' ), true ) ) {
		return;
	}

	if ( 'activate-selected' === $action ) {
		$bulk_raw         = is_array( $_REQUEST['checked'] ?? null ) ? (array) wp_unslash( $_REQUEST['checked'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- each entry is sanitized below.
		$plugins_to_check = array_values(
			array_filter(
				array_map( static fn( $b ) => sanitize_text_field( (string) $b ), $bulk_raw )
			)
		);
		$nonce_action     = 'bulk-plugins';
	} else {
		// Single-plugin path (plugins.php Activate link / update.php post-upload link).
		$plugin           = sanitize_text_field( wp_unslash( $_REQUEST['plugin'] ?? '' ) );
		$plugins_to_check = '' !== $plugin ? array( $plugin ) : array();
		$nonce_action     = 'activate-plugin_' . $plugin;
	}
	if ( empty( $plugins_to_check ) ) {
		return;
	}

	// Verify the nonce up front so we don't run probes for a request core
	// will reject anyway. check_admin_referer() die()s on a bad nonce, so
	// we don't need to check its return value.
	if ( ! isset( $_REQUEST['_wpnonce'] ) ) {
		return;
	}
	check_admin_referer( $nonce_action );

	$blocked = pcg_guard_evaluate_plugins( $plugins_to_check );
	if ( empty( $blocked ) ) {
		return;
	}

	set_transient(
		'pcg_guard_notice_' . get_current_user_id(),
		$blocked,
		MINUTE_IN_SECONDS
	);

	wp_safe_redirect( self_admin_url( 'plugins.php?pcg_blocked=1' ) );
	exit;
}

/**
 * Probe the requested plugins together in a single loopback request pair
 * and return a map of basename => reason for any that fail.
 *
 * Eligible plugins (passes `validate_file`, not already active, file
 * exists on disk) are passed to `PCG_Load_Tester::test()` as one batch,
 * so probe cost is constant in N rather than 2N round-trips. As a side
 * effect this also surfaces conflicts that only fire when two plugins
 * load together (duplicate class, shared global, etc.).
 *
 * @param string[] $plugins Plugin basenames (e.g. "akismet/akismet.php").
 * @return array<string,string>
 */
function pcg_guard_evaluate_plugins( $plugins ) {
	$paths = array();
	foreach ( $plugins as $plugin ) {
		if ( 0 !== validate_file( $plugin ) ) {
			continue;
		}
		if ( is_plugin_active( $plugin ) ) {
			continue;
		}
		$path = WP_PLUGIN_DIR . '/' . ltrim( $plugin, '/' );
		if ( ! is_file( $path ) ) {
			continue;
		}
		$paths[ $plugin ] = $path;
	}
	if ( empty( $paths ) ) {
		return array();
	}

	$tester = new PCG_Load_Tester();
	$result = $tester->test( array_values( $paths ) );
	$status = (string) ( $result['status'] ?? '' );
	if ( 'fatal' !== $status && 'throwable' !== $status ) {
		return array();
	}

	$blocked_plugin = pcg_guard_get_blocked_plugin( $result, $paths );
	if ( '' !== $blocked_plugin ) {
		return array(
			$blocked_plugin => pcg_guard_format_block_reason( $result ),
		);
	}

	// Verdict didn't pin a specific plugin (e.g. probe terminated without a
	// JSON body, or the captured `file` was outside any candidate's tree).
	// Surface a batch-level message so we don't blame an arbitrary plugin.
	$reason = sprintf(
		/* translators: 1: locale-formatted list of plugin basenames; 2: probe verdict reason. */
		__( 'One of these plugins caused a fatal during the pre-flight check: %1$s. Reason: %2$s', 'jetpack-mu-wpcom' ),
		wp_sprintf_l( '%l', array_keys( $paths ) ),
		pcg_guard_format_block_reason( $result )
	);
	return array( '' => $reason );
}

/**
 * Map a fatal/throwable verdict back to the plugin basename that caused
 * it. Tries, in order: the explicit `plugin` field on the verdict (set
 * when a `Throwable` was caught around `require`), an exact match of
 * the captured `file` against a plugin's main file (covers flat-file
 * plugins like `hello.php`), and a prefix match of the captured `file`
 * against a plugin's own subdirectory under `WP_PLUGIN_DIR`.
 *
 * Returns `''` when none of those match (e.g. the verdict has no
 * `file`/`plugin`, or `file` lies outside any candidate's tree). The
 * caller is expected to surface a batch-level message in that case
 * rather than guessing a plugin.
 *
 * @param array                $result A fatal/throwable probe verdict.
 * @param array<string,string> $paths  Map of plugin basename => absolute main file path.
 * @return string Plugin basename to attribute the failure to, or '' if undetermined.
 */
function pcg_guard_get_blocked_plugin( $result, $paths ) {
	$explicit = (string) ( $result['plugin'] ?? '' );
	if ( '' !== $explicit ) {
		foreach ( $paths as $basename => $path ) {
			if ( $path === $explicit ) {
				return $basename;
			}
		}
	}

	$fatal_file = (string) ( $result['file'] ?? '' );
	if ( '' !== $fatal_file ) {
		foreach ( $paths as $basename => $path ) {
			if ( $path === $fatal_file ) {
				return $basename;
			}
		}
		// Subdirectory plugins only — a flat-file plugin's dirname is
		// `WP_PLUGIN_DIR`, which would prefix-match every other plugin's
		// files in the batch and produce false attributions.
		foreach ( $paths as $basename => $path ) {
			$plugin_dir = dirname( $path );
			if ( WP_PLUGIN_DIR === $plugin_dir ) {
				continue;
			}
			if ( str_starts_with( $fatal_file, $plugin_dir . '/' ) ) {
				return $basename;
			}
		}
	}

	return '';
}

/**
 * Build a human-readable sentence describing the captured fatal, e.g.
 * "PCG fatal (in pcg-fatal-tester.php, line 6)." for the admin notice.
 *
 * @param array $result Probe result from PCG_Load_Tester::test().
 * @return string
 */
function pcg_guard_format_block_reason( $result ) {
	$message = trim( (string) ( $result['message'] ?? '' ) );

	$where = '';
	if ( ! empty( $result['file'] ) ) {
		$file  = basename( (string) $result['file'] );
		$line  = (int) ( $result['line'] ?? 0 );
		$where = $line > 0
			? sprintf(
				/* translators: location fragment, e.g. "in plugin.php, line 42". 1: file name, 2: line number. */
				__( 'in %1$s, line %2$d', 'jetpack-mu-wpcom' ),
				$file,
				$line
			)
			: sprintf(
				/* translators: location fragment without a line number, e.g. "in plugin.php". %s: file name. */
				__( 'in %s', 'jetpack-mu-wpcom' ),
				$file
			);
	}

	if ( '' !== $message ) {
		return '' !== $where ? sprintf( '%s (%s).', $message, $where ) : $message . '.';
	}
	if ( '' !== $where ) {
		return sprintf(
			/* translators: %s: location fragment from the strings above, which already begins with "in". */
			__( 'A fatal PHP error was detected %s.', 'jetpack-mu-wpcom' ),
			$where
		);
	}
	return __( 'A fatal PHP error was detected.', 'jetpack-mu-wpcom' );
}

/**
 * Render the admin notice. Messages are pulled from a per-user transient
 * set by the guard before the redirect.
 */
function pcg_guard_render_block_notice() {
	if ( empty( $_GET['pcg_blocked'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only flag for rendering a flash notice.
		return;
	}
	$key      = 'pcg_guard_notice_' . get_current_user_id();
	$messages = get_transient( $key );
	delete_transient( $key );

	if ( ! is_array( $messages ) || empty( $messages ) ) {
		return;
	}
	?>
	<div class="notice notice-error">
		<p><strong><?php esc_html_e( 'WordPress.com blocked activation because the pre-flight check detected a fatal:', 'jetpack-mu-wpcom' ); ?></strong></p>
		<ul style="list-style:disc;padding-inline-start:24px;">
			<?php foreach ( $messages as $plugin => $reason ) : ?>
				<li>
					<?php if ( '' !== (string) $plugin ) : ?>
						<code><?php echo esc_html( $plugin ); ?></code> — <?php echo esc_html( $reason ); ?>
					<?php else : ?>
						<?php echo esc_html( $reason ); ?>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
		<p><?php esc_html_e( 'No plugins were activated to prevent a site crash. Investigate the error before trying again.', 'jetpack-mu-wpcom' ); ?></p>
	</div>
	<?php
}
