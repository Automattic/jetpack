<?php
/**
 * WP_REST_Jetpack_AI_JWT file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\REST_Jetpack_AI_JWT;

/**
 * Class WP_REST_Jetpack_AI_JWT.
 *
 * @deprecated 0.11.0 Use Automattic\Jetpack\Connection\REST_Jetpack_AI_JWT instead.
 */
class WP_REST_Jetpack_AI_JWT extends REST_Jetpack_AI_JWT {

	/**
	 * WP_REST_Jetpack_AI_JWT constructor.
	 *
	 * @deprecated 0.11.0 Use Automattic\Jetpack\Connection\REST_Jetpack_AI_JWT instead.
	 */
	public function __construct() {
		_deprecated_class( __CLASS__, 'agents-manager-0.11.0', REST_Jetpack_AI_JWT::class );

		parent::__construct();
	}
}
