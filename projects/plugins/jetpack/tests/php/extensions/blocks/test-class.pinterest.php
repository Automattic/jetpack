<?php
/**
 * Pinterest Block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Pinterest;
require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/pinterest/pinterest.php';

/**
 * Pinterest block tests.
 */
class WP_Test_Pinterest extends \WP_UnitTestCase {
	/**
	 * Test the Pin type detected for a given Pinterest URL.
	 *
	 * @covers Automattic\Jetpack\Extensions\Pinterest
	 * @dataProvider get_pinterest_urls
	 *
	 * @since 9.2.0
	 *
	 * @param null|string $url      Pinterest URL.
	 * @param string      $expected Pinterest pin type.
	 */
	public function test_pin_type( $url, $expected ) {
		$pin_type = Pinterest\pin_type( $url );

		$this->assertSame( $expected, $pin_type );
	}

	/**
	 * URL variations to be used by the Pinterest block.
	 *
	 * @covers Automattic\Jetpack\Extensions\Pinterest
	 */
	public function get_pinterest_urls() {
		return array(
			'null_url'               => array(
				null,
				'',
			),
			'empty_url'              => array(
				'',
				'',
			),
			'invalid_url'            => array(
				'abcdefghijk',
				'',
			),
			'invalid_protocol'       => array(
				'file://www.pinterest.com/pin/12345',
				'',
			),
			'invalid_subdomain_url'  => array(
				'https://abc.pinterest.com/pin/12345',
				'',
			),
			'invalid_path'           => array(
				'https://www.pinterest.com/',
				'',
			),
			'www_subdomain'          => array(
				'https://www.pinterest.com/pin/12345',
				'embedPin',
			),
			'locale_subdomain'       => array(
				'https://in.pinterest.com/pin/12345',
				'embedPin',
			),
			'username_url'           => array(
				'https://www.pinterest.ca/foo/',
				'embedUser',
			),
			'username_and_board_url' => array(
				'https://www.pinterest.ca/foo/bar/',
				'embedBoard',
			),
		);
	}
}
