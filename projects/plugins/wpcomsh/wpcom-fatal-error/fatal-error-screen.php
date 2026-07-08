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
function wpcomsh_customize_fatal_error_message( $message, $error = array() ) {
	// Rendering allocates memory. On a near-limit request that would itself OOM
	// and mask the real error, so secure headroom first; if we can't, fall back
	// to core's lighter screen.
	if ( ! wpcomsh_fatal_ensure_render_memory() ) {
		return (string) $message;
	}

	unset( $message );

	wpcomsh_fatal_load_textdomain();

	$user_id  = wpcomsh_fatal_current_user_id();
	$is_admin = $user_id && user_can( $user_id, 'manage_options' );

	// Identify only when used: admins need $plugin for the rendered
	// notice; anonymous viewers don't render plugin info but still emit
	// a signature event for telemetry. The anonymous path gates on
	// (error file, request_kind) before paying the plugin-header read so
	// a fatal storm doesn't compound filesystem work on a sick site —
	// kind is in the key so wp-admin / home / rest variance still reaches
	// the downstream (message, signature, request_kind) dedup.
	$plugin = null;

	if ( $is_admin ) {
		$plugin = wpcomsh_fatal_identify_plugin( $error );
		wpcomsh_fatal_log_event( $plugin, 'wpcomsh_fatal_signature' );
	} elseif ( ! empty( $error['file'] ) ) {
		$req_kind   = wpcomsh_fatal_request_context()['kind'];
		$coarse_key = 'wpcomsh_fatal_file_kind:' . hash( 'sha256', (string) $error['file'] . '|' . $req_kind );
		if ( wpcomsh_fatal_dedup_acquire( $coarse_key, HOUR_IN_SECONDS ) ) {
			wpcomsh_fatal_log_event( wpcomsh_fatal_identify_plugin( $error ), 'wpcomsh_fatal_signature' );
		}
	}

	$context = wpcomsh_fatal_build_render_context( $error, $plugin, $user_id, $is_admin );

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
 * Viewer state is resolved upstream in
 * wpcomsh_customize_fatal_error_message(); this function drops plugin
 * info and the error message for non-admin viewers.
 *
 * @param array      $error    Error details from WP_Fatal_Error_Handler.
 * @param array|null $plugin   Identified extension metadata, or null.
 * @param int        $user_id  Resolved logged-in user id, or 0.
 * @param bool       $is_admin Whether the resolved user can manage_options.
 * @return array Associative array with keys: is_admin (bool),
 *     plugin (array|null), error_message (string), deactivate_form (array|null),
 *     recovery_url (string), support_url (string), environment (string[]).
 */
function wpcomsh_fatal_build_render_context( $error, $plugin = null, $user_id = 0, $is_admin = false ) {
	$plugin = $is_admin ? $plugin : null;

	$can_deactivate = $user_id
		&& $plugin
		&& 'plugins' === $plugin['kind']
		&& ! empty( $plugin['basename'] )
		&& user_can( $user_id, 'deactivate_plugin', $plugin['basename'] );

	// Recovery-mode capability depends on the kind of extension that
	// fataled: a theme-origin fatal needs `resume_themes`, everything
	// else (plugins, mu-plugins, unknown) needs `resume_plugins`.
	$recover_cap = ( $plugin && 'themes' === $plugin['kind'] )
		? 'resume_themes'
		: 'resume_plugins';
	$can_recover = $user_id && user_can( $user_id, $recover_cap );

	return array(
		'is_admin'        => $is_admin,
		'plugin'          => $plugin,
		'error_message'   => $is_admin ? (string) ( $error['message'] ?? '' ) : '',
		'deactivate_form' => $can_deactivate ? wpcomsh_fatal_build_deactivate_form( $plugin['basename'] ) : null,
		// Endpoint-mediated link so the recovery key is minted on click
		// (one row in the `recovery_keys` option per click, not per
		// render) and we can log the click. Helper gates multisite. See
		// fatal-recovery-redirect.php for the auth model.
		'recovery_url'    => $can_recover ? wpcomsh_fatal_build_recovery_redirect_url( $user_id ) : '',
		'support_url'     => 'https://wordpress.com/help/contact',
		'environment'     => $is_admin ? wpcomsh_fatal_get_environment_lines() : array(),
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
	<p><?php esc_html_e( 'We are aware of the issue and the site owner has been notified. Please check back soon.', 'wpcomsh' ); ?></p>
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
	<h2><?php esc_html_e( 'Your site hit a critical error', 'wpcomsh' ); ?></h2>
	<p><?php esc_html_e( 'There has been a critical error on this website. Here is what we know and what you can do next.', 'wpcomsh' ); ?></p>

	<?php if ( $ctx['plugin'] ) : ?>
		<h3 class="wpcomsh-fatal-subhead wpcomsh-fatal-subhead-alert">
			<span class="wpcomsh-fatal-subhead-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
			</span>
			<?php
			if ( 'themes' === $ctx['plugin']['kind'] ) {
				esc_html_e( 'Suspected theme', 'wpcomsh' );
			} else {
				esc_html_e( 'Suspected plugin', 'wpcomsh' );
			}
			?>
		</h3>
		<?php wpcomsh_fatal_render_cause_notice( $ctx['plugin'], $ctx['deactivate_form'] ); ?>
	<?php endif; ?>

	<h3 class="wpcomsh-fatal-subhead"><?php esc_html_e( 'What you can try next', 'wpcomsh' ); ?></h3>
	<?php wpcomsh_fatal_render_next_steps( $ctx['recovery_url'], $ctx['support_url'] ); ?>

	<?php if ( '' !== $ctx['error_message'] ) : ?>
		<div class="wpcomsh-fatal-details">
			<h3 class="wpcomsh-fatal-details-heading"><?php esc_html_e( 'Error details', 'wpcomsh' ); ?></h3>
			<pre><?php echo esc_html( $ctx['error_message'] ); ?></pre>
		</div>
	<?php endif; ?>

	<?php if ( ! empty( $ctx['environment'] ) ) : ?>
		<div class="wpcomsh-fatal-details">
			<h3 class="wpcomsh-fatal-details-heading"><?php esc_html_e( 'Environment', 'wpcomsh' ); ?></h3>
			<pre><?php echo esc_html( implode( "\n", $ctx['environment'] ) ); ?></pre>
		</div>
		<?php
	endif;
}

/**
 * Render the "suspected extension" notice card: name + version +
 * description, plus a Deactivate action when the viewer can act on it.
 *
 * Themes don't get an in-card action. Navigating to themes.php while the
 * broken theme is still active would re-hit the same fatal, so we route
 * the user through core recovery mode via the link in "What you can try
 * next" instead. A future follow-up could build a signed "switch to
 * default theme" endpoint mirroring the plugin deactivator.
 *
 * The alert icon lives in the sibling `<h3>` heading (see
 * `wpcomsh_fatal_render_admin_view`); this card renders only the content.
 *
 * @param array      $plugin          Extension info from wpcomsh_fatal_identify_plugin().
 * @param array|null $deactivate_form Signed form data from wpcomsh_fatal_build_deactivate_form(), or null.
 * @return void
 */
function wpcomsh_fatal_render_cause_notice( $plugin, $deactivate_form ) {
	?>
	<div class="wpcomsh-fatal-notice wpcomsh-fatal-notice-error">
		<div class="wpcomsh-fatal-notice-title">
			<strong><?php echo esc_html( $plugin['name'] ); ?></strong>
			<?php if ( ! empty( $plugin['version'] ) ) : ?>
				<span class="wpcomsh-fatal-notice-ver">v<?php echo esc_html( $plugin['version'] ); ?></span>
			<?php endif; ?>
		</div>
		<?php if ( ! empty( $plugin['description'] ) ) : ?>
			<div class="wpcomsh-fatal-notice-desc"><?php echo esc_html( $plugin['description'] ); ?></div>
		<?php endif; ?>
		<?php if ( $deactivate_form ) : ?>
			<form method="post"
				action="<?php echo esc_url( $deactivate_form['action'] ); ?>"
				onsubmit="return confirm('<?php echo esc_js( __( 'Deactivate this plugin? Your site should load again immediately.', 'wpcomsh' ) ); // phpcs:ignore Jetpack.Functions.EscJs.Found -- esc_attr(json_encode(...)) would double-escape quotes inside onsubmit="..." and break the string. ?>');">
				<?php foreach ( $deactivate_form['fields'] as $field_name => $field_value ) : ?>
					<input type="hidden" name="<?php echo esc_attr( $field_name ); ?>" value="<?php echo esc_attr( $field_value ); ?>" />
				<?php endforeach; ?>
				<button type="submit" class="wpcomsh-fatal-btn wpcomsh-fatal-btn-destructive">
					<?php esc_html_e( 'Deactivate', 'wpcomsh' ); ?>
				</button>
			</form>
		<?php endif; ?>
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
				esc_html__( 'Still stuck? %1$sContact WordPress.com support%2$s and we will help you get back online.', 'wpcomsh' ),
				'<a href="' . esc_url( $support_url ) . '">',
				'</a>'
			);
			?>
		</li>
	</ul>
	<?php
}
