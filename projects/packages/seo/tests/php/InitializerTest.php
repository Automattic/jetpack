<?php
/**
 * Tests for the Jetpack SEO Initializer.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Initializer
 */
#[CoversClass( Initializer::class )]
class InitializerTest extends TestCase {

	/**
	 * The Initializer class exists and exposes the expected menu slug.
	 */
	public function test_menu_slug_constant_is_defined() {
		$this->assertSame( 'jetpack-seo', Initializer::MENU_SLUG );
	}

	/**
	 * The package version constant is defined and non-empty.
	 */
	public function test_package_version_constant_is_defined() {
		$this->assertNotEmpty( Initializer::PACKAGE_VERSION );
	}
}
