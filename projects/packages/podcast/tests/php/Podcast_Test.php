<?php
/**
 * Tests for the Podcast loader class.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Podcast\Podcast;
use Automattic\Jetpack\Podcast\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast
 */
#[CoversClass( Podcast::class )]
class Podcast_Test extends BaseTestCase {
	public function tearDown(): void {
		$this->reset_podcast_init_state();
		$this->reset_settings_registration_state();
		Constants::clear_single_constant( 'IS_WPCOM' );
		remove_filter( 'jetpack_podcast_untangle', '__return_false' );
		remove_filter( 'jetpack_sync_options_whitelist', array( Settings::class, 'filter_sync_options_whitelist' ) );

		parent::tearDown();
	}

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

	public function test_init_registers_sync_whitelist_when_untangle_is_disabled() {
		$this->reset_podcast_init_state();
		$this->reset_settings_registration_state();
		remove_filter( 'jetpack_sync_options_whitelist', array( Settings::class, 'filter_sync_options_whitelist' ) );

		Constants::set_constant( 'IS_WPCOM', true );
		add_filter( 'jetpack_podcast_untangle', '__return_false' );

		Podcast::init();

		$whitelist = apply_filters( 'jetpack_sync_options_whitelist', array() );
		foreach ( Settings::OPTION_NAMES as $name ) {
			$this->assertContains( $name, $whitelist );
		}
	}

	private function reset_podcast_init_state() {
		$property = new \ReflectionProperty( Podcast::class, 'initialized' );
		$property->setAccessible( true );
		$property->setValue( null, false );
	}

	private function reset_settings_registration_state() {
		$registered = new \ReflectionProperty( Settings::class, 'registered' );
		$registered->setAccessible( true );
		$registered->setValue( null, false );

		$sync_whitelist_registered = new \ReflectionProperty( Settings::class, 'sync_whitelist_registered' );
		$sync_whitelist_registered->setAccessible( true );
		$sync_whitelist_registered->setValue( null, false );
	}
}
