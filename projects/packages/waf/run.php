<?php
/**
 * This file is to be included where the Jetpack Waf is to be run. Note that it will potentially stop the whole
 * request as this is the point of a functioning firewall.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

if ( ! Waf_Runner::is_enabled() ) {
	return;
}

Waf_Runner::define_mode();
Waf_Runner::define_share_data();

if ( ! Waf_Runner::is_allowed_mode( JETPACK_WAF_MODE ) ) {
	return;
}

if ( ! Waf_Runner::did_run() ) {
	Waf_Runner::run();
}
