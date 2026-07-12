<?php
/**
 * Adds podcast tags + tracked enclosure URLs to the RSS feed for the
 * configured podcast category.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Podcast\Settings;
use WP_Post;

/**
 * Hooks into RSS2 rendering when the current request is the podcast category
 * feed, adding `<itunes:*>` + `<podcast:*>` tags at channel and item level
 * and rewriting `<enclosure>` URLs through the WPCOM stats endpoint.
 */
class Customize_Feed {

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Enclosure URLs already emitted in the current feed render, keyed by post
	 * ID then URL. Reset on `rss2_head` so each feed starts clean — see
	 * {@see self::is_duplicate_enclosure()}.
	 *
	 * @var array<int, array<string, true>>
	 */
	private static $seen_enclosures = array();

	/**
	 * Wire the late-binding `wp` action that decides whether to register the
	 * feed-modification hooks for this request. Idempotent.
	 */
	public static function init() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_action( 'wp', array( __CLASS__, 'maybe_register_feed_hooks' ) );

		// `the_posts` fires during query execution — before the `wp` action —
		// so it has to be registered up-front and self-gated to the podcast
		// feed query, rather than wired conditionally in `maybe_register_feed_hooks`.
		add_filter( 'the_posts', array( __CLASS__, 'filter_posts_with_enclosure' ), 10, 2 );
	}

	/**
	 * Register the RSS2 hooks if this request is the configured podcast feed.
	 * Also fires `Feed_Detection` while we're here — same gating, no need to
	 * walk the post query twice.
	 */
	public static function maybe_register_feed_hooks() {
		if ( ! is_feed() ) {
			return;
		}
		$category_id = self::resolve_category_id();
		if ( 0 === $category_id || ! is_category( $category_id ) ) {
			return;
		}

		// Strip channel-level tags that conflict with the iTunes-compliant
		// header: blavatar / site-icon `<image>` duplicates `<itunes:image>`,
		// and `<cloud …/>` from rsscloud isn't part of the podcast spec.
		remove_action( 'rss2_head', 'rss2_blavatar' );
		remove_action( 'rss2_head', 'rss2_site_icon' );
		remove_action( 'rss2_head', 'rsscloud_add_rss_cloud_element' );

		add_action( 'rss2_ns', array( __CLASS__, 'output_namespaces' ) );
		add_filter( 'wp_title_rss', array( __CLASS__, 'feed_title' ) );
		add_filter( 'bloginfo_rss', array( __CLASS__, 'feed_description' ), 10, 2 );
		add_action( 'rss2_head', array( __CLASS__, 'reset_enclosure_dedup' ), 0 );
		add_action( 'rss2_head', array( __CLASS__, 'output_channel_tags' ) );
		add_action( 'rss2_item', array( __CLASS__, 'output_item_tags' ) );
		add_filter( 'rss_enclosure', array( __CLASS__, 'rewrite_enclosure' ) );

		add_filter( 'option_rss_use_excerpt', '__return_false' );
		// Request-scoped to the feed: only the queried episodes render here, so
		// this never touches block output outside the podcast feed response.
		add_filter( 'render_block', array( __CLASS__, 'strip_block_from_feed' ), 10, 2 );
		add_filter( 'comments_open', '__return_false' );
		add_filter( 'get_comments_number', '__return_zero' );
		add_filter( 'the_category_rss', '__return_empty_string' );
		remove_action( 'rss2_item', 'mrss_item', 10 );
		remove_action( 'rss2_item', 'mrss_news_item' );

		Feed_Detection::detect_and_record();
	}

	/**
	 * Add iTunes and Podcasting 2.0 XML namespaces to the `<rss>` open tag.
	 */
	public static function output_namespaces() {
		echo "\n\t" . 'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"' . "\n";
		echo "\t" . 'xmlns:podcast="https://podcastindex.org/namespace/1.0"' . "\n";
	}

	/**
	 * Override the feed title with `podcasting_title`, falling back to
	 * `Blog Name » Category Name`.
	 *
	 * @param string $title Existing title.
	 * @return string
	 */
	public static function feed_title( $title ) {
		$override = (string) get_option( 'podcasting_title', '' );
		if ( '' !== $override ) {
			return esc_xml( $override );
		}

		$category = get_category( self::resolve_category_id() );
		if ( $category && ! is_wp_error( $category ) ) {
			return esc_xml( get_bloginfo( 'name' ) ) . ' &#187; ' . esc_xml( $category->name );
		}
		return esc_xml( $title );
	}

	/**
	 * Replace the `bloginfo_rss('description')` value with `podcasting_summary`.
	 *
	 * `bloginfo_rss()` echoes the filter return value directly, so we strip and
	 * escape here — matches the channel-level `<itunes:summary>` treatment and
	 * keeps stray markup in the option from leaking into `<description>`.
	 *
	 * @param string $value Existing value.
	 * @param string $field Field being requested.
	 * @return string
	 */
	public static function feed_description( $value, $field ) {
		if ( 'description' !== $field ) {
			return $value;
		}
		return esc_xml( wp_strip_all_tags( (string) get_option( 'podcasting_summary', '' ) ) );
	}

	/**
	 * Channel-level podcast tags (rss2_head).
	 */
	public static function output_channel_tags() {
		$summary = (string) get_option( 'podcasting_summary', '' );
		if ( '' !== $summary ) {
			echo '<itunes:summary>' . esc_xml( wp_strip_all_tags( $summary ) ) . "</itunes:summary>\n";
		}

		$author = (string) get_option( 'podcasting_talent_name', '' );
		if ( '' !== $author ) {
			echo '<itunes:author>' . esc_xml( wp_strip_all_tags( $author ) ) . "</itunes:author>\n";
		}

		$email = wp_strip_all_tags( (string) get_option( 'podcasting_email', '' ) );
		if ( '' !== $email ) {
			echo '<itunes:owner><itunes:email>' . esc_xml( $email ) . "</itunes:email></itunes:owner>\n";
		}

		$copyright = (string) get_option( 'podcasting_copyright', '' );
		if ( '' !== $copyright ) {
			echo '<copyright>' . esc_xml( wp_strip_all_tags( $copyright ) ) . "</copyright>\n";
		}

		/**
		 * Explicit content flag
		 */
		echo '<itunes:explicit>' . esc_html( self::explicit_string() ) . "</itunes:explicit>\n";

		$image = self::show_image_url();
		if ( '' !== $image ) {
			echo '<itunes:image href="' . esc_url( $image ) . '" />' . "\n";
		}

		echo self::category_tag( (string) get_option( 'podcasting_category_1', '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped XML fragment.
		echo self::category_tag( (string) get_option( 'podcasting_category_2', '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped XML fragment.
		echo self::category_tag( (string) get_option( 'podcasting_category_3', '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped XML fragment.
	}

	/**
	 * Item-level podcast tags (rss2_item).
	 */
	public static function output_item_tags() {
		global $post;

		if ( ! $post instanceof WP_Post ) {
			return;
		}

		$author = get_the_author();
		if ( '' === $author ) {
			$author = (string) get_option( 'podcasting_talent_name', '' );
		}
		if ( '' !== $author ) {
			echo '<itunes:author>' . esc_xml( wp_strip_all_tags( $author ) ) . "</itunes:author>\n";
		}

		// Re-applying `the_excerpt_rss` so `<itunes:summary>` matches whatever
		// the item's `<description>` ends up emitting — `get_the_excerpt()`
		// doesn't run the filter chain itself.
		$excerpt = (string) apply_filters( 'the_excerpt_rss', get_the_excerpt() );
		if ( '' !== $excerpt ) {
			echo '<itunes:summary>' . esc_xml( wp_strip_all_tags( $excerpt ) ) . "</itunes:summary>\n";
		}

		// Per-item cover art: prefer the block's `coverArt`, fall back to the
		// post's featured image. Either way, photon-resize to 3000×3000 to
		// honour Apple's square-cover requirement. When neither is present
		// the channel-level `<itunes:image>` applies as default per spec.
		$attrs      = Episode_Block_Tags::get_block_attrs( $post );
		$cover_url  = isset( $attrs['coverArt']['url'] ) ? trim( (string) $attrs['coverArt']['url'] ) : '';
		$item_image = '' !== $cover_url ? self::maybe_photon( $cover_url ) : self::episode_image_url( $post->ID );
		if ( '' !== $item_image ) {
			echo '<itunes:image href="' . esc_url( $item_image ) . '" />' . "\n";
		}

		// Block-driven iTunes + Podcasting 2.0 tags. Legacy audio posts
		// without the block contribute nothing — they keep their pre-block
		// behavior intact aside from the cover art handled above.
		if ( ! empty( $attrs ) ) {
			Episode_Block_Tags::render_from_attrs( $attrs );
		}
	}

	/**
	 * Strip the episode, feed-player, and subscribe blocks from
	 * `<content:encoded>`, leaving the surrounding show-note prose.
	 *
	 * @param string $block_content Rendered block HTML.
	 * @param array  $block         Parsed block, including its `blockName`.
	 * @return string
	 */
	public static function strip_block_from_feed( $block_content, $block ) {
		static $chrome = array(
			'jetpack/podcast-episode',
			'jetpack/podcast-player',
			'jetpack/subscriptions',
		);
		if ( isset( $block['blockName'] ) && in_array( $block['blockName'], $chrome, true ) ) {
			return '';
		}
		return $block_content;
	}

	/**
	 * Rewrite the enclosure URL through the WPCOM stats endpoint and append
	 * `<itunes:duration>` when resolvable. Duration is looked up against the
	 * *original* attachment URL — the stats URL is synthetic.
	 *
	 * A podcast item is only valid with a single `<enclosure>`, but core
	 * `rss_enclosure()` emits one per `enclosure` post-meta row and posts
	 * routinely accumulate several (URL drift across re-uploads / CDN hosts
	 * that `do_enclose()`'s dedup treats as distinct). Rewriting keys on
	 * post ID, so those rows all collapse to the same stats URL — we track
	 * emitted URLs per item and drop repeats so the feed carries exactly one.
	 *
	 * @param string $enclosure Generated enclosure markup.
	 * @return string
	 */
	public static function rewrite_enclosure( $enclosure ) {
		global $post;

		if ( ! preg_match( '/url="([^"]*)"/i', $enclosure, $match ) ) {
			return $enclosure;
		}

		$original_url = $match[1];
		$final_url    = $original_url;
		$post_obj     = $post instanceof WP_Post ? $post : null;

		/**
		 * Whether to rewrite the enclosure through the WPCOM stats endpoint.
		 * Token-gated feeds (notably WPCOM's `private-podcasts.php`) opt out
		 * — the stats URL is a deterministic public endpoint that would
		 * bypass any token gating on the feed itself.
		 *
		 * @param bool         $enable Default true.
		 * @param WP_Post|null $post   The post being rendered.
		 */
		$enable = (bool) apply_filters( 'wpcom_podcasting_enable_play_tracking', true, $post_obj );

		// Skip rewrite for externally hosted enclosures — the stats endpoint 404s anything that isn't a local attachment.
		$attachment_id = attachment_url_to_postid( $original_url );

		if ( null !== $post_obj && $enable && $attachment_id > 0 ) {
			// `null` when the site isn't connected; passed through so the filter can still inject a value.
			$default_blog_id = Connection_Manager::get_site_id( true );

			/**
			 * Override the blog ID baked into the stats URL.
			 *
			 * @param int|null $blog_id Default Jetpack connection site ID, or null when unavailable.
			 * @param WP_Post  $post    The post being rendered.
			 */
			$blog_id = (int) apply_filters( 'wpcom_podcasting_tracked_blog_id', $default_blog_id, $post_obj );

			// Bail when we can't resolve a real blog ID — emit the original URL rather than a guaranteed-404 stats URL.
			if ( $blog_id > 0 ) {
				$final_url = esc_url( self::build_stats_url( $blog_id, (int) $post_obj->ID, $original_url ) );
				$enclosure = preg_replace_callback(
					'/url="[^"]*"/i',
					/**
					 * Replace the matched `url="…"` attribute with the stats URL.
					 * `$matches` is required by `preg_replace_callback`'s callable
					 * signature but ignored — we always emit the same value.
					 *
					 * @param array $matches Regex matches.
					 * @return string
					 */
					static function ( array $matches ) use ( $final_url ) {
						unset( $matches );
						return 'url="' . $final_url . '"';
					},
					$enclosure,
					1
				);
			}
		}

		// Drop repeats: rows keyed per post, by final URL, so distinct enclosures
		// survive while the duplicate stats URLs collapse to one. Registry is
		// cleared per render — see `reset_enclosure_dedup()`.
		$post_id = null !== $post_obj ? (int) $post_obj->ID : 0;
		if ( isset( self::$seen_enclosures[ $post_id ][ $final_url ] ) ) {
			return '';
		}
		self::$seen_enclosures[ $post_id ][ $final_url ] = true;

		if ( 0 === $attachment_id ) {
			return $enclosure;
		}

		$metadata = wp_get_attachment_metadata( $attachment_id );
		$duration = is_array( $metadata ) ? absint( $metadata['length'] ?? 0 ) : 0;

		return 0 === $duration
			? $enclosure
			: $enclosure . '<itunes:duration>' . $duration . "</itunes:duration>\n";
	}

	/**
	 * Clear the per-render enclosure dedup registry. Hooked on `rss2_head` (at
	 * priority 0, before any item renders) so re-generating a feed within a
	 * single long-lived process — WP-CLI, a warm worker — starts fresh instead
	 * of dropping every enclosure as already-seen.
	 */
	public static function reset_enclosure_dedup() {
		self::$seen_enclosures = array();
	}

	/**
	 * A podcast item without an enclosure is invalid per Apple's spec and can
	 * take down the whole submission. The `enclosure` post meta is what
	 * `rss_enclosure()` reads, so it's the authoritative signal here too.
	 *
	 * @param WP_Post[] $posts Posts about to be looped over.
	 * @param \WP_Query $query Query that produced them.
	 * @return WP_Post[]
	 */
	public static function filter_posts_with_enclosure( $posts, $query ) {
		if ( ! $query->is_main_query() || ! $query->is_feed() || ! $query->is_category() ) {
			return $posts;
		}
		$category_id = self::resolve_category_id();
		if ( 0 === $category_id ) {
			return $posts;
		}
		$queried = $query->get_queried_object();
		if ( ! $queried || ! isset( $queried->term_id ) || (int) $queried->term_id !== $category_id ) {
			return $posts;
		}
		return array_values(
			array_filter(
				$posts,
				static function ( $post ) {
					return $post instanceof WP_Post
						&& ! empty( get_post_meta( $post->ID, 'enclosure', false ) );
				}
			)
		);
	}

	/**
	 * Stored explicit value, normalized to the `'true'`/`'false'` strings the
	 * iTunes spec requires. Reuses `Settings::sanitize_explicit`
	 * so legacy `'yes'`/`'no'`/`'clean'` and modern boolean storage both work.
	 *
	 * @return string
	 */
	public static function explicit_string(): string {
		return Settings::sanitize_explicit( get_option( 'podcasting_explicit', false ) ) ? 'true' : 'false';
	}

	/**
	 * Show-level cover image URL — `Settings::raw_show_image_url()` routed
	 * through Photon at 3000×3000 when available.
	 *
	 * @return string
	 */
	private static function show_image_url(): string {
		$url = Settings::raw_show_image_url();
		return '' === $url ? '' : self::maybe_photon( $url );
	}

	/**
	 * Build the WPCOM stats URL for a given episode. The endpoint redirects
	 * to the audio file after recording the play — the package never serves
	 * it, only points at it. Audio extensions outside the recognized set
	 * fall back to `mp3` to keep the URL shape uniform (matches the Podtrac
	 * / Megaphone / Art19 convention).
	 *
	 * @param int    $blog_id      WPCOM blog ID (Atomic should override via the
	 *                             `wpcom_podcasting_tracked_blog_id` filter).
	 * @param int    $post_id      Episode post ID.
	 * @param string $original_url Original enclosure URL — extension is pulled from here.
	 * @return string
	 */
	private static function build_stats_url( int $blog_id, int $post_id, string $original_url ): string {
		$path = (string) wp_parse_url( $original_url, PHP_URL_PATH );
		$ext  = (string) preg_replace( '/[^a-z0-9]/', '', strtolower( (string) pathinfo( $path, PATHINFO_EXTENSION ) ) );
		if ( ! in_array( $ext, array( 'mp3', 'm4a', 'm4b', 'aac', 'ogg', 'oga', 'opus', 'wav', 'flac', 'mp4', 'm4v', 'mov' ), true ) ) {
			$ext = 'mp3';
		}
		return sprintf(
			'https://public-api.wordpress.com/wpcom/v2/sites/%d/podcast-play/%d.%s',
			$blog_id,
			$post_id,
			$ext
		);
	}

	/**
	 * Resolve the configured podcast category ID. Prefers the numeric
	 * `podcasting_category_id`, falling back to a slug lookup against the
	 * legacy `podcasting_archive` option — older sites pre-date numeric
	 * storage and only have the slug. Returns 0 when neither resolves.
	 *
	 * A numeric ID whose term was deleted means "not configured" — the slug
	 * is not consulted in that case.
	 *
	 * @return int
	 */
	public static function resolve_category_id(): int {
		$category_id = (int) get_option( 'podcasting_category_id', 0 );
		if ( $category_id > 0 ) {
			$category = get_category( $category_id );
			return ( $category && ! is_wp_error( $category ) && isset( $category->term_id ) ) ? (int) $category->term_id : 0;
		}

		$slug = (string) get_option( 'podcasting_archive', '' );
		if ( '' === $slug ) {
			return 0;
		}

		$term = get_term_by( 'slug', $slug, 'category' );
		return ( $term && ! is_wp_error( $term ) && isset( $term->term_id ) ) ? (int) $term->term_id : 0;
	}

	/**
	 * Episode-level image URL — the post's featured image, Photon-resized,
	 * or `''` when no featured image is set. Used as the fallback per-item
	 * cover when the block doesn't supply its own.
	 *
	 * @param int $post_id Episode post ID.
	 * @return string
	 */
	private static function episode_image_url( int $post_id ): string {
		if ( ! has_post_thumbnail( $post_id ) ) {
			return '';
		}
		$src = wp_get_attachment_image_src( get_post_thumbnail_id( $post_id ), 'full' );
		if ( ! is_array( $src ) || empty( $src[0] ) ) {
			return '';
		}
		return self::maybe_photon( $src[0] );
	}

	/**
	 * Route through Photon at exactly 3000×3000 so the feed always serves a
	 * square cover, regardless of the source aspect ratio. `resize` center-crops
	 * (unlike `fit`, which only constrains within the box); Apple's spec wants
	 * 1400–3000 px square art and rejects non-square covers.
	 *
	 * @param string $url Image URL.
	 * @return string
	 */
	public static function maybe_photon( string $url ): string {
		if ( ! function_exists( 'jetpack_photon_url' ) ) {
			return $url;
		}
		// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by Jetpack's Photon module at runtime; guarded by `function_exists` above.
		return (string) jetpack_photon_url( $url, array( 'resize' => '3000,3000' ), 'https' );
	}

	/**
	 * Build a single `<itunes:category>` tag from a stored option value. The
	 * stored format is one of:
	 *   - `''` (no category)
	 *   - `'Foo'` → single category
	 *   - `'Foo,Bar'` → category Foo with subcategory Bar
	 *
	 * Includes a back-compat translation pass for a few legacy values that were
	 * stored in non-canonical shapes before validation tightened.
	 *
	 * @param string $stored Raw option value.
	 * @return string Empty string if no category, otherwise an XML fragment.
	 */
	public static function category_tag( string $stored ): string {
		static $legacy_aliases = array(
			'Education,Education'                => 'Education',
			'Education,Education Technology'     => 'Education,Educational Technology',
			'Tech News'                          => 'Technology,Tech News',
			'Sports &amp; Recreation,Technology' => 'Technology',
			'Sports &amp; Recreation,Gadgets'    => 'Technology,Gadgets',
			'Sports,Football'                    => 'Sports,American Football',
			'Sports,Soccer'                      => 'Sports,Football (Soccer)',
		);
		$category              = $legacy_aliases[ $stored ] ?? $stored;

		if ( '' === $category ) {
			return '';
		}

		// `ent2ncr()` normalises named HTML entities (e.g. `&nbsp;`, `&copy;`) into
		// numeric character references so an attribute value containing them stays
		// well-formed XML after esc_attr().
		$splits = explode( ',', $category );
		if ( 2 === count( $splits ) ) {
			return '<itunes:category text="' . ent2ncr( esc_attr( $splits[0] ) ) . '">' . "\n"
				. "\t" . '<itunes:category text="' . ent2ncr( esc_attr( $splits[1] ) ) . '" />' . "\n"
				. "</itunes:category>\n";
		}
		return '<itunes:category text="' . ent2ncr( esc_attr( $category ) ) . '" />' . "\n";
	}
}
