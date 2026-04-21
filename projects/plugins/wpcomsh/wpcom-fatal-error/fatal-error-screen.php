<?php
/**
 * Replaces WordPress's default fatal-error screen with a WordPress.com-branded
 * panel via the `wp_php_error_message` filter.
 *
 * Two viewer paths:
 *
 *   - Anonymous visitors see a short apology with no technical detail.
 *   - Logged-in admins see the likely-cause plugin (with Deactivate action),
 *     recovery-mode entry when available, a support link, and the raw error.
 *
 * Pure helpers live in fatal-error-helpers.php so this file stays
 * template-focused. CSS lives in fatal-error-screen.css and is inlined at
 * render time (enqueue isn't available inside the fatal handler).
 *
 * @package wpcomsh
 */

/**
 * Filter callback for `wp_php_error_message`. Returns the HTML that core
 * substitutes into its fatal-error template.
 *
 * @param string $message HTML error message produced by WP_Fatal_Error_Handler (discarded).
 * @param array  $error   Error details (type, message, file, line) when available.
 * @return string
 */
function wpcomsh_customize_fatal_error_message( $message, $error = array() ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	unset( $message );

	wpcomsh_fatal_load_textdomain();

	$context = wpcomsh_fatal_build_render_context( $error );

	ob_start();
	wpcomsh_fatal_render_screen( $context );
	return (string) ob_get_clean();
}
add_filter( 'wp_php_error_message', 'wpcomsh_customize_fatal_error_message', 10, 2 );

/**
 * Load the wpcomsh textdomain. The fatal handler can fire before
 * `after_setup_theme`, so i18n.php hasn't been required yet.
 *
 * @return void
 */
function wpcomsh_fatal_load_textdomain() {
	if ( is_textdomain_loaded( 'wpcomsh' ) ) {
		return;
	}
	require_once dirname( __DIR__ ) . '/i18n.php';
	load_theme_textdomain( 'wpcomsh', WP_LANG_DIR . '/mu-plugins' );
}

/**
 * Collect everything the template needs into a plain associative array.
 * Helpers return empty strings / nulls when data is unavailable, so the
 * template only has to check truthiness.
 *
 * @param array $error Error details from WP_Fatal_Error_Handler.
 * @return array{
 *     is_admin: bool,
 *     plugin: array|null,
 *     error_line: string,
 *     deactivate_url: string,
 *     recovery_url: string,
 *     support_url: string,
 * }
 */
function wpcomsh_fatal_build_render_context( $error ) {
	$is_admin = wpcomsh_fatal_viewer_is_admin();
	$plugin   = $is_admin ? wpcomsh_fatal_identify_plugin( $error ) : null;

	return array(
		'is_admin'       => $is_admin,
		'plugin'         => $plugin,
		'error_line'     => $is_admin ? wpcomsh_fatal_format_error( $error ) : '',
		'deactivate_url' => ( $is_admin && $plugin && 'plugins' === $plugin['kind'] && ! empty( $plugin['basename'] ) )
			? wpcomsh_fatal_build_deactivate_url( $plugin['basename'] )
			: '',
		'recovery_url'   => $is_admin ? wpcomsh_fatal_build_recovery_url() : '',
		'support_url'    => 'https://wordpress.com/help/contact',
	);
}

/**
 * Render the fatal-error screen to stdout (within an output buffer). The
 * admin template is in a separate function so the control flow stays flat.
 *
 * @param array $ctx Render context, see wpcomsh_fatal_build_render_context().
 * @return void
 */
function wpcomsh_fatal_render_screen( $ctx ) {
	wpcomsh_fatal_render_styles();
	echo '<div class="wpcomsh-fatal">';
	if ( $ctx['is_admin'] ) {
		wpcomsh_fatal_render_admin_view( $ctx );
	} else {
		wpcomsh_fatal_render_public_view();
	}
	echo '</div>';
}

/**
 * Inline the screen's stylesheet. We can't use wp_enqueue_style because the
 * fatal handler runs outside the normal template lifecycle.
 *
 * @return void
 */
function wpcomsh_fatal_render_styles() {
	// We read a local static asset, not a remote URL; wp_remote_get is irrelevant here.
	$css = @file_get_contents( __DIR__ . '/fatal-error-screen.css' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( false === $css ) {
		return;
	}
	echo '<style>' . $css . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static asset.
}

/**
 * Minimal, non-technical view for anonymous visitors.
 *
 * @return void
 */
function wpcomsh_fatal_render_public_view() {
	?>
	<h2><?php esc_html_e( 'This site is temporarily unavailable.', 'wpcomsh' ); ?></h2>
	<p><?php esc_html_e( "We're aware of the issue and the site owner has been notified. Please check back soon.", 'wpcomsh' ); ?></p>
	<?php
}

/**
 * Admin view: likely-cause notice, self-serve next steps, collapsible error details.
 *
 * @param array $ctx Render context.
 * @return void
 */
function wpcomsh_fatal_render_admin_view( $ctx ) {
	?>
	<h2><?php esc_html_e( 'Your site hit a critical error.', 'wpcomsh' ); ?></h2>
	<p><?php esc_html_e( "We've replaced your site with this page so visitors don't see a broken page. Here's what we know and what you can do next.", 'wpcomsh' ); ?></p>

	<?php if ( $ctx['plugin'] ) : ?>
		<h3 class="wpcomsh-fatal-subhead"><?php esc_html_e( 'Likely cause', 'wpcomsh' ); ?></h3>
		<?php wpcomsh_fatal_render_cause_notice( $ctx['plugin'], $ctx['deactivate_url'] ); ?>
	<?php endif; ?>

	<h3 class="wpcomsh-fatal-subhead"><?php esc_html_e( 'What you can try next', 'wpcomsh' ); ?></h3>
	<?php wpcomsh_fatal_render_next_steps( $ctx['recovery_url'], $ctx['support_url'] ); ?>

	<?php if ( '' !== $ctx['error_line'] ) : ?>
		<details class="wpcomsh-fatal-details">
			<summary><?php esc_html_e( 'Error details', 'wpcomsh' ); ?></summary>
			<pre><?php echo esc_html( $ctx['error_line'] ); ?></pre>
		</details>
		<?php
	endif;
}

/**
 * Render the red "likely cause" notice card: plugin name, description,
 * and the Deactivate action when a signed URL is available.
 *
 * @param array  $plugin         Plugin info from wpcomsh_fatal_identify_plugin().
 * @param string $deactivate_url Signed deactivation URL, or '' to hide the action.
 * @return void
 */
function wpcomsh_fatal_render_cause_notice( $plugin, $deactivate_url ) {
	?>
	<div class="wpcomsh-fatal-notice wpcomsh-fatal-notice-error">
		<div class="wpcomsh-fatal-notice-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
		</div>
		<div class="wpcomsh-fatal-notice-body">
			<div class="wpcomsh-fatal-notice-title">
				<strong><?php echo esc_html( $plugin['name'] ); ?></strong>
				<?php if ( ! empty( $plugin['version'] ) ) : ?>
					<span class="wpcomsh-fatal-notice-ver">v<?php echo esc_html( $plugin['version'] ); ?></span>
				<?php endif; ?>
			</div>
			<?php if ( ! empty( $plugin['description'] ) ) : ?>
				<div class="wpcomsh-fatal-notice-desc"><?php echo esc_html( $plugin['description'] ); ?></div>
			<?php endif; ?>
			<?php if ( $deactivate_url ) : ?>
				<a class="wpcomsh-fatal-btn wpcomsh-fatal-btn-destructive"
					href="<?php echo esc_url( $deactivate_url ); ?>"
					onclick="return confirm('<?php echo esc_js( __( 'Deactivate this plugin? Your site should load again immediately.', 'wpcomsh' ) ); // phpcs:ignore Jetpack.Functions.EscJs.Found -- esc_attr(json_encode(...)) would double-escape quotes inside onclick="..." and break the string. ?>');">
					<?php esc_html_e( 'Deactivate', 'wpcomsh' ); ?>
				</a>
			<?php endif; ?>
		</div>
	</div>
	<?php
}

/**
 * Render the "what you can try next" list. Items are conditional on whether
 * the corresponding path is usable from this request.
 *
 * @param string $recovery_url Core recovery-mode URL, or '' if unavailable.
 * @param string $support_url  WordPress.com support contact URL.
 * @return void
 */
function wpcomsh_fatal_render_next_steps( $recovery_url, $support_url ) {
	?>
	<ul class="wpcomsh-fatal-steps">
		<?php if ( $recovery_url ) : ?>
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
				esc_html__( 'Still stuck? %1$sContact WordPress.com support%2$s and we\'ll help you get back online.', 'wpcomsh' ),
				'<a href="' . esc_url( $support_url ) . '">',
				'</a>'
			);
			?>
		</li>
	</ul>
	<?php
}
