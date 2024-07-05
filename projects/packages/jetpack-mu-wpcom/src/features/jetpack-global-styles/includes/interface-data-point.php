<?php
/**
 * Interface Data Point.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Global_Styles;

interface Data_Point {
	/**
	 * Return value of the data point.
	 *
	 * @return mixed
	 */
	public function get_value();
}
