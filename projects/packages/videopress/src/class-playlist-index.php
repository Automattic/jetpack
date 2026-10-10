<?php
/**
 * Site-wide index of the Video Playlist blocks in published content.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Post;
use WP_Query;

/**
 * Keeps the `videopress_playlist_index` option in sync with the Video Playlist
 * blocks found in published content, so the All Playlists block can list them
 * without scanning the site on every render.
 *
 * The option is an object keyed by playlist key; every record holds the
 * playlist title, description, videos, and the id of the post it lives in.
 */
class Playlist_Index {

	/**
	 * Option holding the index. Never autoloaded: it grows with the site.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'videopress_playlist_index';

	/**
	 * Option recording which index schema the site has been fully scanned for.
	 * Bump INDEX_VERSION to have every site rescanned on its next update.
	 *
	 * @var string
	 */
	const VERSION_OPTION_NAME = 'videopress_playlist_index_version';

	/**
	 * Current index schema version.
	 *
	 * @var int
	 */
	const INDEX_VERSION = 1;

	/**
	 * Cron hook that runs the initial full scan.
	 *
	 * @var string
	 */
	const BUILD_HOOK = 'videopress_build_playlist_index';

	/**
	 * Name of the block the index tracks.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'videopress/playlist';

	/**
	 * Blocks that build a playlist dynamically and wrap a Video Playlist block
	 * as their canvas. They are not playlists of their own, so the scan skips
	 * them and everything inside them.
	 *
	 * @var string[]
	 */
	const DYNAMIC_PLAYLIST_BLOCKS = array( 'videopress/latest-videos-playlist' );

	/**
	 * Posts fetched per query during a full scan.
	 *
	 * @var int
	 */
	const SCAN_BATCH_SIZE = 100;

	/**
	 * Hook the index into the post lifecycle and schedule the initial scan.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'wp_after_insert_post', array( __CLASS__, 'index_post' ), 10, 2 );
		add_action( 'deleted_post', array( __CLASS__, 'remove_post' ) );
		add_action( 'admin_init', array( __CLASS__, 'maybe_schedule_build' ) );
		add_action( self::BUILD_HOOK, array( __CLASS__, 'build' ) );
	}

	/**
	 * Get every indexed playlist, keyed by playlist key.
	 *
	 * @return array<string, array{title: string, description: string, videos: array, post_id: int}>
	 */
	public static function get_playlists() {
		$index = get_option( self::OPTION_NAME, array() );

		return is_array( $index ) ? $index : array();
	}

	/**
	 * Schedule the one-off full scan when the site has never been indexed for the
	 * current schema, e.g. right after the plugin update that shipped the index.
	 *
	 * @return void
	 */
	public static function maybe_schedule_build() {
		if ( (int) get_option( self::VERSION_OPTION_NAME, 0 ) >= self::INDEX_VERSION ) {
			return;
		}

		if ( ! wp_next_scheduled( self::BUILD_HOOK ) ) {
			wp_schedule_single_event( time(), self::BUILD_HOOK );
		}
	}

	/**
	 * Rebuild the whole index from the published content that contains a
	 * Video Playlist block, then record the schema version it was built for.
	 *
	 * @return void
	 */
	public static function build() {
		$index = array();
		$paged = 1;

		$add_content_clause = function ( $where ) {
			global $wpdb;

			return $where . $wpdb->prepare(
				" AND {$wpdb->posts}.post_content LIKE %s",
				'%' . $wpdb->esc_like( '<!-- wp:' . self::BLOCK_NAME ) . '%'
			);
		};

		add_filter( 'posts_where', $add_content_clause );

		do {
			$query = new WP_Query(
				array(
					'post_type'              => self::indexed_post_types(),
					'post_status'            => 'publish',
					'posts_per_page'         => self::SCAN_BATCH_SIZE,
					'paged'                  => $paged,
					'orderby'                => 'ID',
					'order'                  => 'ASC',
					'no_found_rows'          => true,
					'ignore_sticky_posts'    => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);

			foreach ( $query->posts as $post ) {
				if ( $post instanceof WP_Post ) {
					self::add_post_records( $index, $post );
				}
			}

			$batch_size = count( $query->posts );
			++$paged;
		} while ( self::SCAN_BATCH_SIZE === $batch_size );

		remove_filter( 'posts_where', $add_content_clause );

		self::save( $index );
		update_option( self::VERSION_OPTION_NAME, self::INDEX_VERSION );
	}

	/**
	 * Re-index one post after it is saved: its previous records are replaced by
	 * the playlists its content holds now, or dropped when it is no longer public.
	 *
	 * @param int          $post_id Post id.
	 * @param WP_Post|null $post    The post; looked up when omitted.
	 *
	 * @return void
	 */
	public static function index_post( $post_id, $post = null ) {
		$post_id = absint( $post_id );
		if ( ! $post_id || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( ! $post instanceof WP_Post ) {
			$post = get_post( $post_id );
		}
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		$index = self::without_post( self::get_playlists(), $post_id );

		if ( 'publish' === $post->post_status && in_array( $post->post_type, self::indexed_post_types(), true ) ) {
			self::add_post_records( $index, $post );
		}

		self::save( $index );
	}

	/**
	 * Drop a deleted post's playlists from the index.
	 *
	 * @param int $post_id Post id.
	 *
	 * @return void
	 */
	public static function remove_post( $post_id ) {
		$post_id = absint( $post_id );
		if ( ! $post_id ) {
			return;
		}

		self::save( self::without_post( self::get_playlists(), $post_id ) );
	}

	/**
	 * Extract the playlist records from a post's content.
	 *
	 * Keys come from the block's `playlistId` attribute. Blocks saved before the
	 * attribute existed fall back to `{post id}-{ordinal}`, and a key another
	 * post already owns (a block copied between posts) is suffixed with the post
	 * id so both playlists stay listed.
	 *
	 * @param WP_Post $post The post.
	 *
	 * @return array<string, array> Records keyed by playlist key.
	 */
	public static function extract_records( WP_Post $post ) {
		$records = array();
		if ( ! has_block( self::BLOCK_NAME, $post ) ) {
			return $records;
		}

		$ordinal = 0;
		foreach ( self::find_playlist_blocks( parse_blocks( $post->post_content ) ) as $attrs ) {
			++$ordinal;

			$key = isset( $attrs['playlistId'] ) && is_string( $attrs['playlistId'] )
				? sanitize_key( $attrs['playlistId'] )
				: '';
			if ( '' === $key ) {
				$key = $post->ID . '-' . $ordinal;
			}

			$records[ $key ] = array(
				'title'       => isset( $attrs['playlistTitle'] ) && is_string( $attrs['playlistTitle'] )
					? sanitize_text_field( $attrs['playlistTitle'] )
					: '',
				'description' => isset( $attrs['playlistDescription'] ) && is_string( $attrs['playlistDescription'] )
					? sanitize_textarea_field( $attrs['playlistDescription'] )
					: '',
				'videos'      => Initializer::sanitize_playlist_entries( $attrs['videos'] ?? null ),
				'post_id'     => (int) $post->ID,
			);
		}

		return $records;
	}

	/**
	 * Merge a post's playlist records into an index being built.
	 *
	 * @param array   $index The index, modified in place.
	 * @param WP_Post $post  The post.
	 *
	 * @return void
	 */
	private static function add_post_records( array &$index, WP_Post $post ) {
		foreach ( self::extract_records( $post ) as $key => $record ) {
			if ( isset( $index[ $key ] ) && (int) $index[ $key ]['post_id'] !== (int) $post->ID ) {
				$key .= '-' . $post->ID;
			}
			$index[ $key ] = $record;
		}
	}

	/**
	 * Collect the attributes of every standalone Video Playlist block in a parsed
	 * block tree; dynamic playlist blocks and their inner blocks are skipped.
	 *
	 * @param array $blocks Parsed blocks.
	 *
	 * @return array[] Attribute arrays, in document order.
	 */
	private static function find_playlist_blocks( array $blocks ) {
		$found = array();

		foreach ( $blocks as $block ) {
			if ( in_array( $block['blockName'] ?? null, self::DYNAMIC_PLAYLIST_BLOCKS, true ) ) {
				continue;
			}

			if ( self::BLOCK_NAME === ( $block['blockName'] ?? null ) ) {
				$found[] = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$found = array_merge( $found, self::find_playlist_blocks( $block['innerBlocks'] ) );
			}
		}

		return $found;
	}

	/**
	 * Return the index without the records that belong to a post.
	 *
	 * @param array $index   The index.
	 * @param int   $post_id Post id.
	 *
	 * @return array
	 */
	private static function without_post( array $index, $post_id ) {
		return array_filter(
			$index,
			function ( $record ) use ( $post_id ) {
				return ! is_array( $record ) || (int) ( $record['post_id'] ?? 0 ) !== (int) $post_id;
			}
		);
	}

	/**
	 * Post types whose content the index covers: everything a visitor can open.
	 *
	 * @return string[]
	 */
	private static function indexed_post_types() {
		return array_values(
			array_filter(
				get_post_types( array( 'public' => true ) ),
				function ( $post_type ) {
					return 'attachment' !== $post_type;
				}
			)
		);
	}

	/**
	 * Persist the index, without autoloading it.
	 *
	 * @param array $index The index.
	 *
	 * @return void
	 */
	private static function save( array $index ) {
		if ( false === get_option( self::OPTION_NAME ) ) {
			add_option( self::OPTION_NAME, $index, '', false );
			return;
		}

		update_option( self::OPTION_NAME, $index, false );
	}
}
