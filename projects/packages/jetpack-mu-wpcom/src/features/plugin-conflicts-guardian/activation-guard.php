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
 * Probe each plugin; return map of basename => reason for those that failed.
 *
 * @param string[] $plugins Plugin basenames (e.g. "akismet/akismet.php").
 * @return array<string,string>
 */
function pcg_guard_evaluate_plugins( $plugins ) {
	$blocked = array();
	$tester  = new PCG_Load_Tester();

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
		$result = $tester->test( $path );
		$status = (string) ( $result['status'] ?? '' );
		if ( 'fatal' === $status || 'throwable' === $status ) {
			$blocked[ $plugin ] = pcg_guard_format_block_reason( $result );
		}
	}

	return $blocked;
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
				<li><code><?php echo esc_html( $plugin ); ?></code> — <?php echo esc_html( $reason ); ?></li>
			<?php endforeach; ?>
		</ul>
		<p><?php esc_html_e( 'The plugin was not activated. Investigate the error before trying again.', 'jetpack-mu-wpcom' ); ?></p>
	</div>
	<?php
}
