<?php

/**
 * Module Name: Search
 * Module Description: Enhanced search, powered by Elasticsearch
 * First Introduced: 5.0
 * Sort Order: 34
 * Free: false
 * Requires Connection: Yes
 * Auto Activate: No
 * Feature: Search
 * Additional Search Queries: search
 */

require_once( dirname( __FILE__ ) . '/search/class.jetpack-search.php' );

Jetpack_Search::instance();
