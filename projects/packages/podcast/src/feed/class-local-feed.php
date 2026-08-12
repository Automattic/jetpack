<?php
/**
 * Builds Podcast Player data from the database for the site's own feed,
 * instead of fetching and parsing that feed back over HTTP.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Podcast\Podcast;
use Automattic\Jetpack\Podcast\Settings;
use WP_Post;
use WP_Query;

/**
 * Mirrors what {@see Customize_Feed} emits for the podcast category feed, read
 * straight from the local database. Output matches the shape the Podcast Player
 * block's `view.js` consumes, so callers can swap this in for a feed fetch.
 */
class Local_Feed {

	/**
	 * Query var marking our own queries, so the `posts_where` constraint can
	 * gate itself without touching anything else on the request.
	 */
	const QUERY_FLAG = 'jetpack_podcast_local_feed';

	/**
	 * Whether `$url` is this site's own podcast category feed.
	 *
	 * Requires `Podcast::init()` to have run: with the module inactive the feed
	 * customizations below (stats URLs, enclosure constraint) are never applied
	 * to the real feed, so mirroring them here would silently disagree with it.
	 *
	 * @param string $url Candidate feed URL.
	 */
	public static function is_local_feed( string $url ): bool {
		if ( '' === trim( $url ) || ! Podcast::is_initialized() ) {
			return false;
		}

		$category_id = Customize_Feed::resolve_category_id();
		if ( 0 === $category_id ) {
			return false;
		}

		$normalized = self::normalize_url( $url );
		if ( '' === $normalized ) {
			return false;
		}

		foreach ( self::candidate_feed_urls( $category_id ) as $candidate ) {
			if ( $normalized === self::normalize_url( $candidate ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Player data for the local feed, or null when it can't be built and the
	 * caller should fall back to fetching.
	 *
	 * @param array $args {
	 *     Optional array of arguments.
	 *
	 *     @type int   $limit           Max tracks to return.
	 *     @type array $guids           Specific episode GUIDs, in display order.
	 *     @type bool  $episode_options Whether to include the episode picker list.
	 * }
	 * @return array|null
	 */
	public static function get_player_data( array $args = array() ): ?array {
		$category_id = Customize_Feed::resolve_category_id();
		if ( 0 === $category_id ) {
			return null;
		}

		$guids = isset( $args['guids'] ) && is_array( $args['guids'] ) ? $args['guids'] : array();
		$limit = isset( $args['limit'] ) ? max( 1, (int) $args['limit'] ) : 10;

		$posts = $guids
			? self::get_episodes_by_guid( $category_id, $guids )
			: self::get_episodes( $category_id, $limit );

		$tracks = array_values( array_filter( self::build_tracks( $posts ) ) );
		if ( ! $tracks ) {
			return null;
		}

		$data = array(
			'title'       => self::channel_title( $category_id ),
			'description' => self::plain_text( (string) get_option( 'podcasting_summary', '' ) ),
			'link'        => esc_url( home_url( '/' ) ),
			'cover'       => self::channel_cover(),
			'tracks'      => $tracks,
		);

		if ( ! empty( $args['episode_options'] ) ) {
			$data['options'] = self::build_options( $category_id );
		}

		return $data;
	}

	/**
	 * Restrict our queries to episodes the feed would actually carry: a valid
	 * `enclosure` meta row, and no password (core's `rss_enclosure()` emits
	 * nothing for password-protected posts, so they yield no playable track).
	 *
	 * Constraining in SQL rather than filtering afterwards keeps `LIMIT`
	 * paginating over valid episodes — see {@see Customize_Feed::constrain_feed_query()}
	 * for why this is an `EXISTS` semi-join and not a `meta_query`.
	 *
	 * @param string    $where The `WHERE` clause of the query.
	 * @param \WP_Query $query Query about to run.
	 * @return string
	 */
	public static function constrain_query( $where, $query ) {
		if ( ! $query->get( self::QUERY_FLAG ) ) {
			return $where;
		}

		global $wpdb;

		return $where . $wpdb->prepare(
			" AND {$wpdb->posts}.post_password = '' AND EXISTS ( SELECT 1 FROM {$wpdb->postmeta} WHERE {$wpdb->postmeta}.post_id = {$wpdb->posts}.ID AND {$wpdb->postmeta}.meta_key = %s )",
			'enclosure'
		);
	}

	/**
	 * Episodes in feed order.
	 *
	 * @param int $category_id Podcast category.
	 * @param int $limit       Max posts, or -1 for all.
	 * @return WP_Post[]
	 */
	private static function get_episodes( int $category_id, int $limit ): array {
		add_filter( 'posts_where', array( __CLASS__, 'constrain_query' ), 10, 2 );

		$query = new WP_Query(
			array(
				'cat'                    => $category_id,
				'post_type'              => 'post',
				'post_status'            => 'publish',
				'posts_per_page'         => $limit,
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
				self::QUERY_FLAG         => true,
			)
		);

		remove_filter( 'posts_where', array( __CLASS__, 'constrain_query' ), 10 );

		return $query->posts;
	}

	/**
	 * Episodes matching `$guids`, in the order requested.
	 *
	 * Matched within the feed-sized window rather than by querying `post.guid`
	 * directly — that column is unindexed, and the feed path this mirrors can
	 * only ever resolve GUIDs that appear in the feed either.
	 *
	 * @param int      $category_id Podcast category.
	 * @param string[] $guids       Requested GUIDs.
	 * @return WP_Post[]
	 */
	private static function get_episodes_by_guid( int $category_id, array $guids ): array {
		$by_guid = array();
		foreach ( self::get_episodes( $category_id, self::feed_limit() ) as $post ) {
			$by_guid[ self::normalize_guid( (string) $post->guid ) ] = $post;
		}

		$ordered = array();
		foreach ( $guids as $guid ) {
			$key = self::normalize_guid( (string) $guid );
			if ( isset( $by_guid[ $key ] ) ) {
				$ordered[] = $by_guid[ $key ];
			}
		}

		return $ordered;
	}

	/**
	 * Build every track with the post globals set up, the way the feed's loop
	 * has them — excerpt generation runs the `the_content` filters, and those
	 * read the global post rather than anything we could pass in.
	 *
	 * @param WP_Post[] $posts Episode posts.
	 * @return array[]
	 */
	private static function build_tracks( array $posts ): array {
		global $post;

		$previous = $post;
		$tracks   = array();

		foreach ( $posts as $episode ) {
			$post = $episode; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Restored below.
			setup_postdata( $post );
			$tracks[] = self::build_track( $episode );
		}

		$post = $previous; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Restoring.
		if ( $post instanceof WP_Post ) {
			setup_postdata( $post );
		}

		return $tracks;
	}

	/**
	 * One track, or an empty array when the episode has no playable audio.
	 *
	 * @param WP_Post $post Episode post.
	 * @return array
	 */
	private static function build_track( WP_Post $post ): array {
		$enclosure = self::get_enclosure( $post );
		if ( null === $enclosure ) {
			return array();
		}

		$excerpt      = (string) apply_filters( 'the_excerpt_rss', get_the_excerpt( $post ) );
		$publish_date = get_post_time( DATE_ATOM, true, $post );
		$track        = array(
			'id'               => wp_unique_id( 'podcast-track-' ),
			'link'             => esc_url( (string) get_permalink( $post ) ),
			'src'              => esc_url( $enclosure['url'] ),
			'type'             => esc_attr( $enclosure['type'] ),
			'description'      => self::plain_text( $excerpt ),
			'description_html' => self::html_text( $excerpt ),
			'title'            => self::plain_text( (string) get_the_title( $post ) ),
			'image'            => esc_url( self::episode_image( $post ) ),
			'guid'             => self::plain_text( (string) get_the_guid( $post ) ),
			'publish_date'     => $publish_date ? $publish_date : null,
		);

		if ( '' === $track['title'] ) {
			$track['title'] = esc_html__( '(no title)', 'jetpack-podcast' );
		}

		$duration = self::get_duration( $enclosure['attachment_id'] );
		if ( $duration > 0 ) {
			$track['duration'] = esc_html( self::format_duration( $duration ) );
		}

		return $track;
	}

	/**
	 * First audio enclosure for the episode, parsed the way core's
	 * `rss_enclosure()` parses the meta row it shares with us.
	 *
	 * @param WP_Post $post Episode post.
	 * @return array{url: string, type: string, attachment_id: int}|null
	 */
	private static function get_enclosure( WP_Post $post ): ?array {
		foreach ( (array) get_post_meta( $post->ID, 'enclosure', false ) as $meta ) {
			$parts = explode( "\n", (string) $meta );
			if ( count( $parts ) < 3 ) {
				continue;
			}

			$url  = trim( $parts[0] );
			$type = (string) preg_split( '/[ \t]/', trim( $parts[2] ) )[0];
			if ( '' === $url || 0 !== strpos( $type, 'audio/' ) ) {
				continue;
			}

			$attachment_id = attachment_url_to_postid( $url );

			return array(
				'url'           => self::maybe_stats_url( $post, $url, $attachment_id ),
				'type'          => $type,
				'attachment_id' => $attachment_id,
			);
		}

		return null;
	}

	/**
	 * Route the enclosure through the WPCOM stats endpoint on the same terms
	 * {@see Customize_Feed::rewrite_enclosure()} does, so plays started from the
	 * block are counted identically to plays started from the feed.
	 *
	 * @param WP_Post $post          Episode post.
	 * @param string  $url           Original enclosure URL.
	 * @param int     $attachment_id Resolved attachment, or 0 when external.
	 */
	private static function maybe_stats_url( WP_Post $post, string $url, int $attachment_id ): string {
		if ( $attachment_id <= 0 ) {
			return $url;
		}

		/** This filter is documented in projects/packages/podcast/src/feed/class-customize-feed.php */
		if ( ! (bool) apply_filters( 'wpcom_podcasting_enable_play_tracking', true, $post ) ) {
			return $url;
		}

		/** This filter is documented in projects/packages/podcast/src/feed/class-customize-feed.php */
		$blog_id = (int) apply_filters( 'wpcom_podcasting_tracked_blog_id', Connection_Manager::get_site_id( true ), $post );

		return $blog_id > 0
			? Customize_Feed::build_stats_url( $blog_id, (int) $post->ID, $url )
			: $url;
	}

	/**
	 * Per-item cover art: the episode block's `coverArt`, else the featured image.
	 *
	 * @param WP_Post $post Episode post.
	 */
	private static function episode_image( WP_Post $post ): string {
		$attrs = Episode_Block_Tags::get_block_attrs( $post );
		$cover = isset( $attrs['coverArt']['url'] ) ? trim( (string) $attrs['coverArt']['url'] ) : '';

		return '' !== $cover
			? Customize_Feed::maybe_photon( $cover )
			: Customize_Feed::episode_image_url( (int) $post->ID );
	}

	/**
	 * Episode duration in seconds, from the attachment metadata the feed's
	 * `<itunes:duration>` reads.
	 *
	 * @param int $attachment_id Attachment ID, or 0.
	 */
	private static function get_duration( int $attachment_id ): int {
		if ( $attachment_id <= 0 ) {
			return 0;
		}

		$metadata = wp_get_attachment_metadata( $attachment_id );

		return is_array( $metadata ) ? absint( $metadata['length'] ?? 0 ) : 0;
	}

	/**
	 * Duration as the `H:i:s`/`i:s` string the player renders.
	 *
	 * @param int $duration Seconds.
	 */
	private static function format_duration( int $duration ): string {
		return date_i18n( $duration > HOUR_IN_SECONDS ? 'H:i:s' : 'i:s', $duration );
	}

	/**
	 * Channel title, matching {@see Customize_Feed::feed_title()}.
	 *
	 * @param int $category_id Podcast category.
	 */
	private static function channel_title( int $category_id ): string {
		$override = (string) get_option( 'podcasting_title', '' );
		if ( '' !== $override ) {
			return self::plain_text( $override );
		}

		$category = get_category( $category_id );
		$name     = ( $category && ! is_wp_error( $category ) ) ? $category->name : '';

		return self::plain_text( get_bloginfo( 'name' ) . ( '' !== $name ? ' » ' . $name : '' ) );
	}

	/**
	 * Show cover art, or null when none is configured.
	 */
	private static function channel_cover(): ?string {
		$url = Settings::raw_show_image_url();

		return '' === $url ? null : esc_url( Customize_Feed::maybe_photon( $url ) );
	}

	/**
	 * Episode picker entries for the editor.
	 *
	 * @param int $category_id Podcast category.
	 */
	private static function build_options( int $category_id ): array {
		$options = array();
		foreach ( self::get_episodes( $category_id, self::feed_limit() ) as $post ) {
			$options[] = array(
				'label' => self::plain_text( (string) get_the_title( $post ) ),
				'value' => self::plain_text( (string) get_the_guid( $post ) ),
			);
		}

		return $options;
	}

	/**
	 * How many episodes the feed itself would carry.
	 */
	private static function feed_limit(): int {
		$limit = (int) get_option( 'posts_per_rss', 10 );

		return 0 === $limit ? 10 : $limit;
	}

	/**
	 * Feed URLs that mean "this site's podcast category feed", across every
	 * feed type and both permalink structures.
	 *
	 * @param int $category_id Podcast category.
	 * @return string[]
	 */
	private static function candidate_feed_urls( int $category_id ): array {
		$urls = array();

		foreach ( array( '', 'rss', 'rss2', 'atom', 'rdf' ) as $feed_type ) {
			$link = get_term_feed_link( $category_id, 'category', $feed_type );
			if ( is_string( $link ) && '' !== $link ) {
				$urls[] = $link;
			}

			$urls[] = add_query_arg(
				array(
					'feed' => '' === $feed_type ? get_default_feed() : $feed_type,
					'cat'  => $category_id,
				),
				home_url( '/' )
			);
		}

		return $urls;
	}

	/**
	 * Collapse the variance that doesn't change which resource a feed URL names:
	 * scheme, `www.`, host case, trailing slash and query order. Anything beyond
	 * that (a different domain, an old permalink structure) deliberately fails to
	 * match, so the caller falls back to fetching rather than guessing.
	 *
	 * @param string $url URL to normalize.
	 */
	private static function normalize_url( string $url ): string {
		$parts = wp_parse_url( html_entity_decode( trim( $url ), ENT_QUOTES ) );
		if ( empty( $parts['host'] ) ) {
			return '';
		}

		$host = strtolower( $parts['host'] );
		if ( 0 === strpos( $host, 'www.' ) ) {
			$host = substr( $host, 4 );
		}

		$query = array();
		if ( ! empty( $parts['query'] ) ) {
			parse_str( $parts['query'], $query );
			ksort( $query );
		}

		return $host
			. rtrim( $parts['path'] ?? '', '/' )
			. ( $query ? '?' . build_query( $query ) : '' );
	}

	/**
	 * GUIDs round-trip through `esc_url()` in the feed, so compare decoded.
	 *
	 * @param string $guid Post GUID, possibly entity-encoded by the feed.
	 */
	private static function normalize_guid( string $guid ): string {
		return html_entity_decode( trim( $guid ), ENT_QUOTES );
	}

	/**
	 * Plaintext for React, matching the player's existing `get_plain_text()`.
	 *
	 * @param string $value Raw value.
	 */
	private static function plain_text( string $value ): string {
		$value = trim( $value );

		return '' === $value ? '' : html_entity_decode( wp_strip_all_tags( $value ), ENT_QUOTES );
	}

	/**
	 * Post-content-safe HTML, matching the player's existing `get_html_text()`.
	 *
	 * @param string $value Raw value.
	 */
	private static function html_text( string $value ): string {
		$value = trim( $value );

		return '' === $value ? '' : html_entity_decode( wp_kses_post( $value ), ENT_QUOTES );
	}
}
