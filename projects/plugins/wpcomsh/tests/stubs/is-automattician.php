<?php
/**
 * Runtime stub for WPCOM's is_automattician() used by ReprintExporterApiTest.
 *
 * Only loaded when the real function is absent (local WP PHPUnit).
 * Returns true iff the test has flipped $GLOBALS['__reprint_test_is_automattician'],
 * which set_available() does alongside enabling the site option.
 *
 * Phan sees the canonical is_automattician() declaration in
 * .phan/stubs/wpcom-stubs.php; this stub is for runtime only and is
 * suppressed below.
 *
 * @package wpcomsh
 */

if ( function_exists( 'is_automattician' ) ) {
	return;
}

/**
 * Test stub — see file docblock.
 *
 * @param int $user_id Ignored; accepted so the signature matches WPCOM's.
 * @return bool
 */
function is_automattician( $user_id = 0 ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
	unset( $user_id );
	return ! empty( $GLOBALS['__reprint_test_is_automattician'] );
}
