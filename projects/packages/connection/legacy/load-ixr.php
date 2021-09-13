<?php
/**
 * WordPress IXR classes aren't always loaded by default.
 *
 * Here we ensure that they are loaded before we declare our implementations.
 *
 * @package automattic/jetpack-connection
 * @since 1.7.0
 * @since-jetpack 7.7.0
 */

if ( defined( 'ABSPATH' ) && defined( 'WPINC' ) ) {
	require_once ABSPATH . WPINC . '/class-IXR.php';
}
