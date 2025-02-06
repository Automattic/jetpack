<?php
/**
 * Loads view: admin/network-activated-notice.php
 *
 * @html-template Jetpack::load_view
 * @package automattic/jetpack
 */

Jetpack::init()->load_view( 'admin/network-activated-notice.php' );
do_action( 'jetpack_notices' );
