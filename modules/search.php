<?php

/**
 * Module Name: Search
 * Module Description: Enhanced search, powered by Elasticsearch, a powerful replacement for WordPress search.
 * First Introduced: 5.0
 * Sort Order: 34
 * Free: false
 * Requires Connection: Yes
 * Auto Activate: No
 * Feature: Search
 * Additional Search Queries: search, elastic, elastic search, elasticsearch, fast search, search results, search performance, google search
 * Plans: business
 */

require_once( dirname( __FILE__ ) . '/search/class.jetpack-search.php' );

Jetpack_Search::instance();
