<?php
/**
 * Stand-ins for PHP's header functions, which do nothing on the command line.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Report that headers can still be sent.
 *
 * @return bool
 */
function headers_sent() {
	return false;
}

/**
 * Record a header instead of sending it.
 *
 * @param string $header        The header line.
 * @param bool   $replace       Unused; matches PHP's signature.
 * @param int    $response_code Unused; matches PHP's signature.
 */
function header( $header, $replace = true, $response_code = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	$GLOBALS['jetpack_waf_test_headers'][] = $header;
}
