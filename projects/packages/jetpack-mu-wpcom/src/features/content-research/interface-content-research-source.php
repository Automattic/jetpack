<?php
/**
 * Content Research Source interface.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Interface for content research source adapters.
 */
interface Content_Research_Source {
	/**
	 * Search a source for a given query.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results to return.
	 * @return array Normalized results array.
	 */
	public function search( string $query, int $count = 10 ): array;

	/**
	 * Get the name of this source.
	 *
	 * @return string The source name identifier.
	 */
	public function get_source_name(): string;
}
