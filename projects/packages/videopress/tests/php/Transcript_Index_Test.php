<?php
/**
 * Tests for the VideoPress transcript index.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Caption_Tracks;
use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Transcript_Index;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Test suite for Transcript_Index.
 */
class Transcript_Index_Test extends BaseTestCase {

	/**
	 * VTT bodies served for track URLs, or WP_Error to fail.
	 *
	 * @var array<string, string|WP_Error>
	 */
	private $served = array();

	/**
	 * Caption track posts the faked track query answers with.
	 *
	 * @var int[]
	 */
	private $tracks = array();

	/**
	 * Enable the index for English with no remote tracks by default.
	 */
	protected function set_up() {
		Caption_Tracks::register_post_type();
		kses_remove_filters();
		// WorDBless has no SQL, so the caption track query is answered from the posts made here.
		add_filter(
			'posts_pre_query',
			function ( $posts, $query ) {
				if ( Caption_Tracks::POST_TYPE !== $query->get( 'post_type' ) ) {
					return $posts;
				}
				return array_values(
					array_filter(
						array_map( 'get_post', $this->tracks ),
						function ( $post ) use ( $query ) {
							return 'publish' === $post->post_status && get_post_meta( $post->ID, Caption_Tracks::META_GUID, true ) === $query->get( 'meta_value' );
						}
					)
				);
			},
			10,
			2
		);
		add_filter( 'videopress_transcript_index_enabled', '__return_true' );
		add_filter(
			'videopress_transcript_languages',
			function () {
				return array( 'en' );
			}
		);
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $url ) {
				if ( ! isset( $this->served[ $url ] ) ) {
					return $pre;
				}
				return is_wp_error( $this->served[ $url ] ) ? $this->served[ $url ] : array(
					'response' => array( 'code' => 200 ),
					'body'     => $this->served[ $url ],
				);
			},
			10,
			3
		);
	}

	/**
	 * Remove the filters.
	 */
	protected function tear_down() {
		remove_all_filters( 'videopress_transcript_index_enabled' );
		remove_all_filters( 'videopress_transcript_languages' );
		remove_all_filters( 'videopress_transcript_video_details' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'posts_pre_query' );
	}

	/**
	 * A VideoPress attachment.
	 *
	 * @return int Attachment ID.
	 */
	private function video() {
		$id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => Channel::MIME_TYPE,
			)
		);
		update_post_meta( $id, 'videopress_guid', 'abcd1234' );
		return $id;
	}

	/**
	 * Serve VideoPress tracks for the video.
	 *
	 * @param array $subtitles Track key => VTT body or WP_Error.
	 */
	private function remote_tracks( array $subtitles ) {
		$tracks = array();
		foreach ( $subtitles as $key => $body ) {
			$tracks[ $key ] = array( 'src' => "video_{$key}.vtt" );
			$this->served[ 'https://videos.files.wordpress.com/abcd1234/' . rawurlencode( "video_{$key}.vtt" ) ] = $body;
		}
		add_filter(
			'videopress_transcript_video_details',
			function () use ( $tracks ) {
				return (object) array(
					'file_url_base' => array( 'https' => 'https://videos.files.wordpress.com/abcd1234/' ),
					'tracks'        => array( 'subtitles' => $tracks ),
				);
			}
		);
	}

	/**
	 * A published edited caption track.
	 *
	 * @param string $language Language tag.
	 * @param string $text     The one cue's text.
	 * @return int Track post ID.
	 */
	private function edited_track( $language, $text ) {
		$id = wp_insert_post(
			array(
				'post_type'    => Caption_Tracks::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => serialize_blocks(
					array(
						array(
							'blockName'    => Caption_Tracks::CUE_BLOCK_NAME,
							'attrs'        => array(
								'startTime' => '00:01:02.500',
								'endTime'   => '00:01:04.000',
								'text'      => $text,
							),
							'innerBlocks'  => array(),
							'innerHTML'    => '',
							'innerContent' => array(),
						),
					)
				),
			)
		);
		update_post_meta( $id, Caption_Tracks::META_GUID, 'abcd1234' );
		update_post_meta( $id, Caption_Tracks::META_SRC_LANG, $language );
		update_post_meta( $id, Caption_Tracks::META_KIND, 'subtitles' );
		$this->tracks[] = $id;
		return $id;
	}

	/**
	 * WebVTT inputs and the cues they hold.
	 *
	 * @return array[]
	 */
	public static function vtt_documents() {
		return array(
			'header, note, style and cue ids'    => array(
				"\xEF\xBB\xBFWEBVTT - title\n\nNOTE a comment\n\nSTYLE\n::cue { color: red }\n\n1\n00:00:01.000 --> 00:00:02.500 align:start\nHello\n\nintro\n00:02.500 --> 00:04.000\nworld",
				array(
					array(
						'start' => 1000,
						'end'   => 2500,
						'text'  => 'Hello',
					),
					array(
						'start' => 2500,
						'end'   => 4000,
						'text'  => 'world',
					),
				),
			),
			'tags, entities and line breaks'     => array(
				"WEBVTT\r\n\r\n01:00:00.000 --> 01:00:01.000\r\n<v Ana>Search &amp; <c.loud>find</c>\r\n<00:00:00.500>it",
				array(
					array(
						'start' => 3600000,
						'end'   => 3601000,
						'text'  => 'Search & find it',
					),
				),
			),
			'empty cues and garbage are skipped' => array( "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n\nnot a cue\n", array() ),
		);
	}

	/**
	 * WebVTT parsing.
	 *
	 * @param string  $vtt  Document.
	 * @param array[] $cues Expected cues.
	 * @dataProvider vtt_documents
	 */
	#[DataProvider( 'vtt_documents' )]
	public function test_parse_vtt( $vtt, $cues ) {
		$this->assertSame( $cues, Transcript_Index::parse_vtt( $vtt ) );
	}

	public function test_prefers_edited_then_uploaded_then_generated_track() {
		$this->remote_tracks(
			array(
				'auto_en' => "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\ngenerated words",
				'en'      => "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nuploaded words",
			)
		);
		$source = Transcript_Index::select_source( 'abcd1234' );
		$this->assertIsArray( $source );
		$this->assertSame( 'subtitles:en', $source['key'] );

		$this->edited_track( 'en-US', 'corrected words' );
		$source = Transcript_Index::select_source( 'abcd1234' );
		$this->assertIsArray( $source );
		$this->assertSame( 'edited', $source['source'] );
		$this->assertSame( 62500, $source['cues'][0]['start'] );
	}

	public function test_other_languages_are_not_an_implicit_fallback() {
		$this->remote_tracks( array( 'auto_fr' => "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nbonjour" ) );
		$id = $this->video();
		update_post_meta( $id, Transcript_Index::META_TEXT, 'stale text' );

		$this->assertNull( Transcript_Index::select_source( 'abcd1234' ) );
		$this->assertSame( 'none', Transcript_Index::index_attachment( $id )['status'] );
		$this->assertSame( '', get_post_meta( $id, Transcript_Index::META_TEXT, true ), 'A removed track does not stay searchable.' );
	}

	public function test_indexes_and_keeps_text_when_a_refetch_fails() {
		$this->remote_tracks( array( 'auto_en' => "WEBVTT\n\n00:00:03.000 --> 00:00:05.000\nonly spoken here" ) );
		$id    = $this->video();
		$state = Transcript_Index::index_attachment( $id );

		$this->assertSame( 'indexed', $state['status'] );
		$this->assertSame( 'generated', $state['source'] );
		$this->assertSame( 'only spoken here', get_post_meta( $id, Transcript_Index::META_TEXT, true ) );
		$this->assertSame( 3000, Transcript_Index::cues( $id )[0]['start'] );

		$this->served = array_fill_keys( array_keys( $this->served ), new WP_Error( 'http_request_failed', 'timeout' ) );
		$this->assertSame( 'http_request_failed', Transcript_Index::index_attachment( $id )['error'] );
		$this->assertSame( 'only spoken here', get_post_meta( $id, Transcript_Index::META_TEXT, true ) );
	}
}
