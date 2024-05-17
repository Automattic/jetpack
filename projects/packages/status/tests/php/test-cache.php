<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status\Cache methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Status test suite.
 */
class Test_Cache extends TestCase {
	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();
		Cache::clear();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
		Cache::clear();
	}

	/**
	 * Test cache functionality.
	 */
	public function test_functionality() {
		Functions\when( 'get_current_blog_id' )->justReturn( 1 );
		$this->assertNull( Cache::get( 'foo' ) );
		$this->assertFalse( Cache::get( 'foo', false ) );
		Cache::set( 'foo', 42 );
		$this->assertSame( 42, Cache::get( 'foo' ) );
		$this->assertSame( 42, Cache::get( 'foo', false ) );

		Functions\when( 'get_current_blog_id' )->justReturn( 2 );
		$this->assertNull( Cache::get( 'foo' ) );
		Cache::set( 'foo', 23 );
		Cache::set( 'bar', 24 );
		$this->assertSame( 23, Cache::get( 'foo' ) );
		$this->assertSame( 24, Cache::get( 'bar' ) );

		Functions\when( 'get_current_blog_id' )->justReturn( 1 );
		$this->assertSame( 42, Cache::get( 'foo' ) );
		$this->assertNull( Cache::get( 'bar' ) );

		Cache::clear();
		$this->assertNull( Cache::get( 'foo' ) );
		$this->assertFalse( Cache::get( 'foo', false ) );

		Cache::set( 'foo', false );
		$this->assertFalse( Cache::get( 'foo' ) );
		Cache::set( 'foo', null );
		$this->assertNull( Cache::get( 'foo', true ) );
	}
}
