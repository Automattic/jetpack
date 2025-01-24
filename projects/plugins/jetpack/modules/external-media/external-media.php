<?php
/**
 * External Media allows users to either select external photos in the Editor or import external photos in the WP Admin.
 *
 * @package automattic/jetpack
 */

if ( class_exists( 'Automattic\Jetpack\External_Media' ) ) {
	Automattic\Jetpack\External_Media::init();
}
