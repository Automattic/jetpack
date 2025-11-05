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
		Functions\when( 'wp_enqueue_script' )->justReturn( true );
		Functions\when( 'wp_scripts' )->justReturn(
			new class() {
				public function get_data( $handle, $key ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- variables needed for function signature.
					return null;
				}
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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
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

		$add_inline_args = array( null, '', null );
		Functions\when( 'wp_add_inline_script' )->alias(
			function ( $handle, $data, $position ) use ( &$add_inline_args ) {
				$add_inline_args = array( $handle, $data, $position );
			}
		);

		Script_Data::render_script_data();

		$this->assertNotEmpty( $add_inline_args, 'wp_add_inline_script should be called' );
		list( $handle, $data, $position ) = $add_inline_args;
		$this->assertSame( Script_Data::SCRIPT_HANDLE, $handle );
		$this->assertStringContainsString( 'window.JetpackScriptData', $data );
		$this->assertStringContainsString( '"foo":"bar"', $data );
		$this->assertSame( 'before', $position );
	}

	public function test_render_script_data_for_unauthenticated_rest_request() {
		$ref = new \ReflectionProperty( Script_Data::class, 'did_render_script_data' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
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

		$add_inline_args = array( null, '', null );
		Functions\when( 'wp_add_inline_script' )->alias(
			function ( $handle, $data, $position ) use ( &$add_inline_args ) {
				$add_inline_args = array( $handle, $data, $position );
			}
		);

		Script_Data::render_script_data();

		$this->assertNotEmpty( $add_inline_args, 'wp_add_inline_script should be called' );
		list( $handle, $data, $position ) = $add_inline_args;
		$this->assertSame( Script_Data::SCRIPT_HANDLE, $handle );
		$this->assertStringContainsString( 'window.JetpackScriptData', $data );
		$this->assertStringContainsString( '"public":"baz"', $data );
		$this->assertSame( 'before', $position );
	}

	public function test_render_script_data_for_authenticated_rest_request_with_block_editor_assets() {
		$ref = new \ReflectionProperty( Script_Data::class, 'did_render_script_data' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
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

		Script_Data::render_script_data();

		$this->assertNotEmpty( $add_inline_args, 'wp_add_inline_script should be called' );
		list( $handle, $data, $position ) = $add_inline_args;
		$this->assertSame( Script_Data::SCRIPT_HANDLE, $handle );
		$this->assertStringContainsString( 'window.JetpackScriptData', $data );
		$this->assertStringContainsString( '"foo":"bar"', $data );
		$this->assertSame( 'before', $position );
	}

	public function test_render_script_data_with_no_data() {
		$ref = new \ReflectionProperty( Script_Data::class, 'did_render_script_data' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		$ref->setValue( null, false );

		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( false );
		Functions\when( 'current_user_can' )->justReturn( false );
		Functions\when( 'did_action' )->alias(
			function () {
				return false;
			}
		);

		Monkey\Filters\expectApplied( 'jetpack_public_js_script_data' )->andReturn( array() );

		// Should not call wp_add_inline_script if no data.
		Functions\expect( 'wp_add_inline_script' )->never();

		Script_Data::render_script_data();
		$this->assertTrue( true, 'No data should result in no script output.' );
	}

	public function test_render_script_data_for_front_end_public_context_with_data() {
		// Simulate front-end context
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( false );
		Functions\when( 'current_user_can' )->justReturn( false );
		Functions\when( 'did_action' )->alias(
			function ( $hook = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- variables needed for function signature.
				return false;
			}
		);
		Monkey\Filters\expectApplied( 'jetpack_public_js_script_data' )->andReturn( array( 'public' => 'front' ) );

		$add_inline_args = array( null, '', null );
		Functions\when( 'wp_add_inline_script' )->alias(
			function ( $handle, $data, $position ) use ( &$add_inline_args ) {
				$add_inline_args = array( $handle, $data, $position );
			}
		);

		Script_Data::render_script_data();

		$this->assertNotEmpty( $add_inline_args, 'wp_add_inline_script should be called' );
		list( $handle, $data, $position ) = $add_inline_args;
		$this->assertSame( Script_Data::SCRIPT_HANDLE, $handle );
		$this->assertStringContainsString( 'window.JetpackScriptData', $data );
		$this->assertStringContainsString( '"public":"front"', $data );
		$this->assertSame( 'before', $position );
	}

	public function test_no_public_script_if_no_public_data() {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( false );
		Functions\when( 'current_user_can' )->justReturn( false );
		Functions\when( 'did_action' )->alias(
			function ( $hook = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- variables needed for function signature.
				return false;
			}
		);
		Monkey\Filters\expectApplied( 'jetpack_public_js_script_data' )->andReturn( array() );

		Functions\expect( 'wp_add_inline_script' )->never();

		Script_Data::render_script_data();

		$this->assertTrue( true, 'No public data should result in no script output.' );
	}

	public function test_render_script_data_for_admin_context_outputs_admin_data_only() {
		// Simulate admin context
		Functions\when( 'is_admin' )->justReturn( true );
		Functions\when( 'wp_is_serving_rest_request' )->justReturn( false );
		Functions\when( 'current_user_can' )->justReturn( true );
		Functions\when( 'did_action' )->alias(
			function ( $hook = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- variables needed for function signature.
				return false;
			}
		);
		// Admin data should be used
		Monkey\Filters\expectApplied( 'jetpack_admin_js_script_data' )->andReturn( array( 'admin' => 'data' ) );
		// Public data should not be used, but we mock it to ensure it's ignored
		Monkey\Filters\expectApplied( 'jetpack_public_js_script_data' )->andReturn( array( 'public' => 'should_not_be_used' ) );

		$add_inline_args = array( null, '', null );
		Functions\when( 'wp_add_inline_script' )->alias(
			function ( $handle, $data, $position ) use ( &$add_inline_args ) {
				$add_inline_args = array( $handle, $data, $position );
			}
		);

		Script_Data::render_script_data();

		$this->assertNotEmpty( $add_inline_args, 'wp_add_inline_script should be called' );
		list( $handle, $data, $position ) = $add_inline_args;
		$this->assertSame( Script_Data::SCRIPT_HANDLE, $handle );
		$this->assertStringContainsString( 'window.JetpackScriptData', $data );
		$this->assertStringContainsString( '"admin":"data"', $data );
		$this->assertStringNotContainsString( 'should_not_be_used', $data );
		$this->assertSame( 'before', $position );
	}
}
