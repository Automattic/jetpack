<?php // phpcs:ignoreFile

/**
 * Jetpack Connection Client mock.
 *
 * @package automattic/jetpack-partner
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client;

/**
 * Class Connection_Client_Mock
 *
 * We create a mock version of the Connection Client, so we can define/mock the response
 * of its static methods (because PHPUnit doesn't support mocking static methods anymore).
 *
 * @link https://phpunit.readthedocs.io/en/9.5/test-doubles.html?highlight=static
 */
class Connection_Client_Mock extends Client {
	/**
	 * @var mixed
	 */
	protected static $response;

	/**
	 * Define the response.
	 *
	 * @param mixed $response
	 */
	public static function set_response( $response ) {
		self::$response = $response;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function wpcom_json_api_request_as_blog( $path, $version = self::WPCOM_JSON_API_VERSION, $args = array(), $body = null, $base_api_path = 'rest' ) {
		return self::$response;
	}
}
