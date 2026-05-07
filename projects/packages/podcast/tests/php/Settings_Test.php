<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends BaseTestCase {

	public function test_register_settings_exposes_every_option_to_rest() {
		Settings::register_settings();

		$registered = get_registered_settings();

		foreach ( Settings::OPTION_NAMES as $name ) {
			$this->assertArrayHasKey( $name, $registered, "$name should be registered" );
			$this->assertNotEmpty( $registered[ $name ]['show_in_rest'], "$name should declare show_in_rest" );
		}
	}

	public function test_register_adds_options_to_jetpack_sync_whitelist() {
		Settings::register();

		$whitelist = apply_filters( 'jetpack_sync_options_whitelist', array() );

		foreach ( Settings::OPTION_NAMES as $name ) {
			$this->assertContains( $name, $whitelist );
		}
	}

	/**
	 * Catches drift between `OPTION_NAMES` (which drives sync) and the set of
	 * options actually wired up in `register_settings()`.
	 */
	public function test_option_names_constant_matches_registered_settings() {
		Settings::register_settings();

		$registered = array_values(
			array_filter(
				array_keys( get_registered_settings() ),
				static function ( $name ) {
					return 0 === strpos( $name, 'podcasting_' );
				}
			)
		);

		$expected = Settings::OPTION_NAMES;
		sort( $expected );
		sort( $registered );

		$this->assertSame( $expected, $registered );
	}

	public function test_sanitize_explicit_normalizes_to_boolean() {
		$this->assertTrue( Settings::sanitize_explicit( true ) );
		$this->assertTrue( Settings::sanitize_explicit( 'yes' ) );
		$this->assertTrue( Settings::sanitize_explicit( 'YES' ) );
		$this->assertTrue( Settings::sanitize_explicit( 'true' ) );
		$this->assertTrue( Settings::sanitize_explicit( '1' ) );
		$this->assertTrue( Settings::sanitize_explicit( 1 ) );

		$this->assertFalse( Settings::sanitize_explicit( false ) );
		$this->assertFalse( Settings::sanitize_explicit( 'no' ) );
		$this->assertFalse( Settings::sanitize_explicit( 'clean' ) );
		$this->assertFalse( Settings::sanitize_explicit( 'maybe' ) );
		$this->assertFalse( Settings::sanitize_explicit( '' ) );
		$this->assertFalse( Settings::sanitize_explicit( null ) );
	}

	public function test_sanitize_show_urls_merges_partial_patch_into_stored_value() {
		update_option(
			'podcasting_show_urls',
			array(
				'apple'   => 'https://podcasts.apple.com/us/podcast/example/id1',
				'spotify' => 'https://open.spotify.com/show/abc',
			)
		);

		$result = Settings::sanitize_show_urls( array( 'pocketcasts' => 'https://pca.st/podcast/xyz' ) );

		$this->assertSame( 'https://podcasts.apple.com/us/podcast/example/id1', $result['apple'] );
		$this->assertSame( 'https://open.spotify.com/show/abc', $result['spotify'] );
		$this->assertSame( 'https://pca.st/podcast/xyz', $result['pocketcasts'] );
	}

	public function test_sanitize_show_urls_empty_string_removes_entry() {
		update_option(
			'podcasting_show_urls',
			array(
				'apple'   => 'https://podcasts.apple.com/us/podcast/example/id1',
				'spotify' => 'https://open.spotify.com/show/abc',
			)
		);

		$result = Settings::sanitize_show_urls( array( 'apple' => '' ) );

		$this->assertArrayNotHasKey( 'apple', $result );
		$this->assertSame( 'https://open.spotify.com/show/abc', $result['spotify'] );
	}

	public function test_sanitize_show_urls_drops_url_with_wrong_host() {
		$result = Settings::sanitize_show_urls( array( 'apple' => 'https://example.com/not-apple' ) );

		$this->assertArrayNotHasKey( 'apple', $result );
	}

	public function test_sanitize_show_urls_normalizes_host_case_and_www() {
		$result = Settings::sanitize_show_urls( array( 'pocketcasts' => 'https://www.PocketCasts.com/podcast/xyz' ) );

		$this->assertArrayHasKey( 'pocketcasts', $result );
	}

	public function test_sanitize_show_urls_rejects_http_scheme() {
		$result = Settings::sanitize_show_urls( array( 'apple' => 'http://podcasts.apple.com/us/podcast/example/id1' ) );

		$this->assertArrayNotHasKey( 'apple', $result );
	}

	public function test_sanitize_show_urls_drops_unknown_podcatcher_keys() {
		$result = Settings::sanitize_show_urls(
			array(
				'mystery_directory' => 'https://example.com/feed',
				'pocketcasts'       => 'https://pca.st/podcast/xyz',
			)
		);

		$this->assertArrayNotHasKey( 'mystery_directory', $result );
		$this->assertSame( 'https://pca.st/podcast/xyz', $result['pocketcasts'] );
	}

	public function test_sanitize_show_urls_rejects_oversized_url() {
		$long = 'https://podcasts.apple.com/us/podcast/' . str_repeat( 'a', Settings::SHOW_URL_MAX_LENGTH );

		$result = Settings::sanitize_show_urls( array( 'apple' => $long ) );

		$this->assertArrayNotHasKey( 'apple', $result );
	}

	public function test_sanitize_show_states_filters_to_allowed_set_and_merges() {
		update_option( 'podcasting_show_states', array( 'apple' => 'active' ) );

		$result = Settings::sanitize_show_states(
			array(
				'pocketcasts' => 'pending',
				'spotify'     => 'banana',
				'apple'       => '',
			)
		);

		$this->assertSame( 'pending', $result['pocketcasts'] );
		$this->assertArrayNotHasKey( 'spotify', $result );
		$this->assertArrayNotHasKey( 'apple', $result );
	}
}
