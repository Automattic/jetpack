<?php
/**
 * VideoPress playlist block.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Server side of the dynamic videopress/playlist block.
 *
 * The block stores only presentation attributes; membership and order live in
 * the videopress-playlists taxonomy and its term meta, so the frontend markup
 * is produced by a render callback at request time. Server render keeps the
 * REST posture intact: visitors get HTML, while the playlist term routes stay
 * gated behind `upload_files`.
 */
class Playlist_Block {

	/**
	 * Block name, as declared in the block metadata.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'videopress/playlist';

	/**
	 * Registers the playlist block.
	 *
	 * Runs on `init` (via `Initializer::register_videopress_blocks()`), where
	 * the Studio flag is re-evaluated so theme `functions.php` filters are
	 * honored — same rationale as {@see Playlists::register()}. Tolerates a
	 * missing build file (the block metadata ships with the webpack build) and
	 * an already-registered block (Jetpack and the standalone VideoPress
	 * plugin can both load this package).
	 *
	 * @param string|null $block_metadata_file Path to the block.json metadata file.
	 *                                         Defaults to the built block metadata;
	 *                                         tests point it at a fixture.
	 */
	public static function register( $block_metadata_file = null ) {
		if ( ! Admin_UI::is_studio_enabled() ) {
			return;
		}

		if ( null === $block_metadata_file ) {
			$block_metadata_file = __DIR__ . '/../build/block-editor/blocks/playlist/block.json';
		}

		if ( ! file_exists( $block_metadata_file ) ) {
			return;
		}

		// Do not register if the block is already registered.
		if ( \WP_Block_Type_Registry::get_instance()->is_registered( self::BLOCK_NAME ) ) {
			return;
		}

		register_block_type(
			$block_metadata_file,
			array(
				'render_callback' => array( __CLASS__, 'render' ),
			)
		);
	}

	/**
	 * VideoPress playlist block render method.
	 *
	 * Reads the playlist term, its members and its order meta at request time
	 * and renders a main player iframe plus a clickable track list. Bails to
	 * an empty string whenever the playlist cannot be rendered — unregistered
	 * taxonomy (Studio flag off), deleted term, empty playlist, or no member
	 * with a playable guid — so a stale post never fatals.
	 *
	 * Videos are embedded as direct `videopress.com/embed/{guid}` iframes
	 * rather than through per-item oEmbed: N HTTP discoveries plus cache
	 * invalidation baggage is the reason the video block grew self-healing
	 * cache logic, and a playlist multiplies that by its member count.
	 *
	 * @param array     $attributes Block attributes.
	 * @param string    $content    Current block markup.
	 * @param \WP_Block $block      Current block.
	 *
	 * @return string Block markup.
	 */
	public static function render( $attributes, $content = '', $block = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! taxonomy_exists( Playlists::TAXONOMY ) ) {
			return '';
		}

		$playlist_id = isset( $attributes['playlistId'] ) && is_numeric( $attributes['playlistId'] )
			? (int) $attributes['playlistId']
			: 0;

		if ( $playlist_id < 1 ) {
			return '';
		}

		$term = get_term( $playlist_id, Playlists::TAXONOMY );
		if ( ! $term instanceof \WP_Term ) {
			return '';
		}

		$videos = self::get_playlist_videos( $term );
		if ( array() === $videos ) {
			return '';
		}

		$show_header   = (bool) ( $attributes['showHeader'] ?? true );
		$autoplay_next = (bool) ( $attributes['autoplayNext'] ?? true );
		$layout        = ( $attributes['layout'] ?? 'list' ) === 'grid' ? 'grid' : 'list';

		// CSS classes, mirroring the video block's wrapper conventions.
		$align        = $attributes['align'] ?? null;
		$align_class  = $align ? ' align' . $align : '';
		$custom_class = isset( $attributes['className'] ) ? ' ' . $attributes['className'] : '';
		$classes      = 'wp-block-videopress-playlist wp-block-videopress-playlist--' . $layout . $custom_class . $align_class;

		$id_attribute = '';
		if ( isset( $attributes['anchor'] ) && $attributes['anchor'] ) {
			$id_attribute = sprintf( ' id="%s"', esc_attr( $attributes['anchor'] ) );
		}

		$header_html = $show_header ? self::render_header( $term, $videos ) : '';
		$player_html = self::render_player( $videos[0] );
		$items_html  = self::render_items( $videos );
		$config_html = self::render_config( $videos, $autoplay_next );

		/*
		 * The token bridge normally rides the `embed_oembed_html` filter, which
		 * this non-oEmbed render bypasses — enqueue it (and the iframe API the
		 * view script drives) explicitly instead.
		 */
		Jwt_Token_Bridge::enqueue_jwt_token_bridge();
		self::enqueue_iframe_api_script();

		// All fragments are escaped where they are built.
		return sprintf(
			'<figure class="%1$s"%2$s>%3$s%4$s%5$s%6$s</figure>',
			esc_attr( $classes ),
			$id_attribute,
			$header_html,
			$player_html,
			$items_html,
			$config_html
		);
	}

	/**
	 * Collects the playlist's renderable videos, in playlist order.
	 *
	 * Members come from the term relationships (the membership truth), capped
	 * and date-ordered exactly like the dashboard's member fetch, then run
	 * through the shared order resolution so the stored `vps_playlist_order`
	 * wins where it is still valid. Members without a `videopress_guid` (still
	 * processing, or not a VideoPress upload) are skipped.
	 *
	 * @param \WP_Term $term The playlist term.
	 *
	 * @return array[] Ordered video descriptors: id, guid, title, poster, duration (ms), embedUrl.
	 */
	private static function get_playlist_videos( $term ) {
		$member_query = new \WP_Query(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				// Mirrors the dashboard member fetch, including its cap.
				// TODO: paginate once a playlist can exceed 100 members.
				'posts_per_page' => 100,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'fields'         => 'ids',
				'no_found_rows'  => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- Membership is the term relationship; this is the query the block exists to run.
				'tax_query'      => array(
					array(
						'taxonomy' => Playlists::TAXONOMY,
						'field'    => 'term_id',
						'terms'    => $term->term_id,
					),
				),
			)
		);

		$order       = get_term_meta( $term->term_id, Playlists::META_ORDER, true );
		$ordered_ids = self::resolve_ordered_ids(
			is_array( $order ) ? $order : array(),
			$member_query->posts
		);

		$videos = array();

		foreach ( $ordered_ids as $attachment_id ) {
			$guid = get_post_meta( $attachment_id, 'videopress_guid', true );
			if ( ! is_string( $guid ) || '' === $guid ) {
				continue;
			}

			$metadata        = wp_get_attachment_metadata( $attachment_id );
			$videopress_meta = isset( $metadata['videopress'] ) && is_array( $metadata['videopress'] )
				? $metadata['videopress']
				: array();

			$videos[] = array(
				'id'       => $attachment_id,
				'guid'     => $guid,
				'title'    => get_the_title( $attachment_id ),
				'poster'   => isset( $videopress_meta['poster'] ) && is_string( $videopress_meta['poster'] )
					? $videopress_meta['poster']
					: '',
				'duration' => isset( $videopress_meta['duration'] ) && is_numeric( $videopress_meta['duration'] )
					? (int) $videopress_meta['duration']
					: 0,
				'embedUrl' => self::get_embed_url( $guid ),
			);
		}

		return $videos;
	}

	/**
	 * Builds the direct embed URL for a guid.
	 *
	 * Builds the canonical `/v/` URL (with the player defaults every other
	 * VideoPress surface uses) and swaps it to the `/embed/` form the iframe
	 * player serves — the same swap the video block's oEmbed-failure fallback
	 * performs.
	 *
	 * @param string $guid The video guid.
	 *
	 * @return string The embed URL.
	 */
	private static function get_embed_url( $guid ) {
		return preg_replace( '#/v/#', '/embed/', Utils::get_video_press_url( $guid ), 1 );
	}

	/**
	 * Renders the playlist header: artwork, name, description and video count.
	 *
	 * @param \WP_Term $term   The playlist term.
	 * @param array[]  $videos The ordered renderable videos.
	 *
	 * @return string Header markup.
	 */
	private static function render_header( $term, $videos ) {
		$artwork_url = '';
		$artwork_id  = (int) get_term_meta( $term->term_id, Playlists::META_ARTWORK_ID, true );

		if ( $artwork_id > 0 ) {
			$artwork_url = (string) wp_get_attachment_image_url( $artwork_id, 'medium' );
		}

		// Fall back to the first video's poster when no artwork is set (or it was deleted).
		if ( '' === $artwork_url && '' !== $videos[0]['poster'] ) {
			$artwork_url = $videos[0]['poster'];
		}

		$artwork_html = '';
		if ( '' !== $artwork_url ) {
			$artwork_html = sprintf(
				'<img class="wp-block-videopress-playlist__artwork" src="%s" alt="" loading="lazy" />',
				esc_url( $artwork_url )
			);
		}

		$description_html = '';
		if ( '' !== $term->description ) {
			$description_html = sprintf(
				'<div class="wp-block-videopress-playlist__description">%s</div>',
				wp_kses_post( $term->description )
			);
		}

		$count      = count( $videos );
		$count_text = sprintf(
			/* translators: %s: the number of videos in the playlist. */
			_n( '%s video', '%s videos', $count, 'jetpack-videopress-pkg' ),
			number_format_i18n( $count )
		);

		return sprintf(
			'<div class="wp-block-videopress-playlist__header">%1$s<div class="wp-block-videopress-playlist__header-text"><span class="wp-block-videopress-playlist__name">%2$s</span>%3$s<span class="wp-block-videopress-playlist__count">%4$s</span></div></div>',
			$artwork_html,
			esc_html( $term->name ),
			$description_html,
			esc_html( $count_text )
		);
	}

	/**
	 * Renders the main player iframe for the initially-active video.
	 *
	 * Same iframe attributes as the video block's oEmbed-failure fallback, so
	 * the iframe API and token bridge drive both the same way.
	 *
	 * @param array $video The active video descriptor.
	 *
	 * @return string Player markup.
	 */
	private static function render_player( $video ) {
		$title = '' !== $video['title']
			? $video['title']
			: __( 'VideoPress Video Player', 'jetpack-videopress-pkg' );

		return sprintf(
			'<div class="wp-block-videopress-playlist__player"><iframe title="%1$s" aria-label="%1$s" src="%2$s" width="640" height="360" allowfullscreen data-resize-to-parent="true" allow="clipboard-write"></iframe></div>',
			esc_attr( $title ),
			esc_url( $video['embedUrl'] )
		);
	}

	/**
	 * Renders the track list: one button per video, the active one marked.
	 *
	 * @param array[] $videos The ordered renderable videos.
	 *
	 * @return string List markup.
	 */
	private static function render_items( $videos ) {
		$items_html = '';

		foreach ( $videos as $index => $video ) {
			$poster_html = '' !== $video['poster']
				? sprintf(
					'<img class="wp-block-videopress-playlist__item-poster" src="%s" alt="" loading="lazy" />',
					esc_url( $video['poster'] )
				)
				: '<span class="wp-block-videopress-playlist__item-poster wp-block-videopress-playlist__item-poster--empty"></span>';

			$duration_html = $video['duration'] > 0
				? sprintf(
					'<span class="wp-block-videopress-playlist__item-duration">%s</span>',
					esc_html( self::format_duration( $video['duration'] ) )
				)
				: '';

			$items_html .= sprintf(
				'<li class="wp-block-videopress-playlist__item"><button type="button" class="wp-block-videopress-playlist__item-button" data-vp-guid="%1$s"%2$s><span class="wp-block-videopress-playlist__item-index">%3$s</span>%4$s<span class="wp-block-videopress-playlist__item-title">%5$s</span>%6$s</button></li>',
				esc_attr( $video['guid'] ),
				0 === $index ? ' aria-current="true"' : '',
				esc_html( number_format_i18n( $index + 1 ) ),
				$poster_html,
				esc_html( $video['title'] ),
				$duration_html
			);
		}

		return sprintf( '<ol class="wp-block-videopress-playlist__items">%s</ol>', $items_html );
	}

	/**
	 * Renders the JSON config the view script consumes (and then removes).
	 *
	 * @param array[] $videos        The ordered renderable videos.
	 * @param bool    $autoplay_next Whether playback advances to the next video.
	 *
	 * @return string Config script markup.
	 */
	private static function render_config( $videos, $autoplay_next ) {
		$config = array(
			'videos'       => array_map(
				static function ( $video ) {
					return array(
						'guid'     => $video['guid'],
						'embedUrl' => $video['embedUrl'],
						'title'    => $video['title'],
					);
				},
				$videos
			),
			'autoplayNext' => $autoplay_next,
		);

		return sprintf(
			'<script type="application/json" class="wp-block-videopress-playlist__config">%s</script>',
			wp_json_encode( $config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP )
		);
	}

	/**
	 * Formats a millisecond duration as m:ss (or h:mm:ss past the hour).
	 *
	 * @param int $duration_ms Duration in milliseconds, as stored in the
	 *                         attachment's videopress metadata.
	 *
	 * @return string Formatted duration.
	 */
	private static function format_duration( $duration_ms ) {
		$total_seconds = (int) floor( $duration_ms / 1000 );
		$hours         = intdiv( $total_seconds, 3600 );
		$minutes       = intdiv( $total_seconds % 3600, 60 );
		$seconds       = $total_seconds % 60;

		if ( $hours > 0 ) {
			return sprintf( '%d:%02d:%02d', $hours, $minutes, $seconds );
		}

		return sprintf( '%d:%02d', $minutes, $seconds );
	}

	/**
	 * Enqueues the VideoPress iframe API script for the frontend player.
	 *
	 * Same handle and source as the oEmbed path's
	 * {@see Initializer::enqueue_videopress_iframe_api_script()}, which never
	 * fires for this block's direct iframes.
	 */
	private static function enqueue_iframe_api_script() {
		wp_enqueue_script(
			Initializer::JETPACK_VIDEOPRESS_IFRAME_API_HANDLER,
			'https://s0.wp.com/wp-content/plugins/video/assets/js/videojs/videopress-iframe-api.js',
			array(),
			gmdate( 'YW' ),
			false
		);
	}

	/**
	 * Reconciles a stored playlist order with the playlist's actual members.
	 *
	 * PHP twin of resolveOrderedIds() in src/client/lib/playlist-order — keep
	 * the semantics in lockstep or the editor preview and the frontend render
	 * will disagree. `vps_playlist_order` term meta is presentation-only and
	 * can drift from the real term relationships: order entries whose ID is no
	 * longer a member are dropped, members absent from the order are appended
	 * in the sequence `$member_ids` arrives in, and duplicates keep their
	 * first position. Entries are cast to int so meta values that round-trip
	 * as numeric strings still match.
	 *
	 * @param array $order      The stored `vps_playlist_order` attachment IDs.
	 * @param array $member_ids IDs of the attachments actually carrying the term.
	 * @return int[] The reconciled, fully-covering ordered ID list.
	 */
	public static function resolve_ordered_ids( array $order, array $member_ids ): array {
		$member_ids = array_map( 'intval', $member_ids );
		$members    = array_fill_keys( $member_ids, true );
		$ordered    = array();

		foreach ( array_merge( array_map( 'intval', $order ), $member_ids ) as $id ) {
			if ( isset( $members[ $id ] ) && ! isset( $ordered[ $id ] ) ) {
				$ordered[ $id ] = $id;
			}
		}

		return array_values( $ordered );
	}
}
