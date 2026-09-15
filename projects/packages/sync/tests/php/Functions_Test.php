<?php
/**
 * Test file for Automattic\Jetpack\Sync\Functions
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Class Functions_Test
 *
 * @covers Automattic\Jetpack\Sync\Functions
 */
#[CoversClass( Functions::class )]
class Functions_Test extends BaseTestCase {

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		Status_Cache::clear();
	}

	/**
	 * Runs after every test in this class.
	 */
	protected function tearDown(): void {
		remove_filter( 'jetpack_is_private_site', '__return_true' );
		delete_option( 'blog_public' );
		Status_Cache::clear();
		parent::tearDown();
	}

	/**
	 * Without the filter, the stored blog_public value is returned as-is.
	 *
	 * @dataProvider provide_stored_blog_public_values
	 *
	 * @param string $stored   The stored blog_public option value.
	 * @param int    $expected The expected effective value.
	 */
	#[DataProvider( 'provide_stored_blog_public_values' )]
	public function test_get_effective_blog_public_returns_stored_value( $stored, $expected ) {
		update_option( 'blog_public', $stored );

		$this->assertSame( $expected, Functions::get_effective_blog_public() );
	}

	/**
	 * Data provider for test_get_effective_blog_public_returns_stored_value.
	 *
	 * @return array[]
	 */
	public static function provide_stored_blog_public_values() {
		return array(
			'public'                    => array( '1', 1 ),
			'discourage search engines' => array( '0', 0 ),
			'private'                   => array( '-1', -1 ),
		);
	}

	/**
	 * A missing option falls back to public, matching the value core sets on install.
	 */
	public function test_get_effective_blog_public_defaults_to_public() {
		delete_option( 'blog_public' );

		$this->assertSame( 1, Functions::get_effective_blog_public() );
	}

	/**
	 * The filter reports the site as private without touching the stored option.
	 *
	 * @dataProvider provide_non_private_blog_public_values
	 *
	 * @param string $stored The stored blog_public option value.
	 */
	#[DataProvider( 'provide_non_private_blog_public_values' )]
	public function test_get_effective_blog_public_is_private_when_filtered( $stored ) {
		update_option( 'blog_public', $stored );
		add_filter( 'jetpack_is_private_site', '__return_true' );

		$this->assertSame( -1, Functions::get_effective_blog_public() );
		$this->assertSame( (int) $stored, (int) get_option( 'blog_public' ) );
	}

	/**
	 * Data provider for test_get_effective_blog_public_is_private_when_filtered.
	 *
	 * @return array[]
	 */
	public static function provide_non_private_blog_public_values() {
		return array(
			'public'                    => array( '1' ),
			'discourage search engines' => array( '0' ),
		);
	}

	/**
	 * The callable is registered so Sync sends it to WordPress.com.
	 */
	public function test_effective_blog_public_is_a_default_callable() {
		$this->assertSame(
			array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_effective_blog_public' ),
			Defaults::get_callable_whitelist()['effective_blog_public']
		);
	}
}
