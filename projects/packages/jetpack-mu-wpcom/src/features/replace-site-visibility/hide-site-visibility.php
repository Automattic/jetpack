<?php
/**
 * Hide various settings related to site visibility.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Hide the "Site Visibility" setting in Reading Settings.
 */
function wpcom_hide_site_visibility_setting() {
	echo '<style>
		.option-site-visibility {
			display: none !important;
		}
	</style>';
}
add_action( 'load-options-reading.php', 'wpcom_hide_site_visibility_setting' );

/**
 * Remove the "Update Services" section in Writing Settings.
 */
add_filter( 'enable_update_services_configuration', '__return_false' );
