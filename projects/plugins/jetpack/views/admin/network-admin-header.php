<?php
/**
 * Loads view: admin/network-activated-notice.php
 *
 * @html-template Jetpack::load_view
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Jetpack::init()->load_view( 'admin/network-activated-notice.php' );
do_action( 'jetpack_notices' );
