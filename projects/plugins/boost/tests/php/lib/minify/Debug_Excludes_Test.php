<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\After;

/**
 * Tests for the per-request concatenate/minify exclude debug GET parameters
 * (`jb-minify-js-excludes` / `jb-minify-css-excludes`).
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib\Minify
 */
class Debug_Excludes_Test extends Base_TestCase {

	const SAVED_JS_EXCLUDES  = array( 'jquery', 'jquery-core' );
	const SAVED_CSS_EXCLUDES = array( 'admin-bar' );

	protected function set_up() {
		parent::set_up();
		require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';

		// Note: wp_unslash() is provided by tests/bootstrap.php.
		Functions\when( 'jetpack_boost_ds_get' )->alias(
			function ( $key ) {
				if ( 'minify_js_excludes' === $key ) {
					return self::SAVED_JS_EXCLUDES;
				}
				if ( 'minify_css_excludes' === $key ) {
					return self::SAVED_CSS_EXCLUDES;
				}
				return null;
			}
		);
	}

	/**
	 * @after
	 */
	#[After]
	protected function clean_up_get_superglobal() {
		unset( $_GET['jb-minify-js-excludes'], $_GET['jb-minify-css-excludes'] );
	}

	public function test_saved_list_returned_when_param_absent() {
		$this->assertSame( self::SAVED_JS_EXCLUDES, jetpack_boost_page_optimize_js_exclude_list() );
		$this->assertSame( self::SAVED_CSS_EXCLUDES, jetpack_boost_page_optimize_css_exclude_list() );
	}

	public function test_js_handles_merged_for_administrators() {
		$_GET['jb-minify-js-excludes'] = 'my-plugin-script, another_script.v2';

		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$this->assertSame(
			array( 'jquery', 'jquery-core', 'my-plugin-script', 'another_script.v2' ),
			jetpack_boost_page_optimize_js_exclude_list()
		);
	}

	public function test_css_handles_merged_for_administrators() {
		$_GET['jb-minify-css-excludes'] = 'my-theme-style';

		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$this->assertSame(
			array( 'admin-bar', 'my-theme-style' ),
			jetpack_boost_page_optimize_css_exclude_list()
		);
	}

	public function test_params_ignored_without_manage_options_capability() {
		$_GET['jb-minify-js-excludes']  = 'my-plugin-script';
		$_GET['jb-minify-css-excludes'] = 'my-theme-style';

		Functions\when( 'current_user_can' )->justReturn( false );

		$this->assertSame( self::SAVED_JS_EXCLUDES, jetpack_boost_page_optimize_js_exclude_list() );
		$this->assertSame( self::SAVED_CSS_EXCLUDES, jetpack_boost_page_optimize_css_exclude_list() );
	}

	public function test_invalid_handles_are_ignored_entirely() {
		$_GET['jb-minify-js-excludes'] = implode(
			',',
			array(
				'valid-handle',
				'<script>alert(1)</script>',
				'../../etc/passwd',
				'foo bar',
				'handle"quote',
				'',
				'   ',
				'ok_handle.min',
			)
		);

		Functions\when( 'current_user_can' )->justReturn( true );

		$this->assertSame(
			array( 'jquery', 'jquery-core', 'valid-handle', 'ok_handle.min' ),
			jetpack_boost_page_optimize_js_exclude_list()
		);
	}

	public function test_handles_are_trimmed_but_case_is_preserved() {
		// Handles are matched case-sensitively downstream, so an uppercase handle
		// must be preserved verbatim (after trimming) rather than lowercased —
		// lowercasing would silently fail to exclude it.
		$_GET['jb-minify-js-excludes'] = '  My-Plugin-Script  ';

		Functions\when( 'current_user_can' )->justReturn( true );

		$this->assertSame(
			array( 'jquery', 'jquery-core', 'My-Plugin-Script' ),
			jetpack_boost_page_optimize_js_exclude_list()
		);
	}

	public function test_saved_list_returned_unchanged_when_all_handles_invalid() {
		// Param is present, is a string, and the user is an admin, but every handle
		// is rejected by the allowlist — the saved list must come back untouched.
		$_GET['jb-minify-js-excludes'] = '<script>, ../../etc/passwd,    ';

		Functions\when( 'current_user_can' )->justReturn( true );

		$this->assertSame( self::SAVED_JS_EXCLUDES, jetpack_boost_page_optimize_js_exclude_list() );
	}

	public function test_saved_list_returned_when_param_is_empty_string() {
		$_GET['jb-minify-js-excludes'] = '';

		Functions\when( 'current_user_can' )->justReturn( true );

		$this->assertSame( self::SAVED_JS_EXCLUDES, jetpack_boost_page_optimize_js_exclude_list() );
	}

	public function test_number_of_js_handles_processed_is_capped() {
		// Only the first 100 handles are processed so the per-asset parse stays
		// bounded; the excess is dropped without discarding the partial list.
		$handles                       = array_map(
			static function ( $i ) {
				return sprintf( 'h%03d', $i );
			},
			range( 1, 150 )
		);
		$_GET['jb-minify-js-excludes'] = implode( ',', $handles );

		Functions\when( 'current_user_can' )->justReturn( true );

		$result = jetpack_boost_page_optimize_js_exclude_list();

		// Two saved handles + the first 100 requested handles.
		$this->assertCount( 102, $result );
		$this->assertContains( 'h100', $result );
		$this->assertNotContains( 'h101', $result );
	}

	public function test_number_of_css_handles_processed_is_capped() {
		$handles                        = array_map(
			static function ( $i ) {
				return sprintf( 'h%03d', $i );
			},
			range( 1, 150 )
		);
		$_GET['jb-minify-css-excludes'] = implode( ',', $handles );

		Functions\when( 'current_user_can' )->justReturn( true );

		$result = jetpack_boost_page_optimize_css_exclude_list();

		// One saved handle + the first 100 requested handles.
		$this->assertCount( 101, $result );
		$this->assertContains( 'h100', $result );
		$this->assertNotContains( 'h101', $result );
	}

	public function test_duplicate_handles_are_not_added_twice() {
		$_GET['jb-minify-js-excludes'] = 'jquery-core,jquery-core,new-handle';

		Functions\when( 'current_user_can' )->justReturn( true );

		$this->assertSame(
			array( 'jquery', 'jquery-core', 'new-handle' ),
			jetpack_boost_page_optimize_js_exclude_list()
		);
	}

	public function test_non_string_param_is_ignored() {
		$_GET['jb-minify-js-excludes'] = array( 'my-plugin-script' );

		$this->assertSame( self::SAVED_JS_EXCLUDES, jetpack_boost_page_optimize_js_exclude_list() );
	}

	public function test_merged_list_is_never_persisted() {
		$_GET['jb-minify-js-excludes'] = 'my-plugin-script';

		Functions\when( 'current_user_can' )->justReturn( true );
		Functions\expect( 'jetpack_boost_ds_set' )->never();
		Functions\expect( 'update_option' )->never();

		jetpack_boost_page_optimize_js_exclude_list();

		// The saved list, as seen by the data sync store, is untouched.
		$this->assertSame( self::SAVED_JS_EXCLUDES, jetpack_boost_ds_get( 'minify_js_excludes' ) );
	}

	public function test_helper_handles_non_array_saved_list() {
		$_GET['jb-minify-js-excludes'] = 'my-plugin-script';

		Functions\when( 'current_user_can' )->justReturn( true );

		$this->assertSame(
			array( 'my-plugin-script' ),
			jetpack_boost_page_optimize_merge_debug_excludes( null, 'jb-minify-js-excludes' )
		);
	}
}
