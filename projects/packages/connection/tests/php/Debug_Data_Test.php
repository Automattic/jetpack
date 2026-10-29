<?php
/**
 * Tests for the Debug_Data class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Tests for the Debug_Data class.
 *
 * @covers \Automattic\Jetpack\Connection\Debug_Data
 */
#[CoversClass( Debug_Data::class )]
class Debug_Data_Test extends TestCase {

	/**
	 * Keep the connection tests the section runs from reaching the network.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter(
			'pre_http_request',
			static function () {
				return new \WP_Error( 'http_request_blocked', 'Blocked in tests.' );
			}
		);
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		StatusCache::clear();
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'debug_information' );
		remove_all_filters( 'jetpack_connection_debug_data' );
		Error_Handler::get_instance()->delete_all_errors();
		WorDBless_Options::init()->clear_options();
		( new Manager() )->reset_connection_status();
	}

	/**
	 * Tests that the section is added, and left to an older Jetpack plugin that adds its own.
	 */
	public function test_add_section_defers_to_legacy_jetpack() {
		$this->assertArrayHasKey( 'jetpack', Debug_Data::add_section( array() ) );

		// @phan-suppress-next-line PhanUndeclaredClassInCallable -- The class ships with older Jetpack plugins only.
		add_filter( 'debug_information', Debug_Data::LEGACY_CALLBACK );

		$this->assertSame( array(), Debug_Data::add_section( array() ) );
	}

	/**
	 * Tests that a token is reported by its key only, never its secret.
	 */
	public function test_get_fields_reports_token_key_only() {
		\Jetpack_Options::update_option( 'blog_token', 'blogkey.blogsecret' );
		\Jetpack_Options::update_option( 'id', 12345 );

		$fields = Debug_Data::get_fields();

		$this->assertSame( 'blogkey', $fields['blog_token']['value'] );
		$this->assertStringNotContainsString( 'blogsecret', wp_json_encode( $fields, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Tests that other packages and plugins can add fields.
	 */
	public function test_get_fields_applies_filter() {
		add_filter(
			'jetpack_connection_debug_data',
			static function ( $fields ) {
				$fields['extra'] = array(
					'label'   => 'Extra',
					'value'   => 'yes',
					'private' => false,
				);
				return $fields;
			}
		);

		$this->assertSame( 'yes', Debug_Data::get_fields()['extra']['value'] );
	}
}
