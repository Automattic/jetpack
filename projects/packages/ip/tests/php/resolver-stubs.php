<?php
/**
 * Shadows the DNS lookups Utils::resolve_host_ips() makes, so tests can hand it a
 * known set of addresses instead of depending on real name resolution.
 *
 * PHP resolves an unqualified call to a global function against the current namespace
 * first, so defining these inside Automattic\Jetpack\IP intercepts that one call site
 * and nothing else. With no answers set they delegate to the real functions, leaving
 * tests that want live DNS working.
 *
 * @package automattic/jetpack-ip
 */

namespace Automattic\Jetpack\IP;

/**
 * Shadows gethostbynamel() for calls made from this namespace.
 *
 * @param string $hostname Host to look up.
 * @return string[]|false
 */
function gethostbynamel( $hostname ) {
	return \Jetpack_IP_Test_Resolver::ipv4( $hostname );
}

/**
 * Shadows dns_get_record() for calls made from this namespace.
 *
 * The default is null rather than DNS_ANY so this file names no constant from
 * ext-dns, which the package treats as optional. A null type is handed to the real
 * function's own default.
 *
 * @param string   $hostname Host to look up.
 * @param int|null $type     Record type requested, null for the default.
 * @return array[]|false
 */
function dns_get_record( $hostname, $type = null ) {
	return \Jetpack_IP_Test_Resolver::ipv6( $hostname, $type );
}
