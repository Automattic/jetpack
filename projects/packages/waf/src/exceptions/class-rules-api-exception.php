<?php
/**
 * Rules API exception.
 *
 * @since 0.10.1
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Custom exception for WAF rules API errors.
 */
class Rules_API_Exception extends Waf_Exception {

	/**
	 * Error slug which maps to WP_Error::$code.
	 *
	 * @var string
	 */
	const SLUG = 'rules_api_error';
}
