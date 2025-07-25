<?php

namespace Automattic\Jetpack\Assets;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

class ScriptDataTest extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		// Stub esc_url_raw and other common WP functions to avoid undefined errors.
		Functions\when( 'esc_url_raw' )->alias(
			function ( $url ) {
				return $url;
			}
		);
		Functions\when( 'admin_url' )->alias(
			function () {
				return 'http://example.com/wp-admin/';
			}
		);
		Functions\when( 'get_option' )->alias(
			function () {
				return 'option_value';
			}
		);
		Functions\when( 'is_multisite' )->justReturn( false );
		Functions\when( 'wp_create_nonce' )->alias(
			function () {
				return 'nonce';
			}
		);
		Functions\when( 'rest_url' )->alias(
			function () {
				return 'http://example.com/wp-json/';
			}
		);
		Functions\when( 'get_bloginfo' )->alias(
			function () {
				return 'Test Blog';
			}
		);
		Functions\when( 'get_site_url' )->alias(
			function () {
				return 'http://example.com/';
			}
		);
		Functions\when( 'has_site_icon' )->justReturn( false );
		Functions\when( 'wp_get_current_user' )->alias(
			function () {
				return (object) array(
					'display_name' => 'Test User',
					'ID'           => 1,
				);
			}
		);
		Functions\when( 'get_current_blog_id' )->justReturn( 1 );
		Functions\when( 'home_url' )->alias(
			function () {
				return 'http://example.com/';
			}
		);
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		// Reset the static property for isolation between tests.
		$ref = new \ReflectionProperty( Script_Data::class, 'did_render_script_data' );
		$ref->setAccessible( true );
		$ref->setValue( null, false );
		parent::tearDown();
	}

	public function test_render_script_data_for_authenticated_rest_request() {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( true );
		Functions\when( 'current_user_can' )->justReturn( true );
		Functions\when( 'did_action' )->alias(
			function () {
				return false;
			}
		);

		Monkey\Filters\expectApplied( 'jetpack_admin_js_script_data' )->andReturn( array( 'foo' => 'bar' ) );

		$captured = null;
		Functions\when( 'wp_print_inline_script_tag' )->alias(
			function ( $arg ) use ( &$captured ) {
				$captured = $arg;
			}
		);
		// wp_add_inline_script should not be called in this context.
		Functions\expect( 'wp_add_inline_script' )->never();

		Script_Data::render_script_data();

		if ( ! is_string( $captured ) ) {
			$this->fail( 'wp_print_inline_script_tag should be called' );
		}
		$this->assertStringContainsString( 'window.JetpackScriptData', $captured );
		$this->assertStringContainsString( '"foo":"bar"', $captured );
	}

	public function test_render_script_data_for_unauthenticated_rest_request() {
		// Reset static property in case previous test set it.
		$ref = new \ReflectionProperty( Script_Data::class, 'did_render_script_data' );
		$ref->setAccessible( true );
		$ref->setValue( null, false );

		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( true );
		Functions\when( 'current_user_can' )->justReturn( false );
		Functions\when( 'did_action' )->alias(
			function () {
				return false;
			}
		);

		Monkey\Filters\expectApplied( 'jetpack_public_js_script_data' )->andReturn( array( 'public' => 'baz' ) );

		$captured = null;
		Functions\when( 'wp_print_inline_script_tag' )->alias(
			function ( $arg ) use ( &$captured ) {
				$captured = $arg;
			}
		);
		// wp_add_inline_script should not be called in this context.
		Functions\expect( 'wp_add_inline_script' )->never();

		Script_Data::render_script_data();

		if ( ! is_string( $captured ) ) {
			$this->fail( 'wp_print_inline_script_tag should be called' );
		}
		$this->assertStringContainsString( 'window.JetpackScriptData', $captured );
		$this->assertStringContainsString( '"public":"baz"', $captured );
	}

	public function test_render_script_data_for_authenticated_rest_request_with_block_editor_assets() {
		// Reset static property in case previous test set it.
		$ref = new \ReflectionProperty( Script_Data::class, 'did_render_script_data' );
		$ref->setAccessible( true );
		$ref->setValue( null, false );

		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( true );
		Functions\when( 'current_user_can' )->justReturn( true );
		Functions\when( 'did_action' )->alias(
			function ( $hook ) {
				return $hook === 'enqueue_block_editor_assets';
			}
		);

		Monkey\Filters\expectApplied( 'jetpack_admin_js_script_data' )->andReturn( array( 'foo' => 'bar' ) );

		$add_inline_args = array( null, '', null );
		Functions\when( 'wp_add_inline_script' )->alias(
			function ( $handle, $data, $position ) use ( &$add_inline_args ) {
				$add_inline_args = array( $handle, $data, $position );
			}
		);
		Functions\expect( 'wp_print_inline_script_tag' )->never();

		Script_Data::render_script_data();

		$this->assertNotEmpty( $add_inline_args, 'wp_add_inline_script should be called' );
		list( $handle, $data, $position ) = $add_inline_args;
		$this->assertSame( Script_Data::SCRIPT_HANDLE, $handle );
		$this->assertStringContainsString( 'window.JetpackScriptData', $data );
		$this->assertStringContainsString( '"foo":"bar"', $data );
		$this->assertSame( 'before', $position );
	}
}
