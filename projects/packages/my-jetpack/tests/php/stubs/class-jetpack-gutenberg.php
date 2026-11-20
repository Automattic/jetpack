<?php
/**
 * A block-availability purchase lookup for an isolated boundary test.
 *
 * @package automattic/my-jetpack
 */
class Jetpack_Gutenberg {
	/** @return array Block availability. */
	public static function get_cached_availability() {
		\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog( '/upgrades?site=123', '1.2' );
		return array();
	}
}
