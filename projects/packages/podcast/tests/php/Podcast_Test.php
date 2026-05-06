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
	 * `init()` should run cleanly on every host. In test environments (and on
	 * any non-Simple/non-Atomic site in production), the host gate
	 * short-circuits before the filter is evaluated, so this exercises the
	 * most common no-op path.
	 */
	public function test_init_returns_cleanly_on_non_wpcom_host() {
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
