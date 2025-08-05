<?php
/**
 * External Storage functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * External Storage functionality testing.
 *
 * @covers \Automattic\Jetpack\Connection\External_Storage
 */
#[CoversClass( External_Storage::class )]
class External_Storage_Test extends TestCase {

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_all_filters( 'jetpack_external_storage_critical_options' );
	}

	/**
	 * Test is_critical_option with default options.
	 */
	public function test_is_critical_option() {
		// Default critical options
		$this->assertTrue( External_Storage::is_critical_option( 'blog_token' ) );
		$this->assertTrue( External_Storage::is_critical_option( 'id' ) );

		// Non-critical options
		$this->assertFalse( External_Storage::is_critical_option( 'user_tokens' ) );
		$this->assertFalse( External_Storage::is_critical_option( 'random_option' ) );
	}

	/**
	 * Test is_critical_option with filter.
	 */
	public function test_is_critical_option_with_filter() {
		add_filter(
			'jetpack_external_storage_critical_options',
			function ( $options ) {
				$options[] = 'master_user';
				return $options;
			}
		);

		$this->assertTrue( External_Storage::is_critical_option( 'master_user' ) );
	}
}
