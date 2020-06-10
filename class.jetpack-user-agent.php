<?php

use Automattic\Jetpack\Mobile;

/**
 * Determine if the current User Agent matches the passed $kind
 *
 * @param string $kind Category of mobile device to check for.
 *                         Either: any, dumb, smart.
 * @param bool   $return_matched_agent Boolean indicating if the UA should be returned
 *
 * @return bool|string Boolean indicating if current UA matches $kind. If
 *                              $return_matched_agent is true, returns the UA string
 */
function jetpack_is_mobile( $kind = 'any', $return_matched_agent = false ) {
	return Mobile::is_mobile( $kind, $return_matched_agent );
}
