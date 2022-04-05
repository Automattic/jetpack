<?php
/**
 * This file is to be included where the Jetpack Waf is to be run. Note that it will potentially stop the whole
 * request as this is the point of a functioning firewall.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

WafRunner::define_mode();

if ( ! WafRunner::is_allowed_mode( JETPACK_WAF_MODE ) ) {
	return;
}

if ( ! WafRunner::did_run() ) {
	WafRunner::run();
}
