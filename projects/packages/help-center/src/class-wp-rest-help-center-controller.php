<?php
/**
 * Base Help Center REST controller.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Shares the configured WP.com request client with Help Center REST controllers.
 */
abstract class WP_REST_Help_Center_Controller extends \WP_REST_Controller {
	/**
	 * WP.com request client.
	 *
	 * @var Wpcom_Request_Client
	 */
	protected $wpcom_request_client;

	/**
	 * Constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		$this->wpcom_request_client = $wpcom_request_client ?? new Jetpack_Wpcom_Request_Client();
	}
}
