<?php
/**
 * Cloud CSS state.
 *
 * @link       https://automattic.com
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS_State;

/**
 * Cloud CSS State
 *
 * TODO: Instead of extending from Critical_CSS, consider extending both classes from a common parent class.
 */
class Cloud_CSS_State extends Critical_CSS_State {

	const KEY = 'cloud_css_state';
}
