<?php
/**
 * Customizes WordPress's default fatal error screen with WordPress.com support links.
 *
 * @package wpcomsh
 */

/**
 * Replaces the stock fatal-error message with a richer WordPress.com panel:
 * clearer copy, action buttons (support chat, dashboard, reload), and a
 * reminder that a recovery-mode link has been emailed to the site admin.
 *
 * @param string $message HTML error message produced by WP_Fatal_Error_Handler.
 * @param array  $error   Error details (type, message, file, line) when available.
 * @return string
 */
function wpcomsh_customize_fatal_error_message( $message, $error = array() ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	unset( $message );
	// Fatal handler can run before after_setup_theme and before i18n.php is required;
	// i18n.php registers the wpcom-locale .mo rewrite (e.g. nb_NO -> no.mo) we depend on.
	if ( ! is_textdomain_loaded( 'wpcomsh' ) ) {
		require_once __DIR__ . '/i18n.php';
		load_theme_textdomain( 'wpcomsh', WP_LANG_DIR . '/mu-plugins' );
	}

	$site_host     = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
	$dashboard_url = $site_host
		? 'https://wordpress.com/sites/' . rawurlencode( $site_host )
		: 'https://wordpress.com/sites';

	$headline   = esc_html__( 'This site is temporarily unavailable.', 'wpcomsh' );
	$body       = esc_html__( "Something on your site triggered a critical error. Your visitors are seeing this page instead of your content. We've emailed the site administrator a recovery link so they can investigate from a safe mode.", 'wpcomsh' );
	$admin_hint = esc_html__( 'Site administrator? Check your email for a link to enter recovery mode.', 'wpcomsh' );

	$support_label   = esc_html__( 'Chat with support', 'wpcomsh' );
	$dashboard_label = esc_html__( 'Open my dashboard', 'wpcomsh' );
	$reload_label    = esc_html__( 'Try again', 'wpcomsh' );

	// Only expose error details to logged-in users or when WP_DEBUG is on — raw
	// error messages can leak file paths. The fatal handler can fire before
	// pluggable.php loads, so wp_validate_auth_cookie()/current_user_can() may
	// not exist; fall back to sniffing the logged-in cookie name. This gates on
	// "has a WordPress session" rather than "is admin", which is a reasonable
	// proxy on a single-site Atomic install where admin ≈ only logged-in user.
	$has_logged_in_cookie = false;
	if ( ! empty( $_COOKIE ) ) {
		foreach ( array_keys( $_COOKIE ) as $cookie_name ) {
			if ( 0 === strpos( (string) $cookie_name, 'wordpress_logged_in_' ) ) {
				$has_logged_in_cookie = true;
				break;
			}
		}
	}
	$show_details = $has_logged_in_cookie || ( defined( 'WP_DEBUG' ) && WP_DEBUG );

	$details_html = '';
	if ( $show_details && ! empty( $error ) && isset( $error['message'] ) ) {
		$type       = isset( $error['type'] ) ? (int) $error['type'] : 0;
		$type_label = array(
			E_ERROR             => 'Fatal error',
			E_PARSE             => 'Parse error',
			E_CORE_ERROR        => 'Core error',
			E_COMPILE_ERROR     => 'Compile error',
			E_USER_ERROR        => 'User error',
			E_RECOVERABLE_ERROR => 'Recoverable error',
		);
		$label      = isset( $type_label[ $type ] ) ? $type_label[ $type ] : 'Error';

		$location = '';
		if ( ! empty( $error['file'] ) ) {
			$file     = str_replace( ABSPATH, '', (string) $error['file'] );
			$location = ' in ' . $file;
			if ( ! empty( $error['line'] ) ) {
				$location .= ':' . (int) $error['line'];
			}
		}

		$details_html = sprintf(
			'<details class="wpcomsh-fatal-details"><summary>%s</summary><pre>%s: %s%s</pre></details>',
			esc_html__( 'Show error details (visible to admins only)', 'wpcomsh' ),
			esc_html( $label ),
			esc_html( (string) $error['message'] ),
			esc_html( $location )
		);
	}

	$styles = '
		.wpcomsh-fatal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: left; }
		.wpcomsh-fatal h2 { margin: 0 0 12px; font-size: 20px; line-height: 1.3; }
		.wpcomsh-fatal p { margin: 0 0 16px; line-height: 1.5; color: #3c434a; }
		.wpcomsh-fatal .wpcomsh-fatal-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; align-items: stretch; }
		.wpcomsh-fatal a.button, .wpcomsh-fatal button.button {
			box-sizing: border-box;
			display: inline-flex; align-items: center; justify-content: center;
			height: auto; min-height: 40px; padding: 8px 16px; border-radius: 4px;
			font: 400 14px/1.4 inherit; text-decoration: none; white-space: nowrap;
			border: 1px solid #c3c4c7; background: #fff; color: #2c3338; cursor: pointer;
			vertical-align: middle;
		}
		.wpcomsh-fatal a.button-primary, .wpcomsh-fatal a.button.button-primary {
			background: #3858e9; border-color: #3858e9; color: #fff;
		}
		.wpcomsh-fatal .wpcomsh-fatal-hint { font-size: 13px; color: #646970; margin: 0; }
		.wpcomsh-fatal .wpcomsh-fatal-details { margin-top: 16px; font-size: 13px; }
		.wpcomsh-fatal .wpcomsh-fatal-details summary { cursor: pointer; color: #3c434a; }
		.wpcomsh-fatal .wpcomsh-fatal-details pre {
			margin-top: 8px; padding: 12px; background: #f6f7f7; border: 1px solid #dcdcde;
			border-radius: 4px; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace;
			white-space: pre-wrap; word-break: break-word; color: #2c3338;
		}
	';

	ob_start();
	?>
	<style><?php echo $styles; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></style>
	<div class="wpcomsh-fatal">
		<h2><?php echo $headline; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></h2>
		<p><?php echo $body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>
		<div class="wpcomsh-fatal-actions">
			<a class="button button-primary" href="https://wordpress.com/help/contact"><?php echo $support_label; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
			<a class="button" href="<?php echo esc_url( $dashboard_url ); ?>"><?php echo $dashboard_label; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
			<button class="button" type="button" onclick="window.location.reload()"><?php echo $reload_label; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></button>
		</div>
		<p class="wpcomsh-fatal-hint"><?php echo $admin_hint; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></p>
		<?php echo $details_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<?php
	return (string) ob_get_clean();
}
add_filter( 'wp_php_error_message', 'wpcomsh_customize_fatal_error_message', 10, 2 );
