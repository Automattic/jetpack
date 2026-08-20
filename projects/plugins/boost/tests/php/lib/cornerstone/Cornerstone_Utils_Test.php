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

	/**
	 * BOOST-604: a homepage entry in the custom list ("/" or "") hashes to the same provider key as
	 * the predefined home_url() entry (`cornerstone_d41d8cd9`). Without de-duplication the merged
	 * list carries two pages with the same key; set_pending_pages() only marks the first, leaving the
	 * duplicate statusless and failing the lcp_state schema on write. get_list() must collapse them.
	 */
	public function test_get_list_dedupes_homepage_from_custom_list() {
		// No trailing-slash permalink structure, so URLs are left untouched.
		Functions\when( 'get_option' )->justReturn( '' );
		// Custom list contains the homepage as the relative "/" form plus a distinct page.
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( array( '/', '/about' ) );

		$list = Cornerstone_Utils::get_list();
		$keys = array_map( array( Cornerstone_Utils::class, 'get_provider_key' ), $list );

		// No provider-key duplicates survive.
		$this->assertSame( array_values( array_unique( $keys ) ), $keys, 'get_list() must not contain provider-key duplicates.' );

		// The homepage key appears exactly once even though it is both predefined and custom.
		$home_key = Cornerstone_Utils::get_provider_key( 'https://example.com' );
		$this->assertCount( 1, array_keys( $keys, $home_key, true ) );

		// The predefined home_url() entry wins; the duplicate custom "/" is dropped.
		$this->assertContains( 'https://example.com', $list );
		$this->assertNotContains( '/', $list );

		// The unrelated custom page survives.
		$this->assertContains( '/about', $list );
	}
}
