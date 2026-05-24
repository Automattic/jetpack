<?php
/**
 * Rewrite the recovery-mode email WordPress sends when a fatal error is
 * detected, so a non-technical site admin can understand what happened and
 * act without needing wp-admin credentials.
 *
 * Copy and structure mirror the fatal-error screen (fatal-error-screen.php)
 * so the email and the page the admin lands on feel like one experience and
 * share translation strings.
 *
 * @package wpcomsh
 */

/**
 * Filter callback for `recovery_mode_email`. Replaces subject, message, and
 * headers with the WordPress.com-branded rewrite.
 *
 * Runs at priority 20 so the `to`-blanking filter in functions.php (which
 * disables the email for opted-out sites) wins — when `to` is empty we
 * short-circuit, since wp_mail will drop the message regardless.
 *
 * `$url` and `$extension` are marked optional because some WordPress versions
 * (and some host-specific forks) only pass two arguments to this filter;
 * missing info simply skips the parts of the email that need it.
 *
 * @param array  $email     { to, subject, message, headers }.
 * @param string $url       Core-generated recovery-mode URL. Defaults to ''.
 * @param array  $extension { slug, type } — plugin or theme blamed by core. Defaults to [].
 * @return array
 */
function wpcomsh_fatal_customize_recovery_email( $email, $url = '', $extension = array() ) {
	unset( $extension );

	if ( empty( $email['to'] ) ) {
		// Distinguish the two reasons `to` lands empty here so they're
		// filterable downstream: `…_disabled` when the opt-out filter in
		// functions.php (`wpcomsh_disable_fatal_error_emails`, priority 10)
		// blanked it, vs `…_no_recipient` when core's
		// `get_recovery_mode_email_address()` returned empty (no admin_email
		// and no RECOVERY_MODE_EMAIL) — the latter is a real failure since
		// the admin won't receive the recovery link.
		$error_info = wpcomsh_fatal_get_last_error();
		$plugin     = $error_info ? wpcomsh_fatal_identify_plugin( $error_info ) : null;
		if ( is_array( $plugin ) ) {
			$message = get_option( 'wpcomsh_disable_fatal_error_emails', false )
				? 'wpcomsh_fatal_recovery_email_disabled'
				: 'wpcomsh_fatal_recovery_email_no_recipient';
			wpcomsh_fatal_log_event( $plugin, $message );
		}
		return $email;
	}

	wpcomsh_fatal_load_textdomain();

	$site_name = wp_specialchars_decode( (string) get_option( 'blogname' ), ENT_QUOTES );
	$site_url  = home_url( '/' );

	$error_info  = wpcomsh_fatal_get_last_error();
	$plugin      = $error_info ? wpcomsh_fatal_identify_plugin( $error_info ) : null;
	$environment = wpcomsh_fatal_get_environment_lines();

	if ( is_array( $plugin ) ) {
		wpcomsh_fatal_log_event( $plugin, 'wpcomsh_fatal_recovery_email' );
	}

	$email['subject'] = wpcomsh_fatal_build_email_subject( $site_name, $plugin );
	$email['message'] = wpcomsh_fatal_build_email_message( $site_url, (string) $url, $plugin, $error_info, $environment );
	$email['headers'] = wpcomsh_fatal_merge_html_content_type( $email['headers'] ?? '' );

	return $email;
}
add_filter( 'recovery_mode_email', 'wpcomsh_fatal_customize_recovery_email', 20, 3 );

/**
 * Force the Content-Type header to HTML while preserving any other headers
 * the caller (or upstream filter) already set. Accepts a string or array.
 *
 * @param string|array $headers Existing headers from the email payload.
 * @return array
 */
function wpcomsh_fatal_merge_html_content_type( $headers ) {
	$existing = is_array( $headers ) ? $headers : preg_split( "/\r\n|\n|\r/", (string) $headers, -1, PREG_SPLIT_NO_EMPTY );
	$kept     = array();
	foreach ( (array) $existing as $header ) {
		if ( is_string( $header ) && 0 !== stripos( ltrim( $header ), 'content-type:' ) ) {
			$kept[] = $header;
		}
	}
	$kept[] = 'Content-Type: text/html; charset=UTF-8';
	return $kept;
}

/**
 * Pull the raw PHP error out of the same request that's sending the email.
 * The `recovery_mode_email` filter signature doesn't include `$error`, but
 * the email is dispatched from inside `WP_Fatal_Error_Handler::handle()` —
 * so `error_get_last()` still holds the fatal we're notifying about.
 *
 * Best-effort: returns null when nothing useful is available (e.g. when the
 * filter is invoked outside a fatal, like from the dev test harness).
 *
 * @return array{message:string,file:string,line:int}|null
 */
function wpcomsh_fatal_get_last_error() {
	$error = error_get_last();
	if ( ! is_array( $error ) || empty( $error['message'] ) ) {
		return null;
	}
	return array(
		'message' => (string) $error['message'],
		'file'    => (string) ( $error['file'] ?? '' ),
		'line'    => (int) ( $error['line'] ?? 0 ),
	);
}

/**
 * Build the subject line. Leading with the site name in brackets matches
 * admin-email conventions so inbox filters group these predictably.
 *
 * @param string     $site_name Site title (decoded).
 * @param array|null $plugin    Resolved extension info, or null when unknown.
 * @return string
 */
function wpcomsh_fatal_build_email_subject( $site_name, $plugin ) {
	if ( $plugin && ! empty( $plugin['name'] ) ) {
		return sprintf(
			/* translators: 1: site name, 2: plugin or theme display name. */
			__( '[%1$s] %2$s caused a critical error on your site', 'wpcomsh' ),
			$site_name,
			$plugin['name']
		);
	}
	return sprintf(
		/* translators: %s: site name. */
		__( '[%s] Your site hit a critical error', 'wpcomsh' ),
		$site_name
	);
}

/**
 * Build the HTML message body. Structure, copy, and color palette mirror
 * the fatal-error screen's admin view (see
 * `wpcomsh_fatal_render_admin_view` in fatal-error-screen.php):
 *
 *   - Same headline ("Your site hit a critical error") and intro sentence
 *     (the email intro additionally names the site + hostname so multi-site
 *     admins can tell at a glance which install broke).
 *   - Same "Suspected plugin" / "Suspected theme" red card, with plugin
 *     or theme name / version / description. The card has no in-line
 *     action: during an active fatal, plugins.php itself re-hits the same
 *     error, so we route all remediation through the recovery-mode link in
 *     "What you can try next" instead.
 *   - Same "What you can try next" list (recovery mode, support).
 *   - Separate "Error details" and "Environment" sections, each an
 *     always-open <pre> block (we drop the <details> disclosure because
 *     Gmail and Outlook strip it, defeating the toggle UX). The Error
 *     details message comes from error_get_last() in the same request as
 *     the fatal; Environment is computed at send time.
 *
 * Styles are kept in a <style> block inside <head> rather than inlined.
 * That's legible but Outlook desktop (Windows) strips <style> via its
 * Word engine and renders unstyled. Everything else (Gmail web/mobile,
 * Apple Mail, iOS Mail, Outlook.com, Yahoo) honors it. Content stays
 * fully readable in the unstyled fallback. Colors mirror
 * fatal-error-screen.css.
 *
 * @param string     $site_url     Site home URL.
 * @param string     $recovery_url Core recovery-mode URL, or '' when unavailable.
 * @param array|null $plugin       Resolved extension info, or null.
 * @param array|null $error_info   { message, file, line } from error_get_last(), or null.
 * @param string[]   $environment  Environment detail lines ("Label: value").
 * @return string
 */
function wpcomsh_fatal_build_email_message( $site_url, $recovery_url, $plugin, $error_info = null, $environment = array() ) {
	$css            = wpcomsh_fatal_email_styles();
	$document_title = __( 'Your site hit a critical error', 'wpcomsh' );

	$request_uri = esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ) );
	$page_url    = '' !== $request_uri ? home_url( $request_uri ) : '';

	ob_start();
	?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr( str_replace( '_', '-', get_locale() ) ); ?>">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title><?php echo esc_html( $document_title ); ?></title>
<style><?php echo $css; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static CSS. ?></style>
</head>
<body style="margin:0;padding:0;">
<div class="wpcomsh-fatal-email-wrap">
	<div class="wpcomsh-fatal-email-card">
		<h1 class="wpcomsh-fatal-email-h1"><?php esc_html_e( 'Your site hit a critical error', 'wpcomsh' ); ?></h1>
		<p class="wpcomsh-fatal-email-p"><?php esc_html_e( 'Howdy!', 'wpcomsh' ); ?></p>
		<p class="wpcomsh-fatal-email-p">
			<?php esc_html_e( 'WordPress.com has a built-in feature that detects when a plugin or theme causes a fatal error on your site, and notifies you with this automated email.', 'wpcomsh' ); ?>
		</p>
		<?php if ( $plugin ) : ?>
			<h2 class="wpcomsh-fatal-email-subhead">
				<?php
				if ( 'themes' === $plugin['kind'] ) {
					esc_html_e( 'Suspected theme', 'wpcomsh' );
				} else {
					esc_html_e( 'Suspected plugin', 'wpcomsh' );
				}
				?>
			</h2>
			<div class="wpcomsh-fatal-email-notice">
				<p class="wpcomsh-fatal-email-notice-title">
					<strong><?php echo esc_html( $plugin['name'] ); ?></strong>
					<?php if ( ! empty( $plugin['version'] ) ) : ?>
						<small class="wpcomsh-fatal-email-notice-ver">v<?php echo esc_html( $plugin['version'] ); ?></small>
					<?php endif; ?>
				</p>
				<?php if ( ! empty( $plugin['description'] ) ) : ?>
					<p class="wpcomsh-fatal-email-notice-desc"><?php echo esc_html( $plugin['description'] ); ?></p>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<h2 class="wpcomsh-fatal-email-subhead"><?php esc_html_e( 'What you can try next', 'wpcomsh' ); ?></h2>
		<p class="wpcomsh-fatal-email-p">
			<?php
			printf(
				/* translators: %s: site URL (wrapped in <a>). */
				esc_html__( 'First, visit your website (%s) and check for any visible issues.', 'wpcomsh' ),
				'<a href="' . esc_url( $site_url ) . '">' . esc_html( $site_url ) . '</a>'
			);
			?>
		</p>
		<?php if ( '' !== $page_url && $page_url !== $site_url ) : ?>
			<p class="wpcomsh-fatal-email-p">
				<?php
				printf(
					/* translators: %s: URL of the page where the error was caught (wrapped in <a>). */
					esc_html__( 'Next, visit the page where the error was caught (%s) and check for any visible issues.', 'wpcomsh' ),
					'<a href="' . esc_url( $page_url ) . '">' . esc_html( $page_url ) . '</a>'
				);
				?>
			</p>
		<?php endif; ?>
		<?php if ( '' !== $recovery_url ) : ?>
			<p class="wpcomsh-fatal-email-p">
				<?php esc_html_e( 'If your site appears broken and you can’t access your dashboard normally, WordPress.com has a special "recovery mode". This lets you safely login to your dashboard and investigate further.', 'wpcomsh' ); ?>
			</p>
			<p class="wpcomsh-fatal-email-p">
				<span class="wpcomsh-fatal-email-steps-url"><a href="<?php echo esc_url( $recovery_url ); ?>"><?php echo esc_html( $recovery_url ); ?></a></span>
			</p>
			<p class="wpcomsh-fatal-email-p">
				<?php esc_html_e( 'To keep your site safe, this link will expire in 1 day. Don’t worry about that, though: a new link will be emailed to you if the error occurs again after it expires.', 'wpcomsh' ); ?>
			</p>
		<?php endif; ?>
		<p class="wpcomsh-fatal-email-p">
			<?php
			$support_url = 'https://wordpress.com/help/contact';
			printf(
				/* translators: %s: WordPress.com support URL (wrapped in <a>). */
				esc_html__( 'Still stuck? Contact WordPress.com support and we’ll help you investigate further: %s', 'wpcomsh' ),
				'<a href="' . esc_url( $support_url ) . '">' . esc_html( $support_url ) . '</a>'
			);
			?>
		</p>

		<?php
		if ( $error_info ) :
			$error_line = (string) $error_info['message'];
			if ( '' !== $error_info['file'] && $error_info['line'] > 0 ) {
				$error_line .= sprintf(
					/* translators: 1: error file path, 2: error line number. */
					' ' . __( '(in %1$s, line %2$d)', 'wpcomsh' ),
					$error_info['file'],
					$error_info['line']
				);
			}
			?>
			<div class="wpcomsh-fatal-email-details">
				<h2 class="wpcomsh-fatal-email-details-heading"><?php esc_html_e( 'Error details', 'wpcomsh' ); ?></h2>
				<pre><?php echo esc_html( $error_line ); ?></pre>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $environment ) ) : ?>
			<div class="wpcomsh-fatal-email-details">
				<h2 class="wpcomsh-fatal-email-details-heading"><?php esc_html_e( 'Environment', 'wpcomsh' ); ?></h2>
				<pre><?php echo esc_html( implode( "\n", $environment ) ); ?></pre>
			</div>
		<?php endif; ?>
	</div>
</div>
</body>
</html>
	<?php
	return (string) ob_get_clean();
}

/**
 * Stylesheet for the email. Lives here (rather than in a sibling .css file)
 * because emails are rendered inline and we want a single-function surface
 * for the email markup + styles.
 *
 * @return string
 */
function wpcomsh_fatal_email_styles() {
	return <<<'CSS'
.wpcomsh-fatal-email-wrap {
	margin: 0;
	padding: 24px 16px;
	background: #f6f7f7;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	color: #3c434a;
}
.wpcomsh-fatal-email-card {
	max-width: 560px;
	margin: 0 auto;
	padding: 32px;
	background: #ffffff;
	border: 1px solid #dcdcde;
	border-radius: 8px;
}
.wpcomsh-fatal-email-h1 {
	margin: 0 0 12px;
	font-size: 20px;
	line-height: 1.3;
	font-weight: 600;
	color: #1d2327;
}
.wpcomsh-fatal-email-p {
	margin: 0 0 16px;
	font-size: 14px;
	line-height: 1.55;
	color: #3c434a;
}
.wpcomsh-fatal-email-subhead {
	margin: 24px 0 8px;
	font-size: 14px;
	font-weight: 600;
	color: #1d2327;
}
.wpcomsh-fatal-email-notice {
	margin: 0 0 20px;
	padding: 16px;
	background: #fcf0f1;
	border: 1px solid #f1b1b3;
	border-radius: 6px;
}
.wpcomsh-fatal-email-notice-title {
	margin: 0 0 4px;
	font-size: 14px;
	line-height: 1.4;
	color: #1d2327;
}
.wpcomsh-fatal-email-notice-ver {
	margin-left: 4px;
	font-size: 12px;
	color: #646970;
}
.wpcomsh-fatal-email-notice-desc {
	margin: 0;
	font-size: 13px;
	line-height: 1.5;
	color: #3c434a;
}
.wpcomsh-fatal-email-steps-url {
	display: inline-block;
	word-break: break-all;
	color: #1d2327;
}
.wpcomsh-fatal-email-card a {
	color: #3858e9;
	text-decoration: underline;
}
.wpcomsh-fatal-email-details {
	margin-top: 24px;
	padding-top: 16px;
	border-top: 1px solid #dcdcde;
}
.wpcomsh-fatal-email-details + .wpcomsh-fatal-email-details {
	margin-top: 16px;
	padding-top: 0;
	border-top: 0;
}
.wpcomsh-fatal-email-details-heading {
	margin: 0 0 8px;
	font-size: 14px;
	font-weight: 600;
	color: #1d2327;
}
.wpcomsh-fatal-email-details pre {
	margin: 0;
	padding: 12px;
	background: #f6f7f7;
	border: 1px solid #dcdcde;
	border-radius: 4px;
	font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace;
	color: #2c3338;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
CSS;
}
