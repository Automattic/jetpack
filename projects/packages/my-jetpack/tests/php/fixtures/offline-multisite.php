<?php
/**
 * Multisite permission seam for isolated WorDBless tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * @return bool Whether to exercise the multisite permission gate.
 */
function is_multisite() {
	return true;
}
