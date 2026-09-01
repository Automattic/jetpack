<?php
/**
 * Plugin Name: Allow Emails from localhost
 * Description: WordPress doesn't allow emails from localhost so we change the hostname when sending.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

namespace Jetpack\Docker\MuPlugin\AllowEmailsFromLocalhost;

/**
 * Allow sending emails from the Docker dev environment.
 * WordPress relies on PHPMailer, which throws an exception when
 * using localhost as the server name. This mocks a different
 * email when needed.
 *
 * @param string $from_email Email address to send from.
 *
 * @return string Filtered email address to send from.
 */
function jetpack_allow_emails_from_localhost( $from_email ) {
	if ( $from_email === 'wordpress@localhost' ) {
		return 'wordpress@jetpack.docker.localhost';

	}
	return $from_email;
}
add_filter( 'wp_mail_from', __NAMESPACE__ . '\jetpack_allow_emails_from_localhost', 1, 3 );
