<?php

define( 'JETPACK__MINIMUM_WP_VERSION', '5.0' );

/**
 * Outputs for an admin notice about running Jetpack on outdated WordPress.
 *
 * @since 7.2.0
 */
function jetpack_admin_unsupported_wp_notice() { ?>
	<div class="notice notice-error is-dismissible">
		<p><?php esc_html_e( 'Jetpack requires a more recent version of WordPress and has been paused. Please update WordPress to continue enjoying Jetpack.', 'jetpack' ); ?></p>
	</div>
	<?php
}

if ( version_compare( $GLOBALS['wp_version'], JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
	add_action( 'admin_notices', 'jetpack_admin_unsupported_wp_notice' );
	return;
}

class Compat {

}