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

	/**
	 * Without a proxy signal and without a filter override, the gate stays
	 * closed so the legacy podcasting stack keeps running.
	 */
	public function test_is_enabled_defaults_to_false_when_not_proxied() {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		$this->assertFalse( Podcast::is_enabled() );
	}

	/**
	 * A8C-proxied requests flip the default to true so Automatticians dogfood
	 * the new package without needing a separate filter hook.
	 */
	public function test_is_enabled_defaults_to_true_for_proxied_requests() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		try {
			$this->assertTrue( Podcast::is_enabled() );
		} finally {
			unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		}
	}

	/**
	 * The `jetpack_podcast_untangle` filter still wins — a hook returning
	 * false suppresses the package even on a proxied request.
	 */
	public function test_is_enabled_filter_overrides_proxy_default() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		add_filter( 'jetpack_podcast_untangle', '__return_false' );
		try {
			$this->assertFalse( Podcast::is_enabled() );
		} finally {
			remove_filter( 'jetpack_podcast_untangle', '__return_false' );
			unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		}
	}
}
