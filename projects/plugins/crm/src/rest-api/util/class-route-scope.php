<?php
/**
 * Route scope.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */

namespace Automattic\Jetpack_CRM\REST_API\Util;

use WP_REST_Request;

defined( 'ABSPATH' ) || exit;

/**
 * Scopes functionality to REST API routes with a specific prefix.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */
class Route_Scope {
	/**
	 * Route namespace to cover.
	 *
	 * @var string
	 */
	protected $namespace;

	/**
	 * Route rest base to cover.
	 *
	 * @var string
	 */
	protected $rest_base;

	/**
	 * Constructor.
	 *
	 * @param string $namespace Route namespace to cover.
	 * @param string $rest_base Route rest base to cover.
	 */
	public function __construct( string $namespace, string $rest_base ) {
		$this->rest_base = trim( $rest_base, '/' );
		$this->namespace = trim( $namespace, '/' );
	}

	/**
	 * Does the scope cover the specified request?
	 *
	 * This method is useful in situations like hooks since WordPress does not provide a way to
	 * specify which routes to affect when using e.g. the "rest_request_after_callbacks" filter.
	 *
	 * @param WP_REST_Request $request Request to test.
	 * @return bool
	 */
	public function covers( WP_REST_Request $request ): bool {
		$regex = sprintf(
			'/^%s%s/i',
			preg_quote( "/$this->namespace", '/' ),
			preg_quote( "/$this->rest_base", '/' )
		);

		return preg_match( $regex, $request->get_route() );
	}
}
