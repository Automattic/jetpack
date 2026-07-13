<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack Beta wp-admin page toggles template.
 *
 * @html-template \Automattic\JetpackBeta\Admin::render -- Via plugin-select.template.php or plugin-manage.template.php
 * @package automattic/jetpack-beta
 */

use Automattic\JetpackBeta\Admin;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

?>
	<div class="jetpack-beta-card jetpack-beta-settings">
		<div class="jetpack-beta-section-label"><?php esc_html_e( 'Settings', 'jetpack-beta' ); ?></div>
		<div class="jetpack-beta-toggles">
			<?php Admin::show_toggle_autoupdates(); ?>
			<?php Admin::show_toggle_emails(); ?>
		</div>
	</div>
