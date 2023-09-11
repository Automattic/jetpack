<?php
/**
 * Jetpack CRM REST API base controller class.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use WP_REST_Controller;

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

}
