<?php
/**
 * Rules API exception.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Custom exception for WAF rules API errors.
 */
class Rules_API_Exception extends Waf_Exception {

	/**
	 * Error slug which maps to WP_Error::$code.
	 *
	 * @var string
	 */
	protected $slug = 'rules_api_error';

}
