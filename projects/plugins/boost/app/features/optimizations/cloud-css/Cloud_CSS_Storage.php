<?php
/**
 * Critical CSS storage.
 *
 * @link       https://automattic.com
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;

/**
 * Critical CSS Storage class
 *
 * TODO: Instead of extending from Critical_CSS, consider extending both classes from a common parent class.
 */
class Cloud_CSS_Storage extends Critical_CSS_Storage {
	/**
	 * Critical_CSS_Storage constructor.
	 */
	public function __construct() {
		$this->storage = new Storage_Post_Type( 'cloud_css' );
	}
}
