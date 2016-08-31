<?php

/**
 * Module Name: Omnisearch
 * Module Description: Search your entire database from a single field in your dashboard.
 * Sort Order: 16
 * First Introduced: 2.3
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Developers
 * Feature: General
 * Additional Search Queries: search
 */

// Only do Jetpack Omnisearch if there isn't already a Core WP_Omnisearch Class.
if ( ! class_exists( 'WP_Omnisearch' ) ) {
	require_once( dirname( __FILE__ ) . '/omnisearch/omnisearch-core.php' );
}
