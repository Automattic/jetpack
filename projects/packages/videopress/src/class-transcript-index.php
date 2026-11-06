<?php
/**
 * VideoPress transcript index: a searchable projection of a video's selected caption track.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_Post;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Keeps, per video attachment, the plain text and cues of one caption track: the
 * site's published edited track for the channel language when there is one,
 * else the VideoPress track ( uploaded before generated ). Caption tracks stay
 * authoritative; the projection is rebuildable and never returned by the media API.
 */
class Transcript_Index {

	const META_STATE   = '_videopress_transcript';
	const META_TEXT    = '_videopress_transcript_text';
	const META_CUES    = '_videopress_transcript_cues';
	const META_CHECKED = '_videopress_transcript_checked';

	/**
	 * Bumped when the projection's shape or normalization changes, so reconciliation rebuilds it.
	 */
	const INDEX_VERSION = 1;

	const INDEX_HOOK     = 'videopress_transcript_index';
	const RECONCILE_HOOK = 'videopress_transcript_reconcile';

	const INDEX_DELAY      = 30;
	const RECONCILE_BATCH  = 25;
	const RECHECK_AFTER    = WEEK_IN_SECONDS;
	const MAX_TRACK_BYTES  = 2097152;
	const MAX_TEXT_BYTES   = 262144;
	const MAX_CUES         = 20000;
	const FETCH_TIMEOUT    = 10;
	const TRACK_KINDS      = array( 'subtitles', 'captions' );
	const STATUS_INDEXED   = 'indexed';
	const STATUS_EMPTY     = 'empty';
	const STATUS_NONE      = 'none';
	const STATUS_ERROR     = 'error';
	const SOURCE_EDITED    = 'edited';
	const SOURCE_UPLOADED  = 'uploaded';
	const SOURCE_GENERATED = 'generated';

	/**
	 * Whether init() already ran.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the index up. Safe to call from both the package initializer and the WordPress.com block bootstrap.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( self::INDEX_HOOK, array( __CLASS__, 'index_attachment' ) );
		add_action( self::RECONCILE_HOOK, array( __CLASS__, 'reconcile' ) );
		add_action( 'save_post_' . Caption_Tracks::POST_TYPE, array( __CLASS__, 'track_changed' ) );
		add_action( 'before_delete_post', array( __CLASS__, 'track_changed' ) );
		add_action( 'trashed_post', array( __CLASS__, 'track_changed' ) );
		add_action( 'add_attachment', array( __CLASS__, 'schedule' ) );
		add_action( 'added_post_meta', array( __CLASS__, 'attachment_meta_changed' ), 10, 3 );
		add_action( 'updated_post_meta', array( __CLASS__, 'attachment_meta_changed' ), 10, 3 );
		add_action( 'init', array( __CLASS__, 'schedule_reconciliation' ), 20 );
	}

	/**
	 * Whether transcript indexing is enabled for this site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filters whether VideoPress keeps a searchable transcript of each video.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Defaults to whether the channel feature is enabled.
		 */
		return (bool) apply_filters( 'videopress_transcript_index_enabled', Channel::is_enabled() );
	}

	/**
	 * The languages a transcript is taken from, in order of preference.
	 *
	 * @return string[] Lowercase primary language subtags, e.g. array( 'en' ).
	 */
	public static function languages() {
		$locale = function_exists( 'get_locale' ) ? (string) get_locale() : 'en';

		/**
		 * Filters the languages, in order, whose caption track becomes a video's transcript.
		 * A video with tracks in none of them has no transcript; there is no implicit fallback.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $languages Defaults to the site language.
		 */
		$languages = (array) apply_filters( 'videopress_transcript_languages', array( strtolower( (string) strtok( $locale, '_-' ) ) ) );
		return array_values( array_unique( array_filter( array_map( array( __CLASS__, 'primary_language' ), $languages ) ) ) );
	}

	/**
	 * The primary subtag of a language tag or VideoPress track key ( "auto_en", "pt-BR" ).
	 *
	 * @param mixed $tag Language tag.
	 * @return string
	 */
	public static function primary_language( $tag ) {
		$tag = strtolower( (string) $tag );
		$tag = preg_replace( '/^auto[_-]/', '', $tag );
		return preg_match( '/^([a-z]{2,3})(?:[_-]|$)/', $tag, $match ) ? $match[1] : '';
	}

	/**
	 * Queue an index run for a video attachment.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return void
	 */
	public static function schedule( $attachment_id ) {
		$attachment_id = (int) $attachment_id;
		if ( $attachment_id <= 0 || ! self::is_enabled() || wp_next_scheduled( self::INDEX_HOOK, array( $attachment_id ) ) ) {
			return;
		}
		wp_schedule_single_event( time() + self::INDEX_DELAY, self::INDEX_HOOK, array( $attachment_id ) );
	}

	/**
	 * A caption track was saved, trashed or deleted: reindex its video.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public static function track_changed( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post || Caption_Tracks::POST_TYPE !== $post->post_type ) {
			return;
		}
		$attachment_id = Channel::attachment_id( (string) get_post_meta( $post->ID, Caption_Tracks::META_GUID, true ) );
		if ( $attachment_id ) {
			self::schedule( $attachment_id );
		}
	}

	/**
	 * VideoPress synchronized a video's metadata ( new tracks arrive this way ): reindex it.
	 *
	 * @param int    $meta_id   Meta ID.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key  Meta key.
	 * @return void
	 */
	public static function attachment_meta_changed( $meta_id, $object_id, $meta_key ) {
		if ( '_wp_attachment_metadata' === $meta_key && '' !== Channel::guid( $object_id ) ) {
			self::schedule( $object_id );
		}
	}

	/**
	 * Run reconciliation daily, so a missed notification is recovered.
	 *
	 * @return void
	 */
	public static function schedule_reconciliation() {
		if ( self::is_enabled() && ! wp_next_scheduled( self::RECONCILE_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::RECONCILE_HOOK );
		}
	}

	/**
	 * Index a bounded batch of videos never checked, or not checked for a week.
	 *
	 * @param int $limit Most videos to index.
	 * @return int[] Indexed attachment IDs.
	 */
	public static function reconcile( $limit = self::RECONCILE_BATCH ) {
		if ( ! self::is_enabled() ) {
			return array();
		}
		$limit = max( 1, (int) $limit );
		$base  = array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'post_mime_type' => defined( 'IS_WPCOM' ) && IS_WPCOM ? 'video' : Channel::MIME_TYPE,
			'fields'         => 'ids',
			'no_found_rows'  => true,
		);
		$ids   = get_posts(
			$base + array(
				'posts_per_page' => $limit,
				'orderby'        => 'ID',
				'order'          => 'DESC',
				'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Bounded daily batch.
					array(
						'key'     => self::META_CHECKED,
						'compare' => 'NOT EXISTS',
					),
				),
			)
		);
		if ( count( $ids ) < $limit ) {
			$ids = array_merge(
				$ids,
				get_posts(
					$base + array(
						'posts_per_page' => $limit - count( $ids ),
						'meta_key'       => self::META_CHECKED, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Bounded daily batch.
						'orderby'        => 'meta_value_num',
						'order'          => 'ASC',
						'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Bounded daily batch.
							array(
								'key'     => self::META_CHECKED,
								'value'   => time() - self::RECHECK_AFTER,
								'compare' => '<',
								'type'    => 'NUMERIC',
							),
						),
					)
				)
			);
		}
		foreach ( $ids as $id ) {
			self::index_attachment( $id );
		}
		return array_map( 'intval', $ids );
	}

	/**
	 * Rebuild one video's projection from its currently selected track.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array The stored state.
	 */
	public static function index_attachment( $attachment_id ) {
		$attachment_id = (int) $attachment_id;
		$guid          = Channel::guid( $attachment_id );
		if ( '' === $guid || ! self::is_enabled() ) {
			return array();
		}
		update_post_meta( $attachment_id, self::META_CHECKED, time() );

		$source = self::select_source( $guid );
		if ( null === $source ) {
			return self::clear( $attachment_id );
		}

		$cues = $source['cues'] ?? null;
		if ( null === $cues ) {
			$body = self::fetch_track( $source['url'] );
			if ( is_wp_error( $body ) ) {
				// Keep the last good projection; a transient fetch failure must not erase search text.
				$state           = self::state( $attachment_id );
				$state['status'] = $state ? $state['status'] : self::STATUS_ERROR;
				$state['error']  = $body->get_error_code();
				update_post_meta( $attachment_id, self::META_STATE, $state );
				return $state;
			}
			$source['revision'] = sha1( $body );
			$cues               = self::parse_vtt( $body );
		}

		// A newer track may have been published while this one was fetched; that change has its own job.
		$current = self::select_source( $guid );
		if ( null === $current || $current['key'] !== $source['key'] || ( isset( $current['revision'] ) && isset( $source['cues'] ) && $current['revision'] !== $source['revision'] ) ) {
			return self::state( $attachment_id );
		}

		$previous = self::state( $attachment_id );
		if ( $previous && self::INDEX_VERSION === ( $previous['version'] ?? 0 ) && $source['revision'] === ( $previous['revision'] ?? '' ) && $source['key'] === ( $previous['track'] ?? '' ) ) {
			return $previous;
		}

		$text  = self::text( $cues );
		$state = array(
			'version'  => self::INDEX_VERSION,
			'status'   => '' === $text ? self::STATUS_EMPTY : self::STATUS_INDEXED,
			'source'   => $source['source'],
			'language' => $source['language'],
			'track'    => $source['key'],
			'revision' => $source['revision'],
			'cues'     => count( $cues ),
			'updated'  => time(),
		);
		update_post_meta( $attachment_id, self::META_CUES, $cues );
		update_post_meta( $attachment_id, self::META_TEXT, wp_slash( $text ) );
		update_post_meta( $attachment_id, self::META_STATE, $state );
		return $state;
	}

	/**
	 * Drop a video's projection when it no longer has a selected track.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array The stored state.
	 */
	private static function clear( $attachment_id ) {
		delete_post_meta( $attachment_id, self::META_CUES );
		delete_post_meta( $attachment_id, self::META_TEXT );
		$state = array(
			'version' => self::INDEX_VERSION,
			'status'  => self::STATUS_NONE,
			'updated' => time(),
		);
		update_post_meta( $attachment_id, self::META_STATE, $state );
		return $state;
	}

	/**
	 * A video's index state.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array Empty when never indexed.
	 */
	public static function state( $attachment_id ) {
		$state = get_post_meta( (int) $attachment_id, self::META_STATE, true );
		return is_array( $state ) ? $state : array();
	}

	/**
	 * A video's indexed cues.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array[] Cues with start and end ( ms ) and text.
	 */
	public static function cues( $attachment_id ) {
		$cues = get_post_meta( (int) $attachment_id, self::META_CUES, true );
		return is_array( $cues ) ? $cues : array();
	}

	/**
	 * The track a video's transcript comes from, by language preference: the site's published
	 * edited track first, then a VideoPress track uploaded by the owner, then a generated one.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return array|null Source with source, language, key, revision and cues ( edited ) or url ( VideoPress ).
	 */
	public static function select_source( $guid ) {
		$edited = self::edited_tracks( $guid );
		$remote = self::videopress_tracks( $guid );

		foreach ( self::languages() as $language ) {
			if ( isset( $edited[ $language ] ) ) {
				return $edited[ $language ];
			}
			foreach ( array( self::SOURCE_UPLOADED, self::SOURCE_GENERATED ) as $origin ) {
				if ( isset( $remote[ $origin ][ $language ] ) ) {
					return $remote[ $origin ][ $language ];
				}
			}
		}
		return null;
	}

	/**
	 * The site's published edited caption tracks of a video, keyed by language.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return array<string, array>
	 */
	private static function edited_tracks( $guid ) {
		$posts  = get_posts(
			array(
				'post_type'      => Caption_Tracks::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => 20,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'meta_key'       => Caption_Tracks::META_GUID, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- One video's tracks.
				'meta_value'     => $guid, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- One video's tracks.
			)
		);
		$tracks = array();
		foreach ( $posts as $post ) {
			$kind     = (string) get_post_meta( $post->ID, Caption_Tracks::META_KIND, true );
			$language = self::primary_language( get_post_meta( $post->ID, Caption_Tracks::META_SRC_LANG, true ) );
			if ( '' === $language || isset( $tracks[ $language ] ) || ( '' !== $kind && ! in_array( $kind, self::TRACK_KINDS, true ) ) ) {
				continue;
			}
			$tracks[ $language ] = array(
				'source'   => self::SOURCE_EDITED,
				'language' => $language,
				'key'      => 'edited:' . $post->ID,
				'revision' => sha1( $post->post_modified_gmt . '|' . $post->post_content ),
				'cues'     => self::cues_from_blocks( $post->post_content ),
			);
		}
		return $tracks;
	}

	/**
	 * A video's VideoPress subtitle and caption tracks, keyed by origin and language.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return array{uploaded?: array<string, array>, generated?: array<string, array>}
	 */
	private static function videopress_tracks( $guid ) {
		$details = function_exists( 'videopress_get_video_details' ) ? videopress_get_video_details( $guid ) : null;

		/**
		 * Filters the video details whose `tracks` and `file_url_base` the transcript index reads.
		 *
		 * @since $$next-version$$
		 *
		 * @param object|null $details VideoPress video details, or null when unavailable.
		 * @param string      $guid    VideoPress GUID.
		 */
		$details = apply_filters( 'videopress_transcript_video_details', is_object( $details ) && ! is_wp_error( $details ) ? $details : null, $guid );
		if ( ! is_object( $details ) || empty( $details->tracks ) ) {
			return array();
		}
		$details = json_decode( (string) wp_json_encode( $details, JSON_UNESCAPED_SLASHES ), true );
		$base    = (string) ( $details['file_url_base']['https'] ?? '' );

		$tracks = array();
		foreach ( self::TRACK_KINDS as $kind ) {
			foreach ( (array) ( $details['tracks'][ $kind ] ?? array() ) as $key => $track ) {
				$src      = is_array( $track ) ? (string) ( $track['src'] ?? '' ) : '';
				$language = self::primary_language( $key );
				$url      = preg_match( '#^https://#', $src ) ? $src : ( '' !== $base && '' !== $src ? $base . rawurlencode( $src ) : '' );
				$origin   = preg_match( '/^auto[_-]/i', (string) $key ) ? self::SOURCE_GENERATED : self::SOURCE_UPLOADED;
				if ( '' === $language || '' === $url || isset( $tracks[ $origin ][ $language ] ) ) {
					continue;
				}
				$tracks[ $origin ][ $language ] = array(
					'source'   => $origin,
					'language' => $language,
					'key'      => $kind . ':' . $key,
					'url'      => $url,
				);
			}
		}
		return $tracks;
	}

	/**
	 * Download a WebVTT track.
	 *
	 * @param string $url Track URL.
	 * @return string|WP_Error The body.
	 */
	private static function fetch_track( $url ) {
		$response = wp_safe_remote_get(
			$url,
			array(
				'timeout'             => self::FETCH_TIMEOUT,
				'limit_response_size' => self::MAX_TRACK_BYTES,
			)
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'videopress_transcript_fetch_failed', 'HTTP ' . (int) wp_remote_retrieve_response_code( $response ) );
		}
		return (string) wp_remote_retrieve_body( $response );
	}

	/**
	 * Parse a WebVTT document into cues.
	 *
	 * @param string $vtt WebVTT text.
	 * @return array[] Cues with start and end in milliseconds and plain text.
	 */
	public static function parse_vtt( $vtt ) {
		$vtt    = str_replace( array( "\r\n", "\r" ), "\n", preg_replace( '/^\xEF\xBB\xBF/', '', (string) $vtt ) );
		$blocks = preg_split( '/\n{2,}/', trim( $vtt ) );
		$cues   = array();
		foreach ( $blocks as $block ) {
			$lines = explode( "\n", trim( $block ) );
			// A cue identifier may precede the timing line; headers, NOTE, STYLE and REGION blocks have none.
			while ( $lines && false === strpos( $lines[0], '-->' ) ) {
				array_shift( $lines );
			}
			if ( ! $lines || ! preg_match( '/^\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s+-->\s+((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/', $lines[0], $timing ) ) {
				continue;
			}
			$text = self::clean_cue_text( implode( ' ', array_slice( $lines, 1 ) ) );
			if ( '' === $text ) {
				continue;
			}
			$cues[] = array(
				'start' => self::timestamp_ms( $timing[1] ),
				'end'   => self::timestamp_ms( $timing[2] ),
				'text'  => $text,
			);
			if ( count( $cues ) >= self::MAX_CUES ) {
				break;
			}
		}
		return $cues;
	}

	/**
	 * Cues from an edited track's caption-cue blocks.
	 *
	 * @param string $content Serialized blocks.
	 * @return array[]
	 */
	public static function cues_from_blocks( $content ) {
		$cues = array();
		foreach ( parse_blocks( (string) $content ) as $block ) {
			if ( Caption_Tracks::CUE_BLOCK_NAME !== ( $block['blockName'] ?? '' ) ) {
				continue;
			}
			$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array();
			$text  = self::clean_cue_text( (string) ( $attrs['text'] ?? '' ) );
			$start = self::timestamp_ms( (string) ( $attrs['startTime'] ?? '' ) );
			if ( '' === $text || null === $start ) {
				continue;
			}
			$end    = self::timestamp_ms( (string) ( $attrs['endTime'] ?? '' ) );
			$cues[] = array(
				'start' => $start,
				'end'   => null === $end ? $start : $end,
				'text'  => $text,
			);
			if ( count( $cues ) >= self::MAX_CUES ) {
				break;
			}
		}
		return $cues;
	}

	/**
	 * Milliseconds of a WebVTT timestamp ( "01:02:03.456" or "02:03.456" ).
	 *
	 * @param string $timestamp Timestamp.
	 * @return int|null
	 */
	public static function timestamp_ms( $timestamp ) {
		if ( ! preg_match( '/^\s*(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?\s*$/', (string) $timestamp, $m ) ) {
			return null;
		}
		return ( ( (int) $m[1] * 3600 + (int) $m[2] * 60 + (int) $m[3] ) * 1000 ) + (int) str_pad( $m[4] ?? '0', 3, '0' );
	}

	/**
	 * Plain cue text: no voice or styling tags, entities decoded, whitespace collapsed.
	 *
	 * @param string $text Cue payload.
	 * @return string
	 */
	private static function clean_cue_text( $text ) {
		$text = preg_replace( '/<[^>]*>/', ' ', (string) $text );
		$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		return trim( preg_replace( '/\s+/u', ' ', $text ) );
	}

	/**
	 * The searchable text of a set of cues, capped in size.
	 *
	 * @param array[] $cues Cues.
	 * @return string
	 */
	public static function text( array $cues ) {
		$text = trim( implode( ' ', array_column( $cues, 'text' ) ) );
		if ( strlen( $text ) > self::MAX_TEXT_BYTES ) {
			$text = function_exists( 'mb_strcut' ) ? mb_strcut( $text, 0, self::MAX_TEXT_BYTES, 'UTF-8' ) : substr( $text, 0, self::MAX_TEXT_BYTES );
		}
		return $text;
	}

	/**
	 * Register GET /videos/{guid}/transcript under Rest_Controller::REST_NAMESPACE.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/videos/(?P<guid>[a-zA-Z0-9]{8})/transcript',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'rest_get_transcript' ),
				'permission_callback' => array( __CLASS__, 'rest_can_read_transcript' ),
			)
		);
	}

	/**
	 * Transcripts are as visible as the video: anyone for a public video on a public site, members otherwise.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool|WP_Error
	 */
	public static function rest_can_read_transcript( WP_REST_Request $request ) {
		$id = Channel::attachment_id( (string) $request['guid'] );
		if ( ! $id || ! self::is_enabled() ) {
			return new WP_Error( 'videopress_transcript_not_found', __( 'This video does not belong to this site.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		return self::is_public_video( $id ) || current_user_can( 'read' );
	}

	/**
	 * Whether a video can be watched by anyone.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return bool
	 */
	public static function is_public_video( $attachment_id ) {
		$meta    = wp_get_attachment_metadata( (int) $attachment_id );
		$privacy = is_array( $meta ) ? ( $meta['videopress']['privacy_setting'] ?? $meta['videopress']['is_private'] ?? null ) : null;
		$private = 1 === (int) $privacy || true === $privacy;
		if ( ! $private && 2 === (int) $privacy ) {
			$private = (bool) get_option( 'videopress_private_enabled_for_site', false );
		}
		return ! $private && '0' !== (string) get_option( 'blog_public', '1' ) && '-1' !== (string) get_option( 'blog_public', '1' );
	}

	/**
	 * GET /videos/{guid}/transcript: the selected language, revision, status and cues.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function rest_get_transcript( WP_REST_Request $request ) {
		$id    = Channel::attachment_id( (string) $request['guid'] );
		$state = self::state( $id );
		return rest_ensure_response(
			array(
				'guid'     => (string) $request['guid'],
				'status'   => $state['status'] ?? 'pending',
				'language' => $state['language'] ?? '',
				'source'   => $state['source'] ?? '',
				'revision' => $state['revision'] ?? '',
				'updated'  => $state['updated'] ?? 0,
				'cues'     => self::cues( $id ),
			)
		);
	}
}
