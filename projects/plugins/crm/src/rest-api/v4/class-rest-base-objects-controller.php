<?php
/**
 * Jetpack CRM REST API base controller class for DAL objects.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use zbsDAL_ObjectLayer;

defined( 'ABSPATH' ) || exit;

/**
 * Abstract base controller class for DAL objects.
 *
 * @package Automattic\Jetpack\CRM
 * @since 6.1.0
 */
abstract class REST_Base_Objects_Controller extends REST_Base_Controller {

	/**
	 * Get CRM datalayer service.
	 *
	 * The main reason why we lazy load DAL is to allow tests to override the
	 * global instance with a mock before it's required by any endpoints.
	 *
	 * @since 6.1.0
	 *
	 * @return zbsDAL_ObjectLayer
	 */
	public function get_dal_service() {
		return $GLOBALS['zbs']->DAL;
	}

	/**
	 * Prepare object links for the request.
	 *
	 * @since 6.1.0
	 *
	 * @param int $item_id The unique object ID.
	 * @return array Links for the given object.
	 */
	protected function prepare_links( $item_id ) {
		$base = sprintf( '/%s/%s', $this->namespace, $this->rest_base );

		return array(
			'self'       => array(
				'href' => rest_url( trailingslashit( $base ) . $item_id ),
			),
			'collection' => array(
				'href' => rest_url( $base ),
			),
		);
	}
}
