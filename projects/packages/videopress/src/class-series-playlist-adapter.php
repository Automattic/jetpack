<?php
/**
 * Series playlists: Video Playlist blocks whose videos come from a series.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Post;
use WP_Term;

/**
 * Turns a `videopress_series` term into the playlist data structure.
 *
 * A Video Playlist block with the `series` source is a playlist of its own: the index stores it
 * as a record of TYPE, with a snapshot of the series' videos. The adapter builds that record when
 * the index stores the block, swaps in the series' current videos whenever a record or block is
 * rendered, and refreshes the snapshots when a series or its videos change.
 */
class Series_Playlist_Adapter {

	/**
	 * The Video Playlist block's `source` for a series.
	 *
	 * @var string
	 */
	const SOURCE = 'series';

	/**
	 * The `type` of a series playlist's index record. Records without a type are the block's own videos.
	 *
	 * @var string
	 */
	const TYPE = 'series';

	/**
	 * Block attribute holding the series term ID.
	 *
	 * @var string
	 */
	const TERM_ATTRIBUTE = 'sourceSeriesId';

	/**
	 * Most videos a series playlist holds, newest first.
	 *
	 * @var int
	 */
	const MAX_ENTRIES = 200;

	/**
	 * Whether the index snapshots are already due for a refresh at the end of this request.
	 *
	 * @var bool
	 */
	private static $refresh_scheduled = false;

	/**
	 * Refresh the index snapshots when a series or its videos change.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'set_object_terms', array( __CLASS__, 'object_terms_changed' ), 10, 6 );
		add_action( 'deleted_term_relationships', array( __CLASS__, 'term_relationships_deleted' ), 10, 3 );
		add_action( 'edited_' . Classification::SERIES, array( __CLASS__, 'schedule_refresh' ) );
		add_action( 'delete_' . Classification::SERIES, array( __CLASS__, 'schedule_refresh' ) );
	}

	/**
	 * Whether a Video Playlist block takes its videos from a series.
	 *
	 * @param mixed $attrs Block attributes.
	 * @return bool
	 */
	public static function is_series_block( $attrs ) {
		return is_array( $attrs ) && isset( $attrs['source'] ) && self::SOURCE === $attrs['source'];
	}

	/**
	 * Whether an index record is a series playlist.
	 *
	 * @param mixed $record Index record.
	 * @return bool
	 */
	public static function is_series_record( $record ) {
		return is_array( $record ) && isset( $record['type'] ) && self::TYPE === $record['type'];
	}

	/**
	 * The series term with an ID, or null.
	 *
	 * @param mixed $term_id Term ID.
	 * @return WP_Term|null
	 */
	public static function term( $term_id ) {
		$term_id = is_numeric( $term_id ) ? absint( $term_id ) : 0;
		if ( ! $term_id || ! Classification::is_enabled() ) {
			return null;
		}
		$term = get_term( $term_id, Classification::SERIES );

		return $term instanceof WP_Term ? $term : null;
	}

	/**
	 * The playlist entries of a series and its child series: the videos the channel lists, newest first.
	 *
	 * @param WP_Term|null $term The series.
	 * @return array[] Sanitized playlist entries.
	 */
	public static function entries( $term ) {
		if ( ! $term instanceof WP_Term ) {
			return array();
		}
		$videos = Channel_Data::videos( '', array( Classification::SERIES => array( $term->slug ) ) );
		$fields = array_flip( array( 'guid', 'durationMs', 'height' ) );

		return Initializer::sanitize_playlist_entries(
			array_map(
				function ( $video ) use ( $fields ) {
					return is_array( $video ) ? array_intersect_key( $video, $fields ) : $video;
				},
				array_slice( $videos, 0, self::MAX_ENTRIES )
			)
		);
	}

	/**
	 * The series the editor offers, by name, each with the videos a series playlist would show.
	 *
	 * @return array[] Items with id, name, parent and videos.
	 */
	public static function editor_series() {
		if ( ! Classification::is_enabled() || ! taxonomy_exists( Classification::SERIES ) ) {
			return array();
		}
		$terms = get_terms(
			array(
				'taxonomy'   => Classification::SERIES,
				'hide_empty' => false,
				'orderby'    => 'name',
				'number'     => self::MAX_ENTRIES,
			)
		);
		if ( ! is_array( $terms ) ) {
			return array();
		}

		$series = array();
		foreach ( $terms as $term ) {
			if ( $term instanceof WP_Term ) {
				$series[] = array_merge(
					array_intersect_key( Classification::term_data( $term ), array_flip( array( 'id', 'name', 'parent' ) ) ),
					array( 'videos' => self::entries( $term ) )
				);
			}
		}
		return $series;
	}

	/**
	 * Store a series block in the index: its record, with the series' videos as they are now.
	 *
	 * @param array   $attrs Block attributes.
	 * @param WP_Post $post  The post holding the block.
	 * @return array Index record.
	 */
	public static function to_record( array $attrs, WP_Post $post ) {
		$term = self::term( $attrs[ self::TERM_ATTRIBUTE ] ?? 0 );

		return array(
			'type'        => self::TYPE,
			'series'      => $term ? (int) $term->term_id : absint( $attrs[ self::TERM_ATTRIBUTE ] ?? 0 ),
			'title'       => self::title( $attrs, $term ),
			'description' => self::description( $attrs, $term ),
			'videos'      => self::entries( $term ),
			'post_id'     => (int) $post->ID,
		);
	}

	/**
	 * Render a record: a series playlist gets its series' current videos, any other record is returned as is.
	 *
	 * @param array $record Index record.
	 * @return array
	 */
	public static function resolve( array $record ) {
		if ( ! self::is_series_record( $record ) ) {
			return $record;
		}
		$record['videos'] = self::entries( self::term( $record['series'] ?? 0 ) );

		return $record;
	}

	/**
	 * Render a series block: the playlist it shows, as Channel::source_playlist() returns one.
	 *
	 * @param array $attrs Block attributes.
	 * @return array|null Null when the series no longer exists.
	 */
	public static function block_playlist( array $attrs ) {
		$term = self::term( $attrs[ self::TERM_ATTRIBUTE ] ?? 0 );
		if ( ! $term ) {
			return null;
		}

		return array(
			'key'         => isset( $attrs['playlistId'] ) && is_string( $attrs['playlistId'] ) ? sanitize_key( $attrs['playlistId'] ) : '',
			'title'       => self::title( $attrs, $term ),
			'description' => self::description( $attrs, $term ),
			'videos'      => self::entries( $term ),
		);
	}

	/**
	 * The block's own title, or the series name.
	 *
	 * @param array        $attrs Block attributes.
	 * @param WP_Term|null $term  The series.
	 * @return string
	 */
	private static function title( array $attrs, $term ) {
		$title = isset( $attrs['playlistTitle'] ) && is_string( $attrs['playlistTitle'] ) ? sanitize_text_field( $attrs['playlistTitle'] ) : '';
		if ( '' === $title && $term ) {
			$title = sanitize_text_field( html_entity_decode( $term->name, ENT_QUOTES ) );
		}

		return $title;
	}

	/**
	 * The block's own description, or the series description.
	 *
	 * @param array        $attrs Block attributes.
	 * @param WP_Term|null $term  The series.
	 * @return string
	 */
	private static function description( array $attrs, $term ) {
		$description = isset( $attrs['playlistDescription'] ) && is_string( $attrs['playlistDescription'] ) ? sanitize_textarea_field( $attrs['playlistDescription'] ) : '';
		if ( '' === $description && $term ) {
			$description = sanitize_textarea_field( $term->description );
		}

		return $description;
	}

	/**
	 * Refresh after a video's series change.
	 *
	 * @param int    $object_id  Object ID.
	 * @param array  $terms      Terms requested.
	 * @param array  $tt_ids     Term taxonomy IDs now set.
	 * @param string $taxonomy   Taxonomy.
	 * @param bool   $append     Whether the terms were appended.
	 * @param array  $old_tt_ids Term taxonomy IDs set before.
	 * @return void
	 */
	public static function object_terms_changed( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ) {
		if ( Classification::SERIES !== $taxonomy ) {
			return;
		}
		$tt_ids     = array_map( 'intval', (array) $tt_ids );
		$old_tt_ids = array_map( 'intval', (array) $old_tt_ids );
		sort( $tt_ids );
		sort( $old_tt_ids );
		if ( $tt_ids !== $old_tt_ids ) {
			self::schedule_refresh();
		}
	}

	/**
	 * Refresh after a video leaves a series, including when it is deleted.
	 *
	 * @param int    $object_id Object ID.
	 * @param array  $tt_ids    Term taxonomy IDs removed.
	 * @param string $taxonomy  Taxonomy.
	 * @return void
	 */
	public static function term_relationships_deleted( $object_id, $tt_ids, $taxonomy ) {
		if ( Classification::SERIES === $taxonomy && $tt_ids ) {
			self::schedule_refresh();
		}
	}

	/**
	 * Refresh the snapshots once, at the end of the request, however many videos a bulk edit changes.
	 *
	 * @return void
	 */
	public static function schedule_refresh() {
		if ( self::$refresh_scheduled ) {
			return;
		}
		self::$refresh_scheduled = true;
		add_action( 'shutdown', array( __CLASS__, 'refresh_index' ) );
	}

	/**
	 * Re-index every post holding a series playlist, so its record follows the series.
	 *
	 * @return void
	 */
	public static function refresh_index() {
		self::$refresh_scheduled = false;
		remove_action( 'shutdown', array( __CLASS__, 'refresh_index' ) );
		// Lists read earlier in this request predate the change.
		Channel_Data::reset();

		$post_ids = array();
		foreach ( Playlist_Index::get_playlists() as $record ) {
			if ( self::is_series_record( $record ) && ! empty( $record['post_id'] ) ) {
				$post_ids[] = (int) $record['post_id'];
			}
		}
		foreach ( array_unique( $post_ids ) as $post_id ) {
			Playlist_Index::index_post( $post_id );
		}
	}
}
