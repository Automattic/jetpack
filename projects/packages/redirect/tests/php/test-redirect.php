<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * File for testing Redirects.
 *
 * @package Automattic/jetpack-redirect
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Test Redirect class
 */
class RedirectTest extends TestCase {

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();
		$this->status = new Status();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Basic tests to get_url method.
	 */
	public function test_get_url() {
		Functions\when( 'home_url' )->justReturn( 'https://example.org' );
		Functions\when( 'get_current_blog_id' )->justReturn( 1 );
		Functions\when( 'get_option' )->justReturn();

		$url = Redirect::get_url( 'simple' );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org', $url );

		// Test a random parameter.
		$url = Redirect::get_url( 'simple', array( 'random' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&random=value', $url );

		// Test path.
		$url = Redirect::get_url( 'simple', array( 'path' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&path=value', $url );

		// Test path special chars.
		$url = Redirect::get_url( 'simple', array( 'path' => 'weird value!' ) );
		$v   = rawurlencode( 'weird value!' );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&path=' . $v, $url );

		// Test query.
		$url = Redirect::get_url( 'simple', array( 'query' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&query=value', $url );

		// Test query special chars.
		$url = Redirect::get_url( 'simple', array( 'query' => 'key=value&key2=value2' ) );
		$v   = rawurlencode( 'key=value&key2=value2' );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&query=' . $v, $url );

		// Test anchor.
		$url = Redirect::get_url( 'simple', array( 'anchor' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&anchor=value', $url );

		// Test anchor special chars.
		$url = Redirect::get_url( 'simple', array( 'anchor' => 'key=value&key2=value2' ) );
		$v   = rawurlencode( 'key=value&key2=value2' );
		$this->assertEquals( 'https://jetpack.com/redirect/?source=simple&site=example.org&anchor=' . $v, $url );

		// Test informing URL.
		$url = Redirect::get_url( 'https://wordpress.com/support' );
		$v   = rawurlencode( 'https://wordpress.com/support' );
		$this->assertEquals( 'https://jetpack.com/redirect/?url=' . $v . '&site=example.org', $url );

		// Test URL and query.
		$url   = Redirect::get_url( 'https://wordpress.com/support', array( 'query' => 'key=value&key2=value2' ) );
		$v     = rawurlencode( 'key=value&key2=value2' );
		$v_url = rawurlencode( 'https://wordpress.com/support' );
		$this->assertEquals( 'https://jetpack.com/redirect/?url=' . $v_url . '&site=example.org&query=' . $v, $url );

		// Test URL and query, discarding info from url.
		$url   = Redirect::get_url( 'https://wordpress.com/support?this=that#super', array( 'query' => 'key=value&key2=value2' ) );
		$v     = rawurlencode( 'key=value&key2=value2' );
		$v_url = rawurlencode( 'https://wordpress.com/support' );
		$this->assertEquals( 'https://jetpack.com/redirect/?url=' . $v_url . '&site=example.org&query=' . $v, $url );

	}

}
