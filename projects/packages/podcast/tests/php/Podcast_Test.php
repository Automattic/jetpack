<?php
/**
 * Tests for the Podcast loader class.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast
 */
#[CoversClass( Podcast::class )]
class Podcast_Test extends BaseTestCase {

	/**
	 * `init()` is a no-op when the `jetpack_podcast_untangle` filter is off
	 * (the default). Running it should not raise or leave any side effects.
	 */
	public function test_init_is_a_noop_when_filter_is_off() {
		Podcast::init();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * `PACKAGE_VERSION` is exposed for the changelogger version-constants
	 * mapping declared in `composer.json`.
	 */
	public function test_package_version_constant_is_defined() {
		$this->assertNotEmpty( Podcast::PACKAGE_VERSION );
	}
}
