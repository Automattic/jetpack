<?php
/**
 * Contract for the proxy's per-widget response formatters.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST\Formatters;

use WP_REST_Request;

/**
 * A formatter sits between the API proxy and the upstream WPCOM request: it can
 * inject upstream query defaults and reshape the raw response body into a
 * consistent, widget-friendly contract. Implementations are resolved per area
 * (the first endpoint segment) by Formatter_Registry.
 */
interface Widget_Formatter {

	/**
	 * Upstream query defaults to merge into the WPCOM request. Caller-supplied
	 * params take precedence over these.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array<string, scalar>
	 */
	public function upstream_params( WP_REST_Request $request ): array;

	/**
	 * Reshape the decoded WPCOM body. Return the body unchanged to pass through.
	 *
	 * @param array           $raw     Decoded (associative) WPCOM response body.
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array
	 */
	public function format( array $raw, WP_REST_Request $request ): array;
}
