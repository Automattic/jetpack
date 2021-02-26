<?php
/**
 * WordPress IXR classes aren't always loaded by default.
 *
 * Here we ensure that they are loaded before we declare our implementations.
 *
 * @package automattic/jetpack-connection
 * @since 7.7
 */

if ( defined( 'ABSPATH' ) && defined( 'WPINC' ) ) {
	require_once ABSPATH . WPINC . '/class-IXR.php';
}
