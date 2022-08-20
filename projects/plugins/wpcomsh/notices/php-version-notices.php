<?php
/**
 * PHP version notices file.
 *
 * @package wpcomsh
 */

/**
 * Adds an admin notice if the PHP version needs to be updated.
 *
 * This notice is currently not hooked! See p7DVsv-fbI-p2 for more information.
 */
function wpcomsh_minimum_php_version_notice() {
	$minimum_php_version = '8.0.0';

	if ( ! wpcom_site_has_feature( WPCOM_Features::SFTP ) ) {
		return;
	}

	if ( version_compare( PHP_VERSION, $minimum_php_version, '>=' ) ) {
		return;
	}

	$eol_date = '2022-11-28 00:00:00';
	$eol_date = date_i18n( get_option( 'date_format' ), strtotime( get_date_from_gmt( $eol_date ) ) );

	$message = sprintf(
		/* translators: 1: version number such as 1.0.0; 2: a localized date using the user chosen date format; 3: version number such as 1.0.0; 4: A URL. */
		__(
			'You are currently using PHP <strong>%1$s</strong> which will no longer receive security updates as of %2$s. Please update to PHP %3$s or higher by changing your <a href="%4$s">hosting configuration</a>.',
			'wpcomsh'
		),
		PHP_VERSION,
		$eol_date,
		$minimum_php_version,
		esc_url(
			sprintf(
				'https://wordpress.com/hosting-config/%s',
				( new Automattic\Jetpack\Status() )->get_site_suffix()
			)
		)
	);

	printf(
		'<div class="notice wpcomsh-notice">
			<span class="notice__icon-wrapper notice__icon-wrapper-orange">
				<span class="dashicons dashicons-warning"></span>
			</span>
			<span class="notice__content">
				<span class="notice__text">%s</span>
			</span>
		</div>',
		wp_kses_post( $message )
	);
}
// add_action( 'admin_notices', 'wpcomsh_minimum_php_version_notice' );
