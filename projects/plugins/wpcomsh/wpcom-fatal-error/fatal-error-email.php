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
	if ( empty( $email['to'] ) ) {
		return $email;
	}

	wpcomsh_fatal_load_textdomain();

	$plugin    = wpcomsh_fatal_resolve_extension( $extension );
	$site_name = wp_specialchars_decode( (string) get_option( 'blogname' ), ENT_QUOTES );
	$site_url  = home_url( '/' );

	$error_info       = wpcomsh_fatal_get_last_error();
	$environment      = wpcomsh_fatal_get_environment_lines();
	$action_link      = wpcomsh_fatal_build_action_link( $plugin );
	$email['subject'] = wpcomsh_fatal_build_email_subject( $site_name, $plugin );
	$email['message'] = wpcomsh_fatal_build_email_message( $site_name, $site_url, (string) $url, $action_link, $plugin, $error_info, $environment );
	$email['headers'] = wpcomsh_fatal_merge_html_content_type( isset( $email['headers'] ) ? $email['headers'] : '' );

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
 * Build the action link for the "Likely cause" card: a URL into wp-admin
 * that takes the admin directly to the page where they can remedy the
 * offending extension.
 *
 * Branches by type because the remediation is different:
 *   - Plugin: deactivate it (Plugins page, pre-filtered to the slug).
 *   - Theme : switch to a different theme (Themes page).
 *
 * Returns null when we don't have enough info to offer a link — the
 * template falls back to just the name + description in that case.
 *
 * @param array|null $plugin Resolved extension info.
 * @return array{url:string,label:string}|null
 */
function wpcomsh_fatal_build_action_link( $plugin ) {
	if ( ! is_array( $plugin ) || empty( $plugin['type'] ) ) {
		return null;
	}
	if ( 'plugin' === $plugin['type'] ) {
		$url = ! empty( $plugin['slug'] )
			? admin_url( 'plugins.php?s=' . rawurlencode( (string) $plugin['slug'] ) )
			: admin_url( 'plugins.php' );
		return array(
			'url'   => $url,
			'label' => __( 'Go to your plugins page to deactivate it', 'wpcomsh' ),
		);
	}
	if ( 'theme' === $plugin['type'] ) {
		return array(
			'url'   => admin_url( 'themes.php' ),
			'label' => __( 'Go to your themes page to switch to a different theme', 'wpcomsh' ),
		);
	}
	return null;
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
		'file'    => isset( $error['file'] ) ? (string) $error['file'] : '',
		'line'    => isset( $error['line'] ) ? (int) $error['line'] : 0,
	);
}

/**
 * Collect environment details (WordPress / PHP / theme / server versions)
 * to include under the Error details disclosure. Helps support triage
 * without making the recipient hunt for them.
 *
 * Each entry is already-escaped because the caller renders them inside a
 * <pre>, where line-for-line layout matters.
 *
 * @return string[] List of "Label: value" lines.
 */
function wpcomsh_fatal_get_environment_lines() {
	global $wp_version;

	$lines = array();

	$lines[] = sprintf( 'WordPress: %s', isset( $wp_version ) ? (string) $wp_version : 'unknown' );
	$lines[] = sprintf( 'PHP: %s', PHP_VERSION );

	try {
		$theme = wp_get_theme();
		if ( $theme && $theme->exists() ) {
			$lines[] = sprintf( 'Theme: %s %s', (string) $theme->get( 'Name' ), (string) $theme->get( 'Version' ) );
		}
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; omit theme on failure.
		// Fall through.
	}

	$server = isset( $_SERVER['SERVER_SOFTWARE'] ) ? sanitize_text_field( (string) wp_unslash( $_SERVER['SERVER_SOFTWARE'] ) ) : '';
	if ( '' !== $server ) {
		$lines[] = sprintf( 'Server: %s', $server );
	}

	return $lines;
}

/**
 * Resolve the extension blamed by core into the same {name, version,
 * description} shape the screen's `wpcomsh_fatal_identify_plugin` returns,
 * so the email template can reuse the screen's rendering logic.
 *
 * Falls back to null when the slug can't be matched, letting the template
 * fall through to a generic body.
 *
 * @param array $extension { slug, type } from the recovery_mode_email filter.
 * @return array{name:string,version:string,description:string,slug:string,type:string}|null
 */
function wpcomsh_fatal_resolve_extension( $extension ) {
	$slug = isset( $extension['slug'] ) ? (string) $extension['slug'] : '';
	$type = isset( $extension['type'] ) ? (string) $extension['type'] : '';
	if ( '' === $slug ) {
		return null;
	}
	$fallback = array(
		'name'        => $slug,
		'version'     => '',
		'description' => '',
		'slug'        => $slug,
		'type'        => $type,
	);
	try {
		if ( 'plugin' === $type ) {
			if ( ! function_exists( 'get_plugins' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			foreach ( get_plugins() as $basename => $data ) {
				if ( 0 === strpos( $basename, $slug . '/' ) && ! empty( $data['Name'] ) ) {
					return array(
						'name'        => (string) $data['Name'],
						'version'     => isset( $data['Version'] ) ? (string) $data['Version'] : '',
						'description' => isset( $data['Description'] ) ? wp_strip_all_tags( (string) $data['Description'] ) : '',
						'slug'        => $slug,
						'type'        => $type,
					);
				}
			}
		} elseif ( 'theme' === $type ) {
			$theme = wp_get_theme( $slug );
			if ( $theme->exists() ) {
				return array(
					'name'        => (string) $theme->get( 'Name' ),
					'version'     => (string) $theme->get( 'Version' ),
					'description' => wp_strip_all_tags( (string) $theme->get( 'Description' ) ),
					'slug'        => $slug,
					'type'        => $type,
				);
			}
		}
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort lookup; fall through to minimal shape.
		return $fallback;
	}
	return $fallback;
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
 *     or theme name / version / description. The card's action is a plain
 *     link into wp-admin (plugins.php or themes.php) rather than the
 *     screen's one-click Deactivate button, since the signed HMAC the
 *     screen uses requires a session cookie we can't bind to from email.
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
 * @param string     $site_name    Decoded site title.
 * @param string     $site_url     Site home URL.
 * @param string     $recovery_url Core recovery-mode URL, or '' when unavailable.
 * @param array|null $action_link  { url, label } for the card CTA, or null.
 * @param array|null $plugin       Resolved extension info, or null.
 * @param array|null $error_info   { message, file, line } from error_get_last(), or null.
 * @param string[]   $environment  Environment detail lines ("Label: value").
 * @return string
 */
function wpcomsh_fatal_build_email_message( $site_name, $site_url, $recovery_url, $action_link, $plugin, $error_info = null, $environment = array() ) {
	$css            = wpcomsh_fatal_email_styles();
	$document_title = __( 'Your site hit a critical error', 'wpcomsh' );

	$site_host = wp_parse_url( $site_url, PHP_URL_HOST );
	if ( ! is_string( $site_host ) || '' === $site_host ) {
		$site_host = $site_url;
	}

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
		<p class="wpcomsh-fatal-email-p">
			<?php
			printf(
				/* translators: 1: site name, 2: site URL (wrapped in <a>). */
				esc_html__( 'A critical error occurred on %1$s (%2$s). Here is what we know and what you can do next.', 'wpcomsh' ),
				'<strong>' . esc_html( $site_name ) . '</strong>',
				'<a href="' . esc_url( $site_url ) . '">' . esc_html( $site_host ) . '</a>'
			);
			?>
		</p>

		<?php if ( $plugin ) : ?>
			<h2 class="wpcomsh-fatal-email-subhead">
				<span class="wpcomsh-fatal-email-subhead-icon" aria-hidden="true">&#9888;&#65039;</span>
				<?php
				if ( 'theme' === $plugin['type'] ) {
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
				<?php if ( $action_link ) : ?>
					<p class="wpcomsh-fatal-email-notice-action">
						<a href="<?php echo esc_url( $action_link['url'] ); ?>">
							<?php echo esc_html( $action_link['label'] ); ?>
						</a>
					</p>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<h2 class="wpcomsh-fatal-email-subhead"><?php esc_html_e( 'What you can try next', 'wpcomsh' ); ?></h2>
		<ul class="wpcomsh-fatal-email-steps">
			<?php if ( '' !== $recovery_url ) : ?>
				<li>
					<?php
					printf(
						/* translators: 1: open <a> tag linking to recovery mode entry, 2: close </a> tag. */
						esc_html__( '%1$sEnter recovery mode%2$s to load your admin with plugins disabled, so you can investigate in a safe environment.', 'wpcomsh' ),
						'<a href="' . esc_url( $recovery_url ) . '">',
						'</a>'
					);
					?>
				</li>
			<?php endif; ?>
			<li>
				<?php
				printf(
					/* translators: 1: open <a> tag linking to WordPress.com support, 2: close </a> tag. */
					esc_html__( 'Still stuck? %1$sContact WordPress.com support%2$s and we will help you get back online.', 'wpcomsh' ),
					'<a href="https://wordpress.com/help/contact">',
					'</a>'
				);
				?>
			</li>
		</ul>

		<?php if ( $error_info ) : ?>
			<div class="wpcomsh-fatal-email-details">
				<h2 class="wpcomsh-fatal-email-details-heading"><?php esc_html_e( 'Error details', 'wpcomsh' ); ?></h2>
				<pre>
				<?php
					$line = (string) $error_info['message'];
				if ( '' !== $error_info['file'] && $error_info['line'] > 0 ) {
					$line .= sprintf(
						/* translators: 1: error file path, 2: error line number. */
						' ' . __( '(in %1$s, line %2$d)', 'wpcomsh' ),
						$error_info['file'],
						$error_info['line']
					);
				}
					echo esc_html( $line );
				?>
				</pre>
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
.wpcomsh-fatal-email-subhead-icon {
	margin-right: 4px;
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
	margin: 0 0 12px;
	font-size: 13px;
	line-height: 1.5;
	color: #3c434a;
}
.wpcomsh-fatal-email-notice-action {
	margin: 0;
	font-size: 13px;
}
.wpcomsh-fatal-email-steps {
	margin: 0;
	padding-inline-start: 20px;
	font-size: 14px;
	line-height: 1.55;
	color: #3c434a;
}
.wpcomsh-fatal-email-steps li {
	margin-bottom: 6px;
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
