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
 * @return string
 */
function wpcomsh_customize_fatal_error_message( $message ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

	$styles = '
		.wpcomsh-fatal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: left; }
		.wpcomsh-fatal h2 { margin: 0 0 12px; font-size: 20px; }
		.wpcomsh-fatal p { margin: 0 0 16px; line-height: 1.5; color: #3c434a; }
		.wpcomsh-fatal .wpcomsh-fatal-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
		.wpcomsh-fatal a.button, .wpcomsh-fatal button.button {
			display: inline-block; padding: 10px 16px; border-radius: 4px;
			text-decoration: none; font-size: 14px; border: 1px solid #c3c4c7;
			background: #fff; color: #2c3338; cursor: pointer;
		}
		.wpcomsh-fatal a.button-primary {
			background: #3858e9; border-color: #3858e9; color: #fff;
		}
		.wpcomsh-fatal .wpcomsh-fatal-hint { font-size: 13px; color: #646970; margin-top: 16px; }
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
	</div>
	<?php
	return (string) ob_get_clean();
}
add_filter( 'wp_php_error_message', 'wpcomsh_customize_fatal_error_message' );
