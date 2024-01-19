<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS;

class Generator {

	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';

	/**
	 * Return true if page is loaded to generate critical CSS
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public static function is_generating_critical_css() {
		return isset( $_GET[ self::GENERATE_QUERY_ACTION ] );
	}

	/**
	 * Get a Critical CSS status block, adding in local generation nonces (if applicable).
	 * i.e.: Call this method to supply enough Critical CSS status to kick off local generation,
	 * such as in response to a request-generate API call or during page initialization.
	 */
	public function get_generation_metadata() {
		$status = array();

		// Add a user-bound nonce to use when proxying CSS for Critical CSS generation.
		$status['proxy_nonce'] = wp_create_nonce( CSS_Proxy::NONCE_ACTION );

		return $status;
	}

	/**
	 * Add the critical css generation flag to a list if it's present in the URL.
	 * This is mainly used by filters for compatibility.
	 *
	 * @var $query_args    array The list to add the arg to.
	 *
	 * @return $query_args array The updatest list with query args.
	 */
	public static function add_generate_query_action_to_list( $query_args ) {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET[ self::GENERATE_QUERY_ACTION ] ) ) {
			$query_args[] = self::GENERATE_QUERY_ACTION;
		}

		return $query_args;
	}
}
