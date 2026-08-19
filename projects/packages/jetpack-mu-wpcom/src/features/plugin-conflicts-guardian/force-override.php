<?php
/**
 * Force-override controls for the activation / update guards.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_action( 'admin_post_pcg_force_set_bypass', 'pcg_force_handle_set_bypass' );

const PCG_FORCE_BYPASS_TTL = 600;

/**
 * True when the current request is allowed to skip PCG checks, either
 * via an explicit `pcg_force=1` flag on the current action's nonce or
 * a short-lived per-user bypass transient.
 *
 * @param string $cap Capability the caller requires (e.g. `activate_plugins`, `update_plugins`).
 * @return bool
 */
function pcg_force_override_active( $cap ) {
	if ( ! is_user_logged_in() || ! current_user_can( $cap ) ) {
		return false;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the surrounding action's own nonce gates the request; pcg_force is just a hint.
	$force = sanitize_text_field( wp_unslash( $_REQUEST['pcg_force'] ?? '' ) );
	if ( '1' === $force ) {
		pcg_log_event( 'Force override used', array( 'source' => 'pcg_force_flag' ) );
		return true;
	}

	if ( get_transient( pcg_force_bypass_key() ) ) {
		pcg_log_event( 'Force override used', array( 'source' => 'bypass_transient' ) );
		return true;
	}

	return false;
}

/**
 * Per-user transient key for the time-boxed bypass.
 *
 * @return string
 */
function pcg_force_bypass_key() {
	return 'pcg_force_bypass_' . get_current_user_id();
}

/**
 * Admin-post handler — sets the bypass transient and redirects back.
 *
 * @return never
 */
function pcg_force_handle_set_bypass(): never {
	if (
		! current_user_can( 'activate_plugins' )
		&& ! current_user_can( 'update_plugins' )
		&& ! current_user_can( 'install_plugins' )
		&& ! current_user_can( 'upload_plugins' )
	) {
		wp_die( esc_html__( 'You do not have permission to do that.', 'jetpack-mu-wpcom' ), 403 );
	}
	check_admin_referer( 'pcg_force_set_bypass' );

	set_transient( pcg_force_bypass_key(), 1, PCG_FORCE_BYPASS_TTL );
	pcg_log_event( 'Force bypass enabled', array( 'ttl' => PCG_FORCE_BYPASS_TTL ) );

	$redirect = isset( $_REQUEST['_wp_http_referer'] )
		? wp_validate_redirect( esc_url_raw( wp_unslash( $_REQUEST['_wp_http_referer'] ) ), self_admin_url( 'plugins.php' ) )
		: self_admin_url( 'plugins.php' );
	wp_safe_redirect( add_query_arg( 'pcg_bypass_enabled', '1', $redirect ) );
	exit;
}

/**
 * Render the inline "Disable check for 10 minutes" form. Posts to
 * admin-post.php so the handler can set the transient and redirect.
 */
function pcg_force_render_bypass_form() {
	?>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline;">
		<input type="hidden" name="action" value="pcg_force_set_bypass" />
		<?php wp_nonce_field( 'pcg_force_set_bypass' ); ?>
		<button type="submit" class="button-link">
			<?php esc_html_e( 'Disable checks for 10 minutes', 'jetpack-mu-wpcom' ); ?>
		</button>
	</form>
	<?php
}
