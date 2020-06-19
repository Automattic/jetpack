<?php

use Automattic\Jetpack\Device_Detection;

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
	$pre = apply_filters( 'pre_jetpack_is_mobile', null, $kind, $return_matched_agent );
	if ( $pre ) {
		return $pre;
	}

	$return = false;
	$device_info = Device_Detection::get_info();

	if ( 'any' === $kind ) {
		$return = $device_info['is_mobile'];
	} elseif ( 'smart' === $kind ) {
		$return = $device_info['is_smartphone'];
	} elseif ( 'dumb' === $kind ) {
		$return = $device_info['is_mobile'] && ! $device_info['is_smartphone'];
	}

	if ( $return_matched_agent && true === $return ) {
		$return = $device_info['is_mobile_matched_ua'];
	}

	return apply_filters( 'jetpack_is_mobile', $return, $kind, $return_matched_agent );
}
