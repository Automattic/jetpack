<?php
/**
 * Tests for the Sharing_Likes class.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Tests;

use Automattic\Jetpack\Sharing_Likes;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Sharing_Likes.
 *
 * @covers \Automattic\Jetpack\Sharing_Likes
 */
#[CoversClass( Sharing_Likes::class )]
class Sharing_Likes_Test extends BaseTestCase {
	/**
	 * The package version constant holds a semver-style version string.
	 */
	public function test_package_version_is_a_version_string() {
		$this->assertMatchesRegularExpression( '/^\d+\.\d+\.\d+/', Sharing_Likes::PACKAGE_VERSION );
	}
}
