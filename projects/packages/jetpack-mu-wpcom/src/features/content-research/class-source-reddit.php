<?php
/**
 * Reddit source adapter for Content Research.
 *
 * NOTE: Reddit aggressively blocks requests from datacenter/cloud IPs (403 Forbidden),
 * regardless of User-Agent. This source is disabled by default until a proxy solution
 * (e.g. ScrapeCreators) is available. The adapter is kept as scaffolding for when
 * server-side Reddit access becomes possible.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Source_Reddit
 */
class Source_Reddit implements Content_Research_Source {

	/**
	 * Search Reddit for a given query.
	 *
	 * Currently returns empty results because Reddit blocks datacenter IPs.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results.
	 * @return array Normalized results (empty until proxy is available).
	 */
	public function search( string $query, int $count = 10 ): array {
		return array();
	}

	/**
	 * Get the source name.
	 *
	 * @return string
	 */
	public function get_source_name(): string {
		return 'reddit';
	}
}
