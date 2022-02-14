<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
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

use Automattic\Jetpack\Search\Classic_Search;

Automattic\Jetpack\Search\Jetpack_Initializer::initialize();

/**
 * These are old legacy class names that were deprecated due to the move to packages.
 *
 * @todo Does this make more sense as a legacy dir in the search package?
 */

/**
 * Jetpack Search deprecated class.
 *
 * @deprecated 10.6
 */
class Jetpack_Search {
	/**
	 * Singleton
	 */
	protected function __construct() {
	}

	/**
	 * Return the instance of the new class.
	 */
	public static function instance() {
		return Classic_Search::initialize( get_current_blog_id() );
	}
}
