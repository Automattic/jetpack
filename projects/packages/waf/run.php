<?php
/**
 * This file is to be included where the Jetpack Waf is to be run. Note that it will potentially stop the whole
 * request as this is the point of a functioning firewall.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

if ( ! defined( 'JETPACK_WAF_MODE' ) ) {
	$mode_option = get_option( WafRunner::MODE_OPTION_NAME );

	if ( ! WafRunner::is_allowed_mode( $mode_option ) ) {
		return;
	}

	define( 'JETPACK_WAF_MODE', $mode_option );
}

if ( ! WafRunner::is_allowed_mode( JETPACK_WAF_MODE ) ) {
	return;
}

if ( ! WafRunner::did_run() ) {
	WafRunner::run();
}
