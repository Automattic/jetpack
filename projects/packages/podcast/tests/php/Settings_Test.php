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

	public function test_get_all_returns_every_option_key_with_padded_maps() {
		update_option( 'podcasting_title', 'My Show' );
		update_option( 'podcasting_show_urls', array( 'apple' => 'https://podcasts.apple.com/show/1' ) );

		$all = Settings::get_all();

		foreach ( Settings::OPTION_NAMES as $name ) {
			$this->assertArrayHasKey( $name, $all, "$name should be present in get_all()" );
		}

		$this->assertSame( 'My Show', $all['podcasting_title'] );
		$this->assertIsBool( $all['podcasting_explicit'] );

		$expected_keys = array_keys( Settings::SHOW_URL_HOSTS );
		$this->assertSame( $expected_keys, array_keys( $all['podcasting_show_urls'] ) );
		$this->assertSame( $expected_keys, array_keys( $all['podcasting_show_states'] ) );
		$this->assertSame( 'https://podcasts.apple.com/show/1', $all['podcasting_show_urls']['apple'] );
		$this->assertSame( '', $all['podcasting_show_urls']['spotify'] );

		delete_option( 'podcasting_title' );
		delete_option( 'podcasting_show_urls' );
	}

	public function test_rest_schema_properties_types_every_option() {
		$schema = Settings::rest_schema_properties();

		foreach ( Settings::OPTION_NAMES as $name ) {
			$this->assertArrayHasKey( $name, $schema, "$name should have an update arg schema" );
			$this->assertArrayHasKey( 'type', $schema[ $name ], "$name schema should declare a type" );
		}

		$this->assertSame( 'integer', $schema['podcasting_category_id']['type'] );
		$this->assertSame( 'integer', $schema['podcasting_image_id']['type'] );
		$this->assertSame( 'object', $schema['podcasting_show_urls']['type'] );
		$this->assertSame( 'object', $schema['podcasting_show_states']['type'] );
		$this->assertSame( array( 'boolean', 'string' ), $schema['podcasting_explicit']['type'] );
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

	public function test_sanitize_show_states_refuses_active_to_pending_downgrade() {
		update_option( 'podcasting_show_states', array( 'apple' => 'active' ) );

		$result = Settings::sanitize_show_states( array( 'apple' => 'pending' ) );

		$this->assertSame( 'active', $result['apple'] );
	}

	public function test_raw_show_image_url_prefers_image_attachment_over_raw_option() {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Show Cover',
			)
		);
		update_post_meta( $attachment_id, '_wp_attached_file', '2026/06/cover.jpg' );

		update_option( 'podcasting_image_id', $attachment_id );
		update_option( 'podcasting_image', 'https://example.com/raw-fallback.png' );

		$url = Settings::raw_show_image_url();

		$this->assertStringEndsWith( '2026/06/cover.jpg', $url );

		delete_option( 'podcasting_image_id' );
		delete_option( 'podcasting_image' );
	}

	/**
	 * The `wp_attachment_is_image` gate: an ID pointing at a non-image
	 * attachment (or nothing at all) must fall back to the raw option.
	 */
	public function test_raw_show_image_url_falls_back_to_raw_option_for_non_image_id() {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'audio/mpeg',
				'post_title'     => 'Episode Audio',
			)
		);
		update_post_meta( $attachment_id, '_wp_attached_file', '2026/06/episode.mp3' );

		update_option( 'podcasting_image_id', $attachment_id );
		update_option( 'podcasting_image', 'https://example.com/cover.png' );

		$this->assertSame( 'https://example.com/cover.png', Settings::raw_show_image_url() );

		delete_option( 'podcasting_image_id' );
		delete_option( 'podcasting_image' );
	}

	public function test_raw_show_image_url_returns_empty_string_when_unconfigured() {
		delete_option( 'podcasting_image_id' );
		delete_option( 'podcasting_image' );

		$this->assertSame( '', Settings::raw_show_image_url() );
	}
}
