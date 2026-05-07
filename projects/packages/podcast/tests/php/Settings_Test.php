<?php
/**
 * Tests for the Podcast Settings class.
 *
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

	/**
	 * `register_settings()` should register every `podcasting_*` option in the
	 * canonical schema, and each registration must declare a REST schema so
	 * the SPA can reach it via `/wp/v2/settings`.
	 */
	public function test_register_settings_exposes_every_option_to_rest() {
		Settings::register_settings();

		$registered = get_registered_settings();

		$expected = array(
			'podcasting_category_id',
			'podcasting_image_id',
			'podcasting_title',
			'podcasting_talent_name',
			'podcasting_summary',
			'podcasting_copyright',
			'podcasting_category_1',
			'podcasting_category_2',
			'podcasting_category_3',
			'podcasting_email',
			'podcasting_image',
			'podcasting_explicit',
			'podcasting_show_urls',
			'podcasting_show_states',
		);

		foreach ( $expected as $name ) {
			$this->assertArrayHasKey( $name, $registered, "$name should be registered" );
			$this->assertNotEmpty( $registered[ $name ]['show_in_rest'], "$name should declare show_in_rest" );
		}
	}

	/**
	 * `sanitize_explicit` should pass through allowed values and fall back
	 * to `'no'` for anything else (including non-strings).
	 */
	public function test_sanitize_explicit_filters_to_allowed_set() {
		$this->assertSame( 'no', Settings::sanitize_explicit( 'no' ) );
		$this->assertSame( 'yes', Settings::sanitize_explicit( 'yes' ) );
		$this->assertSame( 'clean', Settings::sanitize_explicit( 'clean' ) );

		$this->assertSame( 'no', Settings::sanitize_explicit( 'maybe' ) );
		$this->assertSame( 'no', Settings::sanitize_explicit( '' ) );
		$this->assertSame( 'no', Settings::sanitize_explicit( null ) );
		$this->assertSame( 'no', Settings::sanitize_explicit( 1 ) );
		$this->assertSame( 'no', Settings::sanitize_explicit( array( 'yes' ) ) );
	}

	/**
	 * Show URLs sanitize as a *merge* against stored values, not a replace —
	 * a partial patch from the SPA must preserve other podcatchers' entries.
	 */
	public function test_sanitize_show_urls_merges_partial_patch_into_stored_value() {
		update_option(
			'podcasting_show_urls',
			array(
				'apple'   => 'https://podcasts.apple.com/us/podcast/example/id1',
				'spotify' => 'https://open.spotify.com/show/abc',
			)
		);

		$result = Settings::sanitize_show_urls(
			array(
				'pocketcasts' => 'https://pca.st/podcast/xyz',
			)
		);

		$this->assertSame( 'https://podcasts.apple.com/us/podcast/example/id1', $result['apple'] );
		$this->assertSame( 'https://open.spotify.com/show/abc', $result['spotify'] );
		$this->assertSame( 'https://pca.st/podcast/xyz', $result['pocketcasts'] );
	}

	/**
	 * Empty string for a known podcatcher key should remove that entry.
	 */
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

	/**
	 * URLs whose hostname isn't in the per-podcatcher allowlist must be
	 * silently dropped — the SPA validates the same allowlist client-side, so
	 * a stray URL means a non-modal client.
	 */
	public function test_sanitize_show_urls_drops_url_with_wrong_host() {
		$result = Settings::sanitize_show_urls(
			array(
				'apple' => 'https://example.com/not-apple',
			)
		);

		$this->assertArrayNotHasKey( 'apple', $result );
	}

	/**
	 * Hostnames are normalized: a leading `www.` and uppercase letters in
	 * the host should not defeat the allowlist match.
	 */
	public function test_sanitize_show_urls_normalizes_host_case_and_www() {
		$result = Settings::sanitize_show_urls(
			array(
				'pocketcasts' => 'https://www.PocketCasts.com/podcast/xyz',
			)
		);

		$this->assertArrayHasKey( 'pocketcasts', $result );
	}

	/**
	 * Non-https schemes are stripped by `esc_url_raw( $url, [ 'https' ] )` and
	 * the resulting empty/invalid URL is dropped.
	 */
	public function test_sanitize_show_urls_rejects_http_scheme() {
		$result = Settings::sanitize_show_urls(
			array(
				'apple' => 'http://podcasts.apple.com/us/podcast/example/id1',
			)
		);

		$this->assertArrayNotHasKey( 'apple', $result );
	}

	/**
	 * Unknown podcatcher keys must be filtered out — `array_intersect_key`
	 * with `SHOW_URL_HOSTS` is the gate.
	 */
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

	/**
	 * URLs longer than the configured max are dropped.
	 */
	public function test_sanitize_show_urls_rejects_oversized_url() {
		$long = 'https://podcasts.apple.com/us/podcast/' . str_repeat( 'a', Settings::SHOW_URL_MAX_LENGTH );

		$result = Settings::sanitize_show_urls( array( 'apple' => $long ) );

		$this->assertArrayNotHasKey( 'apple', $result );
	}

	/**
	 * Non-array input must not blow up — return the current stored value
	 * untouched (matching legacy WPCOM behavior).
	 */
	public function test_sanitize_show_urls_falls_back_when_input_is_not_array() {
		update_option(
			'podcasting_show_urls',
			array( 'apple' => 'https://podcasts.apple.com/us/podcast/example/id1' )
		);

		$result = Settings::sanitize_show_urls( 'not-an-array' );

		$this->assertSame( 'https://podcasts.apple.com/us/podcast/example/id1', $result['apple'] );
	}

	/**
	 * `sanitize_show_states` accepts allowed states, drops unknown values,
	 * removes entries on empty string, and merges into the stored value.
	 */
	public function test_sanitize_show_states_filters_to_allowed_set_and_merges() {
		update_option(
			'podcasting_show_states',
			array( 'apple' => 'active' )
		);

		$result = Settings::sanitize_show_states(
			array(
				'pocketcasts' => 'pending',
				'spotify'     => 'banana',  // Invalid — drop.
				'apple'       => '',        // Empty — clear.
			)
		);

		$this->assertSame( 'pending', $result['pocketcasts'] );
		$this->assertArrayNotHasKey( 'spotify', $result );
		$this->assertArrayNotHasKey( 'apple', $result );
	}
}
