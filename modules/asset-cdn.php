<?php
/**
 * Module Name: Asset CDN
 * Module Description: Speed up Javascript and CSS
 * Sort Order: 25
 * Recommendation Order: 2
 * First Introduced: 5.6
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Photos and Videos, Appearance
 * Feature: Appearance
 * Additional Search Queries: photon, cdn, performance, speed, minify, concatenate, javascript, js, css
 */

require_once( JETPACK__PLUGIN_DIR . 'modules/asset-cdn/asset-cdn.php' );
Jetpack_Asset_CDN::instance();
