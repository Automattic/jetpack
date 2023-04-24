<?php
/**
 * Jetpack CRM REST API base controller class.
 *
 * @package Automattic\Jetpack_CRM
 */

namespace Automattic\Jetpack_CRM\REST_API\V4;

use WP_REST_Controller;

defined( 'ABSPATH' ) || exit;

/**
 * Abstract base controller class.
 *
 * @package Automattic\Jetpack_CRM
 * @since TBD
 */
abstract class REST_Base_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'jetpack-crm/v4';
	}

}
