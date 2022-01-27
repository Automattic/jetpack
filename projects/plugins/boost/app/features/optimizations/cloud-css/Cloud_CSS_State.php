<?php
/**
 * Cloud CSS state.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Transient;

/**
 * Cloud CSS State
 */
class Cloud_CSS_State extends Critical_CSS_State {

	const KEY = 'cloud_css_state';
}
