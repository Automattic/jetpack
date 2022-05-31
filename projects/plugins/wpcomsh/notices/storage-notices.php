<?php
/**
 * Storage notices file.
 *
 * @package wpcomsh
 */

/**
 * Adds an admin notice if the site's space_used is 95% or higher of its space_quota.
 */
function wpcomsh_storage_notices() {
	$site_info = wpcomsh_get_at_site_info();

	if ( empty( $site_info['space_used'] ) || empty( $site_info['space_quota'] ) ) {
		return;
	}

	$space_used  = $site_info['space_used'];
	$space_quota = wpcomsh_pro_plan_storage_override( $site_info['space_quota'] );

	// If usage is 0-95%, do not display warning.
	if ( $space_used <= $space_quota * 0.95 ) {
		return;
	}

	// Warning (95%-99% usage): Orange
	$notice_color_class = 'notice__icon-wrapper-orange';

	// Error (100%+ usage): Red
	if ( $space_used > $space_quota ) {
		$notice_color_class = 'notice__icon-wrapper-red';
	}

	$message = sprintf(
		/* translators: 1: Upload space used; 2: Upload space allowed; 3: percentage of allowed space used */
		__(
			'You are currently using <strong>%1$s</strong> out of <strong>%2$s</strong> upload limit (%3$s%%).',
			'wpcomsh'
		),
		size_format( $space_used, 1 ),
		size_format( $space_quota, 1 ),
		number_format_i18n( ( $space_used / $space_quota ) * 100.0 )
	);

	printf(
		'<div class="notice wpcomsh-notice">
			<span class="notice__icon-wrapper %s">
				<span class="dashicons dashicons-warning"></span>
			</span>
			<span class="notice__content">
				<span class="notice__text">%s</span>
			</span>
		</div>',
		esc_attr( $notice_color_class ),
		wp_kses_post( $message )
	);
}
add_action( 'admin_notices', 'wpcomsh_storage_notices' );
