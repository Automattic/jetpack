<?php
/**
 * Activation guard — blocks plugin activations that fail the
 * pre-flight probe so a bad activate click can't fatal the site.
 *
 * Hooked on `load-plugins.php` at priority 0, which fires before the
 * wp-admin/plugins.php inline handler decides what to do with the
 * request. When the request is an `activate` (single or bulk) and
 * the probe returns a fatal / throwable / block, we redirect back
 * with a notice instead of letting core call `activate_plugin()`.
 *
 * Checks are skipped when:
 *   - The nonce is missing or invalid (core will handle that error).
 *   - The plugin file is not locally installed (an uninstalled plugin
 *     can't be activated anyway).
 *   - The guard filter is flipped off via `pcg_guard_activation`.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_action( 'load-plugins.php', 'pcg_guard_maybe_block_activation', 0 );
add_action( 'admin_notices', 'pcg_guard_render_block_notice' );

/**
 * Entry point on `load-plugins.php`. Inspects the request, runs the
 * probe on each plugin being activated, and redirects with a notice
 * when at least one would fatal.
 */
function pcg_guard_maybe_block_activation() {
	if ( ! apply_filters( 'pcg_guard_activation', true ) ) {
		return;
	}
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	$action           = isset( $_REQUEST['action'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['action'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce verified per-branch below.
	$plugins_to_check = array();
	$nonce_action     = '';

	if ( 'activate' === $action ) {
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

	// Verify the nonce ourselves before running the probes; core will
	// do the same check but rejecting here avoids a wasted probe call.
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

	wp_safe_redirect(
		self_admin_url( 'plugins.php?pcg_blocked=1' )
	);
	exit;
}

/**
 * Run the load probe for each plugin and collect reasons for any
 * that fail. Returned array is keyed by plugin basename; empty when
 * all plugins pass (or probe skipped / couldn't complete).
 *
 * @param string[] $plugins Plugin basenames (e.g. "akismet/akismet.php").
 * @return array<string,string> Map of plugin => human-readable block reason.
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
			$blocked[ $plugin ] = sprintf(
				'%s fatals during load: %s',
				$plugin,
				isset( $result['message'] ) ? (string) $result['message'] : 'unknown error'
			);
		}
	}

	return $blocked;
}

/**
 * Render the admin notice when the last request was blocked. The
 * message list is pulled from (and cleared from) a per-user transient
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
		<p><strong>Plugin Conflicts Guardian blocked activation because the pre-flight load probe detected a fatal:</strong></p>
		<ul style="list-style:disc;padding-left:24px;">
			<?php foreach ( $messages as $plugin => $reason ) : ?>
				<li><code><?php echo esc_html( $plugin ); ?></code> — <?php echo esc_html( $reason ); ?></li>
			<?php endforeach; ?>
		</ul>
		<p>The plugin was not activated. Investigate the error before trying again.</p>
	</div>
	<?php
}
