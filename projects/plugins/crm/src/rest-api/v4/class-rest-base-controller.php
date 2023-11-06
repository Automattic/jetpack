<?php
/**
 * Jetpack CRM REST API base controller class.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use WP_REST_Controller;
use WP_REST_Request;

defined( 'ABSPATH' ) || exit;

/**
 * Abstract base controller class.
 *
 * @package Automattic\Jetpack\CRM
 * @since 6.1.0
 */
abstract class REST_Base_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 */
	public function __construct() {
		$this->namespace = 'jetpack-crm/v4';
	}

	/**
	 * Get the per page argument.
	 *
	 * We limit results to a maximum of 100 based on the default behaviour of WP Core REST API.
	 * You can read more about default behaviour in the official "REST API > Pagination" documentation.
	 *
	 * @link https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/#pagination-parameters
	 *
	 * @since 6.2.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return int Return the per page argument.
	 */
	protected function get_per_page_argument( WP_REST_Request $request ): ?int {
		$per_page = (int) $request->has_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;

		if ( $per_page > 100 ) {
			return 100;
		}

		return $per_page;
	}

	/**
	 * Get request offset.
	 *
	 * We cannot combine "page" and "offset" since they mean the same thing; they're just
	 * calculated and requested differently.
	 * You can check the official WordPress REST documentation for more information about
	 * how they're typically handled.
	 *
	 * @link https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/#pagination-parameters
	 *
	 * @since 6.2.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return int Return the offset argument.
	 */
	protected function get_offset_argument( WP_REST_Request $request ): int {
		if ( $request->has_param( 'offset' ) ) {
			return $request->get_param( 'offset' );
		}

		if ( $request->has_param( 'page' ) ) {
			// We have to reduce the page number by 1 when calculating the offset because otherwise we
			// would always display "the next page".
			//
			// E.g.: We want to display the second page with 10 results per page.
			// [Request] Page: 2, Per page: 10.
			// ["Translated"] We want to show post 11-20.
			// [Offset] (2 - 1) * 10 = 10
			// The outcome of the calculated offset means that we will return results after the first 10 entries.
			return ( $request->get_param( 'page' ) - 1 ) * $this->get_per_page_argument( $request );
		}

		return 0;
	}
}
