<?php
/**
 * Module Name: Search
 * Module Description: Help visitors quickly find answers with highly relevant instant search results and powerful filtering.
 * First Introduced: 5.0
 * Sort Order: 34
 * Free: false
 * Requires Connection: Yes
 * Auto Activate: No
 * Feature: Search
 * Additional Search Queries: search, elastic, elastic search, elasticsearch, fast search, search results, search performance, google search
 * Plans: business, complete
 *
 * @package automattic/jetpack
 */

define( 'JETPACK__SEARCH_FALLBACK_TRANSLATION_MD5', '1a2821bfb803906d5e27' );

// Include everything.
require_once __DIR__ . '/search/class.jetpack-search.php';
require_once __DIR__ . '/search/class-jetpack-search-customberg.php';

Jetpack_Search::instance();
Automattic\Jetpack\Search\Jetpack_Search_Customberg::instance();
