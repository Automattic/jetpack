<?php
/**
 * Admin-page surface for the Plugin Conflicts Guardian.
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

/**
 * Render the Tools page. Accepts a `slug` query arg; when present, runs
 * the check and renders the result below the form.
 */
function pcg_render_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Insufficient permissions.' );
	}

	$slug    = isset( $_GET['slug'] ) ? sanitize_key( wp_unslash( $_GET['slug'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$verdict = null;
	if ( '' !== $slug ) {
		$checker = new PCG_Compat_Checker( new PCG_Wporg_Source(), new PCG_Site_State() );
		$verdict = $checker->check( $slug );
	}
	?>
	<div class="wrap">
		<h1>Plugin Compat Check</h1>
		<p>Pre-flight compatibility check against a plugin's WordPress.org metadata (required WP / PHP, tested-up-to) and this site's versions.</p>

		<form method="get" action="">
			<input type="hidden" name="page" value="plugin-conflicts-guardian" />
			<p>
				<label for="pcg-slug">Plugin slug</label><br />
				<input name="slug" id="pcg-slug" value="<?php echo esc_attr( $slug ); ?>" class="regular-text" placeholder="elementor" />
				<button class="button button-primary">Check</button>
			</p>
		</form>

		<?php if ( $verdict ) : ?>
			<?php pcg_render_verdict_card( $verdict ); ?>
		<?php endif; ?>
	</div>
	<?php
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
