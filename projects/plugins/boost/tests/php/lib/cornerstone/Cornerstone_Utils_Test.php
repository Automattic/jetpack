<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Cornerstone;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Cornerstone_Utils_Test extends TestCase {

	public function setUp(): void {
		parent::setUp();
		\Brain\Monkey\setUp();

		Functions\when( 'home_url' )->justReturn( 'https://example.com' );
		// untrailingslashit() strips trailing slashes/backslashes; reproduce that for the key path.
		Functions\when( 'untrailingslashit' )->alias(
			static function ( $string ) {
				return rtrim( (string) $string, '/\\' );
			}
		);
	}

	public function tearDown(): void {
		Mockery::close();
		\Brain\Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * The `url` sent to the cloud analyzer must be forwarded verbatim, preserving the
	 * trailing slash. This is the whole point of HOG-562: the cloud fetches this exact URL,
	 * and stripping the slash caused edge/WAF 301s and 403s that broke analysis.
	 */
	public function test_prepare_provider_data_preserves_trailing_slash_on_url() {
		$data = Cornerstone_Utils::prepare_provider_data( 'https://example.com/about/' );

		$this->assertSame( 'https://example.com/about/', $data['url'] );
	}

	/**
	 * The `key` must stay slash-agnostic so storage and retrieval still correlate regardless of
	 * the URL form. A regression that re-symmetrized `url` and `key` (or stopped stripping the
	 * key) would surface here.
	 */
	public function test_prepare_provider_data_key_is_slash_agnostic() {
		$with_slash    = Cornerstone_Utils::prepare_provider_data( 'https://example.com/about/' );
		$without_slash = Cornerstone_Utils::prepare_provider_data( 'https://example.com/about' );

		$this->assertSame(
			$without_slash['key'],
			$with_slash['key'],
			'The provider key must be identical for the trailing-slash and no-slash forms of the same page.'
		);

		// The key is derived from the sanitized URL, so it never carries the trailing slash itself.
		$this->assertStringEndsNotWith( '/', $with_slash['key'] );
	}
}
