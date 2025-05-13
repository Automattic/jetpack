<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

/**
 * Utility class for LCP functionality.
 */
class LCP_Utils {

	/**
	 * Get LCP analysis data for all cornerstone pages.
	 *
	 * @return array Array of LCP analysis data keyed by page URL.
	 */
	public static function get_analysis_data() {
		$cornerstone_pages = Cornerstone_Utils::get_list();
		$storage           = new LCP_Storage();
		$analysis_data     = array();

		foreach ( $cornerstone_pages as $page_url ) {
			$key      = Cornerstone_Utils::get_provider_key( $page_url );
			$lcp_data = $storage->get_lcp( $key );
			if ( ! empty( $lcp_data ) ) {
				$analysis_data[ $page_url ] = $lcp_data;
			}
		}

		return $analysis_data;
	}
}
