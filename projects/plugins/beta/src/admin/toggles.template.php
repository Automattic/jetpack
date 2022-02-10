<?php
/**
 * Jetpack Beta wp-admin page toggles template.
 *
 * @package automattic/jetpack-beta
 */

use Automattic\JetpackBeta\Admin;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
	<span class="dops-foldable-card__secondary">
		<?php Admin::show_toggle_emails(); ?>
		<?php Admin::show_toggle_autoupdates(); ?>
	</span>
