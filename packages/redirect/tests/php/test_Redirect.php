<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Test Redirect class
 */
class RedirectTest extends TestCase {

	/**
	 * Basic tests to get_url method.
	 */
	public function test_get_url() {

		$url = Redirect::get_url( 'simple' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org', $url );

		// Test invalid parameter.
		$url = Redirect::get_url( 'simple', array( 'invalid' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org', $url );

		// Test path.
		$url = Redirect::get_url( 'simple', array( 'path' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&path=value', $url );

		// Test path special chars.
		$url = Redirect::get_url( 'simple', array( 'path' => 'weird value!' ) );
		$v   = rawurlencode( 'weird value!' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&path=' . $v, $url );

		// Test query.
		$url = Redirect::get_url( 'simple', array( 'query' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&query=value', $url );

		// Test query special chars.
		$url = Redirect::get_url( 'simple', array( 'query' => 'key=value&key2=value2' ) );
		$v   = rawurlencode( 'key=value&key2=value2' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&query=' . $v, $url );

		// Test anchor.
		$url = Redirect::get_url( 'simple', array( 'anchor' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&anchor=value', $url );

		// Test anchor special chars.
		$url = Redirect::get_url( 'simple', array( 'anchor' => 'key=value&key2=value2' ) );
		$v   = rawurlencode( 'key=value&key2=value2' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&anchor=' . $v, $url );

	}

}
