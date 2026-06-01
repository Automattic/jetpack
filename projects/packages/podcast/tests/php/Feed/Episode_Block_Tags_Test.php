<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Episode_Block_Tags;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Post;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\Episode_Block_Tags
 */
#[CoversClass( Episode_Block_Tags::class )]
class Episode_Block_Tags_Test extends BaseTestCase {

	protected function tearDown(): void {
		delete_option( 'podcasting_explicit' );
		parent::tearDown();
	}

	private function render_from_attrs( array $attrs ): string {
		ob_start();
		Episode_Block_Tags::render_from_attrs( $attrs );
		return (string) ob_get_clean();
	}

	private function render_post( string $content ): string {
		$post = new WP_Post(
			(object) array(
				'ID'           => 1,
				'post_content' => $content,
			)
		);
		ob_start();
		Episode_Block_Tags::render( $post );
		return (string) ob_get_clean();
	}

	public function test_render_emits_nothing_for_post_without_block() {
		$this->assertSame( '', $this->render_post( '<p>Just a plain post, no blocks.</p>' ) );
	}

	public function test_render_first_block_wins_when_multiple_present() {
		$xml = $this->render_post(
			'<!-- wp:jetpack/podcast-episode {"episodeNumber":1} /-->'
			. '<!-- wp:jetpack/podcast-episode {"episodeNumber":99} /-->'
		);

		$this->assertStringContainsString( '<itunes:episode>1</itunes:episode>', $xml );
		$this->assertStringNotContainsString( '<itunes:episode>99</itunes:episode>', $xml );
	}

	public function test_episode_number_emits_both_namespaces() {
		$xml = $this->render_from_attrs( array( 'episodeNumber' => 12 ) );

		$this->assertStringContainsString( '<itunes:episode>12</itunes:episode>', $xml );
		$this->assertStringContainsString( '<podcast:episode>12</podcast:episode>', $xml );
	}

	public function test_episode_number_skips_zero_and_missing() {
		$this->assertSame( '', $this->render_from_attrs( array( 'episodeNumber' => 0 ) ) );
		$this->assertSame( '', $this->render_from_attrs( array() ) );
	}

	public function test_season_number_emits_both_namespaces() {
		$xml = $this->render_from_attrs( array( 'seasonNumber' => 4 ) );

		$this->assertStringContainsString( '<itunes:season>4</itunes:season>', $xml );
		$this->assertStringContainsString( '<podcast:season>4</podcast:season>', $xml );
	}

	public function test_episode_type_emits_only_trailer_and_bonus() {
		$this->assertSame( '', $this->render_from_attrs( array( 'episodeType' => 'full' ) ) );

		$this->assertStringContainsString(
			'<itunes:episodeType>trailer</itunes:episodeType>',
			$this->render_from_attrs( array( 'episodeType' => 'trailer' ) )
		);
		$this->assertStringContainsString(
			'<itunes:episodeType>bonus</itunes:episodeType>',
			$this->render_from_attrs( array( 'episodeType' => 'bonus' ) )
		);
	}

	public function test_explicit_override_only_emits_on_mismatch() {
		update_option( 'podcasting_explicit', false );

		// Channel says false, item says false → no tag.
		$this->assertSame( '', $this->render_from_attrs( array( 'explicit' => false ) ) );

		// Channel says false, item says true → emit "true".
		$this->assertStringContainsString(
			'<itunes:explicit>true</itunes:explicit>',
			$this->render_from_attrs( array( 'explicit' => true ) )
		);

		// Attr missing entirely → no tag.
		$this->assertSame( '', $this->render_from_attrs( array() ) );
	}

	public function test_transcript_emits_url_and_validated_type() {
		$xml = $this->render_from_attrs(
			array(
				'transcriptUrl'  => 'https://example.com/t.vtt',
				'transcriptType' => 'text/vtt',
			)
		);

		$this->assertStringContainsString( 'url="https://example.com/t.vtt"', $xml );
		$this->assertStringContainsString( 'type="text/vtt"', $xml );
		$this->assertStringContainsString( '<podcast:transcript', $xml );
	}

	public function test_transcript_skips_when_url_blank() {
		$this->assertSame( '', $this->render_from_attrs( array( 'transcriptUrl' => '   ' ) ) );
	}

	public function test_transcript_falls_back_to_vtt_for_unknown_type() {
		$xml = $this->render_from_attrs(
			array(
				'transcriptUrl'  => 'https://example.com/t.vtt',
				'transcriptType' => 'application/evil',
			)
		);

		$this->assertStringContainsString( 'type="text/vtt"', $xml );
	}

	public function test_location_emits_name_only() {
		$xml = $this->render_from_attrs( array( 'locationName' => 'Lagos, Nigeria' ) );

		$this->assertStringContainsString( '<podcast:location>Lagos, Nigeria</podcast:location>', $xml );
	}

	public function test_location_skips_when_blank() {
		$this->assertSame( '', $this->render_from_attrs( array( 'locationName' => '' ) ) );
	}

	public function test_license_with_url() {
		$xml = $this->render_from_attrs(
			array(
				'license'    => 'CC BY 4.0',
				'licenseUrl' => 'https://creativecommons.org/licenses/by/4.0/',
			)
		);

		$this->assertStringContainsString( 'url="https://creativecommons.org/licenses/by/4.0/"', $xml );
		$this->assertStringContainsString( '>CC BY 4.0</podcast:license>', $xml );
	}

	public function test_license_name_only_when_url_blank() {
		$xml = $this->render_from_attrs( array( 'license' => 'All rights reserved' ) );

		$this->assertStringContainsString( '<podcast:license>All rights reserved</podcast:license>', $xml );
		$this->assertStringNotContainsString( 'url=', $xml );
	}

	public function test_license_skips_when_name_blank() {
		$this->assertSame(
			'',
			$this->render_from_attrs(
				array(
					'license'    => '',
					'licenseUrl' => 'https://example.com/license',
				)
			)
		);
	}

	public function test_people_one_tag_per_entry() {
		$xml = $this->render_from_attrs(
			array(
				'people' => array(
					array(
						'name' => 'Ada Lovelace',
						'role' => 'host',
						'href' => 'https://example.com/ada',
					),
					array(
						'name' => 'Grace Hopper',
						'role' => 'guest',
					),
					array( 'name' => '' ), // Skipped.
				),
			)
		);

		$this->assertSame( 2, substr_count( $xml, '<podcast:person' ) );
		$this->assertStringContainsString( 'role="host"', $xml );
		$this->assertStringContainsString( 'href="https://example.com/ada"', $xml );
		$this->assertStringContainsString( '>Ada Lovelace</podcast:person>', $xml );
		$this->assertStringContainsString( '>Grace Hopper</podcast:person>', $xml );
	}

	public function test_soundbites_emits_per_entry() {
		$xml = $this->render_from_attrs(
			array(
				'soundbites' => array(
					array(
						'startTime' => 30,
						'duration'  => 15,
						'title'     => 'Best moment',
					),
					array(
						'startTime' => 120,
						'duration'  => 5,
					),
					array( 'startTime' => 99 ), // Skipped — no duration.
				),
			)
		);

		$this->assertSame( 2, substr_count( $xml, '<podcast:soundbite' ) );
		$this->assertStringContainsString( 'startTime="30"', $xml );
		$this->assertStringContainsString( 'duration="15"', $xml );
		$this->assertStringContainsString( '>Best moment</podcast:soundbite>', $xml );
		// Title-less entry uses the self-closing form.
		$this->assertMatchesRegularExpression( '/startTime="120" duration="5" \/>/', $xml );
	}

	public function test_alternate_enclosures_wraps_sources() {
		$xml = $this->render_from_attrs(
			array(
				'alternateEnclosures' => array(
					array(
						'type'    => 'audio/aac',
						'length'  => 12345,
						'bitrate' => 96000,
						'sources' => array(
							array( 'uri' => 'https://cdn.example.com/ep.aac' ),
							array( 'uri' => 'https://mirror.example.com/ep.aac' ),
						),
					),
					array(
						// Flat shape (block's current schema): single URL, no sources array.
						'type'    => 'audio/mpeg',
						'bitrate' => 128000,
						'url'     => 'https://example.com/ep.mp3',
					),
				),
			)
		);

		$this->assertSame( 2, substr_count( $xml, '<podcast:alternateEnclosure' ) );
		$this->assertSame( 3, substr_count( $xml, '<podcast:source' ) );
		$this->assertStringContainsString( 'type="audio/aac"', $xml );
		$this->assertStringContainsString( 'length="12345"', $xml );
		$this->assertStringContainsString( 'bitrate="96000"', $xml );
		$this->assertStringContainsString( 'uri="https://cdn.example.com/ep.aac"', $xml );
		$this->assertStringContainsString( 'uri="https://example.com/ep.mp3"', $xml );
	}

	public function test_alternate_enclosures_skips_entries_without_type() {
		// `type` is required by the Podcasting 2.0 spec — skip rather than emit invalid markup.
		$this->assertSame(
			'',
			$this->render_from_attrs(
				array(
					'alternateEnclosures' => array(
						array(
							'bitrate' => 128000,
							'url'     => 'https://example.com/ep.mp3',
						),
					),
				)
			)
		);
	}

	public function test_alternate_enclosures_skips_entries_without_sources() {
		$this->assertSame(
			'',
			$this->render_from_attrs(
				array(
					'alternateEnclosures' => array(
						array( 'type' => 'audio/aac' ), // No url, no sources.
					),
				)
			)
		);
	}
}
