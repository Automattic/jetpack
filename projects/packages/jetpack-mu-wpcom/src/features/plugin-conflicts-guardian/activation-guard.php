<?php
/**
 * Activation guard — blocks plugin activations that fail a pre-flight
 * load probe, so a bad Activate click can't fatal the site.
 *
 * See README.md for the covered activation entry points and the flow.
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

	$action           = isset( $_REQUEST['action'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['action'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce verified per-branch below.
	$plugins_to_check = array();
	$nonce_action     = '';

	// Single-plugin path (plugins.php Activate link / update.php post-upload link).
	if ( 'activate' === $action || 'activate-plugin' === $action ) {
		$plugin = isset( $_REQUEST['plugin'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['plugin'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce verified below.
		if ( '' === $plugin ) {
			return;
		}
		$nonce_action       = 'activate-plugin_' . $plugin;
		$plugins_to_check[] = $plugin;
	} elseif ( 'activate-selected' === $action ) {
		$bulk_raw = isset( $_REQUEST['checked'] ) && is_array( $_REQUEST['checked'] ) ? (array) wp_unslash( $_REQUEST['checked'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- each entry is sanitized below.
		if ( empty( $bulk_raw ) ) {
			return;
		}
		$nonce_action     = 'bulk-plugins';
		$plugins_to_check = array_values(
			array_filter(
				array_map(
					static function ( $basename ) {
						return sanitize_text_field( (string) $basename );
					},
					$bulk_raw
				)
			)
		);
	} else {
		return;
	}

	// Verify the nonce up front so we don't run probes for a request core will reject anyway.
	if ( ! isset( $_REQUEST['_wpnonce'] ) || false === check_admin_referer( $nonce_action ) ) {
		return;
	}

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
		$path = WP_PLUGIN_DIR . '/' . ltrim( plugin_basename( $plugin ), '/' );
		if ( ! is_file( $path ) ) {
			continue;
		}
		$result = $tester->test( $path );
		$status = isset( $result['status'] ) ? (string) $result['status'] : '';
		if ( 'fatal' === $status || 'throwable' === $status ) {
			$blocked[ $plugin ] = pcg_guard_format_block_reason( $result );
		}
	}

	return $blocked;
}

/**
 * Format a human-readable reason like "E_USER_ERROR: msg (file.php, line 42)".
 *
 * @param array $result Probe result from PCG_Load_Tester::test().
 * @return string
 */
function pcg_guard_format_block_reason( $result ) {
	$message = isset( $result['message'] ) ? trim( (string) $result['message'] ) : '';
	if ( '' === $message ) {
		$message = 'unknown error';
	}

	$status = $result['status'] ?? '';
	$label  = '';
	if ( 'throwable' === $status && ! empty( $result['class'] ) ) {
		$label = (string) $result['class'];
	} elseif ( 'fatal' === $status && isset( $result['errno'] ) ) {
		$label = pcg_guard_errno_name( (int) $result['errno'] );
	}

	$location = '';
	if ( ! empty( $result['file'] ) ) {
		$file     = basename( (string) $result['file'] );
		$line     = isset( $result['line'] ) ? (int) $result['line'] : 0;
		$location = $line > 0
			? sprintf( ' (%s, line %d)', $file, $line )
			: sprintf( ' (%s)', $file );
	}

	return '' !== $label
		? sprintf( '%s: %s%s', $label, $message, $location )
		: $message . $location;
}

/**
 * Symbolic name (E_ERROR, …) for a PHP error-constant value.
 *
 * @param int $errno PHP error-constant value.
 * @return string
 */
function pcg_guard_errno_name( $errno ) {
	$names = array(
		E_ERROR             => 'E_ERROR',
		E_PARSE             => 'E_PARSE',
		E_CORE_ERROR        => 'E_CORE_ERROR',
		E_COMPILE_ERROR     => 'E_COMPILE_ERROR',
		E_USER_ERROR        => 'E_USER_ERROR',
		E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
	);
	return $names[ $errno ] ?? sprintf( 'error %d', $errno );
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
		<p><strong>WordPress.com blocked activation because the pre-flight check detected a fatal:</strong></p>
		<ul style="list-style:disc;padding-inline-start:24px;">
			<?php foreach ( $messages as $plugin => $reason ) : ?>
				<li><code><?php echo esc_html( $plugin ); ?></code> — <?php echo esc_html( $reason ); ?></li>
			<?php endforeach; ?>
		</ul>
		<p>The plugin was not activated. Investigate the error before trying again.</p>
	</div>
	<?php
}
