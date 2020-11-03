<?php
/**
 * Pinterest Block tests.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Extensions\Pinterest;
require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/pinterest/pinterest.php';

/**
 * Pinterest block tests.
 */
class WP_Test_Pinterest extends \WP_UnitTestCase {
	/**
	 * `pin_type` with null URL
	 */
	public function test_pin_type_with_null_url() {
		$pin_type = Pinterest\pin_type( null );
		$this->assertSame( '', $pin_type );
	}

	/**
	 * `pin_type` with empty string URL
	 */
	public function test_pin_type_with_empty_url() {
		$pin_type = Pinterest\pin_type( '' );
		$this->assertSame( '', $pin_type );
	}

	/**
	 * `pin_type` with invalid URL
	 */
	public function test_pin_type_with_invalid_url() {
		$pin_type = Pinterest\pin_type( 'abcdefghijk' );
		$this->assertSame( '', $pin_type );

		$pin_type = Pinterest\pin_type( 'file://www.pinterest.com/pin/12345' );
		$this->assertSame( '', $pin_type );
	}

	/**
	 * `pin_type` with invalid subdomain to Pinterest URL
	 */
	public function test_pin_type_with_invalid_subdomain_url() {
		$pin_type = Pinterest\pin_type( 'https://abc.pinterest.com/pin/12345' );
		$this->assertSame( '', $pin_type );
	}

	/**
	 * `pin_type` with invalid path in Pinterest URL
	 */
	public function test_pin_type_with_invalid_path() {
		$pin_type = Pinterest\pin_type( 'https://www.pinterest.com/' );
		$this->assertSame( '', $pin_type );
	}

	/**
	 * `pin_type` with www subdomain to valid Pinterest URL
	 */
	public function test_pin_type_with_www_subdomain() {
		$pin_type = Pinterest\pin_type( 'https://www.pinterest.com/pin/12345' );
		$this->assertSame( 'embedPin', $pin_type );
	}

	/**
	 * `pin_type` with locale subdomain to valid Pinterest URL
	 */
	public function test_pin_type_with_locale_subdomain() {
		$pin_type = Pinterest\pin_type( 'https://in.pinterest.com/pin/12345' );
		$this->assertSame( 'embedPin', $pin_type );
	}

	/**
	 * `pin_type` with username in Pinterest URL
	 */
	public function test_pin_type_with_username_url() {
		$pin_type = Pinterest\pin_type( 'https://www.pinterest.ca/foo/' );
		$this->assertSame( 'embedUser', $pin_type );
	}

	/**
	 * `pin_type` with username and board in Pinterest URL
	 */
	public function test_pin_type_with_username_and_board_url() {
		$pin_type = Pinterest\pin_type( 'https://www.pinterest.ca/foo/bar/' );
		$this->assertSame( 'embedBoard', $pin_type );
	}
}
