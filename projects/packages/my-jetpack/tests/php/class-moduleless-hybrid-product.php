<?php
/**
 * Testing class
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * A Hybrid product with no Jetpack module, which no registered product is any longer.
 */
class Moduleless_Hybrid_Product extends Products\Backup {

	/**
	 * The Jetpack module name
	 *
	 * @var string|null
	 */
	public static $module_name = null;
}
