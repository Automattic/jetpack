<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Test class
 */
class SoftWordPressTest extends TestCase {

	/**
	 * Basic tests to get_url method.
	 */
	public function test_get_url() {

		$url = Soft_Wp::get_url( 'simple' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org', $url );

		// Test invalid parameter.
		$url = Soft_Wp::get_url( 'simple', array( 'invalid' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org', $url );

		// Test path.
		$url = Soft_Wp::get_url( 'simple', array( 'path' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&path=value', $url );

		// Test path special chars.
		$url = Soft_Wp::get_url( 'simple', array( 'path' => 'weird value!' ) );
		$v   = rawurlencode( 'weird value!' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&path=' . $v, $url );

		// Test query.
		$url = Soft_Wp::get_url( 'simple', array( 'query' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&query=value', $url );

		// Test query special chars.
		$url = Soft_Wp::get_url( 'simple', array( 'query' => 'key=value&key2=value2' ) );
		$v   = rawurlencode( 'key=value&key2=value2' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&query=' . $v, $url );

		// Test anchor.
		$url = Soft_Wp::get_url( 'simple', array( 'anchor' => 'value' ) );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&anchor=value', $url );

		// Test anchor special chars.
		$url = Soft_Wp::get_url( 'simple', array( 'anchor' => 'key=value&key2=value2' ) );
		$v   = rawurlencode( 'key=value&key2=value2' );
		$this->assertEquals( 'https://jetpack.com/redirect?source=simple&site=example.org&anchor=' . $v, $url );

		// Test informing URL.
		$url = Soft_Wp::get_url( 'https://wordpress.com/support' );
		$v   = rawurlencode( 'https://wordpress.com/support' );
		$this->assertEquals( 'https://jetpack.com/redirect?url=' . $v . '&site=example.org', $url );

		// Test URL and query.
		$url   = Soft_Wp::get_url( 'https://wordpress.com/support', array( 'query' => 'key=value&key2=value2' ) );
		$v     = rawurlencode( 'key=value&key2=value2' );
		$v_url = rawurlencode( 'https://wordpress.com/support' );
		$this->assertEquals( 'https://jetpack.com/redirect?url=' . $v_url . '&site=example.org&query=' . $v, $url );

		// Test URL and query, discarding info from url.
		$url   = Soft_Wp::get_url( 'https://wordpress.com/support?this=that#super', array( 'query' => 'key=value&key2=value2' ) );
		$v     = rawurlencode( 'key=value&key2=value2' );
		$v_url = rawurlencode( 'https://wordpress.com/support' );
		$this->assertEquals( 'https://jetpack.com/redirect?url=' . $v_url . '&site=example.org&query=' . $v, $url );

	}

	public function test_options() {
		Soft_Wp::store( 'testing', 123 );
		$this->assertEquals( 123, Soft_Wp::get( 'testing' ) );
	}

}
