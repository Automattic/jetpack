<?php
/**
 * External Media allows users to either select external photos in the Editor or import external photos in the WP Admin.
 * This is not a proper module, and it's always loaded when a site is connected to WordPress.com via module-extras.php.
 * In addition, the whole functionality lives in a separate External Media package.
 *
 * @package automattic/jetpack
 */

if ( class_exists( 'Automattic\Jetpack\External_Media\External_Media' ) ) {
	Automattic\Jetpack\External_Media\External_Media::init();
}
