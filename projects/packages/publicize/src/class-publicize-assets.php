<?php
/**
 * Publicize_Assets.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Rest_Endpoints\Connections_Controller;

/**
 * Publicize_Assets class.
 */
class Publicize_Assets {

	/**
	 * Initialize the class.
	 */
	public static function configure() {
		Publicize_Script_Data::configure();
		new Connections_Controller();
	}
}
