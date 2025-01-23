<?php
/**
 * Module Name: External Media
 * Module Description: Integrate the external media services to allow selecting or importing photos.
 * First Introduced: x.x.x
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Deactivate: false
 * Module Tags: Photos and Videos
 * Feature: Security, Health
 * Sort Order: 34
 * Additional Search Queries: photos, gallery, images
 *
 * @package automattic/jetpack
 */

if ( class_exists( 'Automattic\Jetpack\External_Media' ) ) {
	Automattic\Jetpack\External_Media::init();
}
