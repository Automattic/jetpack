<?php
/**
 * Admin-page surface for the Plugin Conflicts Guardian.
 *
 * Two entry points live on the same page:
 *   - Slug check: GET form, looks up WP.org metadata.
 *   - Upload check: POST form, extracts a zip and runs the same
 *     verdict rules plus a PHP syntax sweep.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_action(
	'admin_menu',
	function () {
		add_management_page(
			'Plugin Compat Check',
			'Plugin Compat Check',
			'manage_options',
			'plugin-conflicts-guardian',
			'pcg_render_admin_page'
		);
	}
);

add_action( 'admin_post_pcg_check_upload', 'pcg_handle_upload_post' );

/**
 * Render the Tools page. Shows both the slug form and the upload form;
 * renders a verdict below whichever form produced one this request.
 */
function pcg_render_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Insufficient permissions.' );
	}

	$slug    = isset( $_GET['slug'] ) ? sanitize_key( wp_unslash( $_GET['slug'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$verdict = null;
	$error   = null;

	if ( '' !== $slug ) {
		$checker = new PCG_Compat_Checker( new PCG_Wporg_Source(), new PCG_Site_State() );
		$verdict = $checker->check( $slug );
	}

	// Upload results are stashed in a transient keyed to the user so we
	// can redirect PRG-style and still surface the verdict on the GET
	// that follows the POST. (Transient because verdicts can be big.)
	$upload_key = pcg_upload_transient_key();
	$upload     = get_transient( $upload_key );
	if ( false !== $upload ) {
		delete_transient( $upload_key );
		if ( is_wp_error( $upload ) ) {
			$error = $upload;
		} elseif ( $upload instanceof PCG_Verdict ) {
			$verdict = $upload;
		}
	}
	?>
	<div class="wrap">
		<h1>Plugin Compat Check</h1>
		<p>Pre-flight compatibility check against a plugin's WordPress.org metadata (or a zip you upload), run against this site's WP / PHP versions.</p>

		<h2>Check a WordPress.org plugin</h2>
		<form method="get" action="">
			<input type="hidden" name="page" value="plugin-conflicts-guardian" />
			<p>
				<label for="pcg-slug">Plugin slug</label><br />
				<input name="slug" id="pcg-slug" value="<?php echo esc_attr( $slug ); ?>" class="regular-text" placeholder="elementor" />
				<button class="button button-primary">Check</button>
			</p>
		</form>

		<h2>Upload a plugin to check before installing</h2>
		<p>Accepts a <code>.zip</code> file up to <?php echo (int) ( PCG_Upload_Handler::MAX_UPLOAD_BYTES / 1048576 ); ?> MB. Runs the same version rules plus a PHP syntax sweep so obviously-broken archives are flagged before you install them. It does not catch runtime issues (undefined classes, missing deps) — use Phan/PHPStan for that.</p>
		<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="pcg_check_upload" />
			<?php wp_nonce_field( 'pcg_check_upload' ); ?>
			<p>
				<input type="file" name="plugin_zip" accept=".zip,application/zip,application/x-zip-compressed" required />
				<button class="button button-primary">Check upload</button>
			</p>
		</form>

		<?php if ( $error ) : ?>
			<div class="notice notice-error" style="margin-top:16px;">
				<p><?php echo esc_html( $error->get_error_message() ); ?></p>
			</div>
		<?php endif; ?>

		<?php if ( $verdict ) : ?>
			<?php pcg_render_verdict_card( $verdict ); ?>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Handle the admin-post upload submission. Runs the checker, stashes
 * the verdict (or WP_Error) in a per-user transient, and redirects
 * back to the page (PRG — so reload doesn't re-upload).
 */
function pcg_handle_upload_post() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Insufficient permissions.' );
	}
	check_admin_referer( 'pcg_check_upload' );

	$handler = new PCG_Upload_Handler();
	$file    = isset( $_FILES['plugin_zip'] ) ? $_FILES['plugin_zip'] : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- the handler validates shape + fields itself.
	$result  = $handler->handle( $file );

	set_transient( pcg_upload_transient_key(), $result, 60 );
	wp_safe_redirect( admin_url( 'tools.php?page=plugin-conflicts-guardian' ) );
	exit;
}

/**
 * Per-user transient key for stashing the upload result between POST
 * and GET.
 *
 * @return string
 */
function pcg_upload_transient_key() {
	return 'pcg_upload_' . get_current_user_id();
}

/**
 * Render the verdict card: colored status badge + reasons, with the raw
 * payloads collapsed underneath for debugging.
 *
 * @param PCG_Verdict $verdict Verdict to render.
 */
function pcg_render_verdict_card( $verdict ) {
	$colors          = array(
		PCG_Verdict::STATUS_SAFE  => array( '#dff0d8', '#3c763d' ),
		PCG_Verdict::STATUS_WARN  => array( '#fcf8e3', '#8a6d3b' ),
		PCG_Verdict::STATUS_BLOCK => array( '#f2dede', '#a94442' ),
	);
	list( $bg, $fg ) = $colors[ $verdict->status ] ?? $colors[ PCG_Verdict::STATUS_WARN ];
	?>
	<div style="margin-top:16px;padding:16px;background:<?php echo esc_attr( $bg ); ?>;border-left:4px solid <?php echo esc_attr( $fg ); ?>;">
		<strong style="color:<?php echo esc_attr( $fg ); ?>;font-size:14px;">
			<?php echo esc_html( strtoupper( $verdict->status ) ); ?>
		</strong>
		<ul style="margin:8px 0 0;">
			<?php foreach ( $verdict->reasons as $reason ) : ?>
				<li><?php echo esc_html( $reason ); ?></li>
			<?php endforeach; ?>
		</ul>
		<details style="margin-top:12px;">
			<summary style="cursor:pointer;">Raw data</summary>
			<pre style="max-width:720px;overflow:auto;background:#fff;border:1px solid #ccd0d4;padding:12px;"><?php echo esc_html( wp_json_encode( $verdict->raw, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) ); ?></pre>
		</details>
	</div>
	<?php
}
