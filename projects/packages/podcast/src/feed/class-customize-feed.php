<?php
/**
 * Adds podcast tags + tracked enclosure URLs to the RSS feed for the
 * configured podcast category.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

use Automattic\Jetpack\Podcast\Settings;
use WP_Post;

/**
 * Hooks into RSS2 rendering when the current request is the podcast category
 * feed, adding `<itunes:*>` / `<googleplay:*>` tags at channel and item level
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
	 * Wire the late-binding `wp` action that decides whether to register the
	 * feed-modification hooks for this request. Idempotent.
	 */
	public static function init() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_action( 'wp', array( __CLASS__, 'maybe_register_feed_hooks' ) );
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

		add_action( 'rss2_ns', array( __CLASS__, 'output_namespaces' ) );
		add_filter( 'wp_title_rss', array( __CLASS__, 'feed_title' ) );
		add_filter( 'bloginfo_rss', array( __CLASS__, 'feed_description' ), 10, 2 );
		add_action( 'rss2_head', array( __CLASS__, 'output_channel_tags' ) );
		add_action( 'rss2_item', array( __CLASS__, 'output_item_tags' ) );
		add_filter( 'rss_enclosure', array( __CLASS__, 'rewrite_enclosure' ) );
		add_filter( 'the_excerpt_rss', array( __CLASS__, 'pass_through_empty_excerpt' ), 1000 );

		Feed_Detection::detect_and_record();
	}

	/**
	 * Add iTunes + Google Play XML namespaces to the `<rss>` open tag.
	 */
	public static function output_namespaces() {
		echo "\n\t" . 'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"' . "\n";
		echo "\t" . 'xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0"' . "\n";
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
			return $override;
		}

		$category = get_category( self::resolve_category_id() );
		if ( $category && ! is_wp_error( $category ) ) {
			return get_bloginfo( 'name' ) . ' &#187; ' . $category->name;
		}
		return $title;
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
		return esc_html( wp_strip_all_tags( (string) get_option( 'podcasting_summary', '' ) ) );
	}

	/**
	 * Channel-level podcast tags (rss2_head).
	 */
	public static function output_channel_tags() {
		/**
		 * Show summary
		 */
		$summary = (string) get_option( 'podcasting_summary', '' );
		if ( '' !== $summary ) {
			echo '<itunes:summary>' . esc_html( wp_strip_all_tags( $summary ) ) . "</itunes:summary>\n";
			echo '<googleplay:description>' . esc_html( wp_strip_all_tags( $summary ) ) . "</googleplay:description>\n";
		}

		/**
		 * Show author / talent name
		 */
		$author = (string) get_option( 'podcasting_talent_name', '' );
		if ( '' !== $author ) {
			echo '<itunes:author>' . esc_html( wp_strip_all_tags( $author ) ) . "</itunes:author>\n";
			echo '<googleplay:author>' . esc_html( wp_strip_all_tags( $author ) ) . "</googleplay:author>\n";
		}

		/**
		 * Owner contact email
		 */
		$email = wp_strip_all_tags( (string) get_option( 'podcasting_email', '' ) );
		if ( '' !== $email ) {
			echo '<itunes:owner><itunes:email>' . esc_html( $email ) . "</itunes:email></itunes:owner>\n";
			echo '<googleplay:owner>' . esc_html( $email ) . "</googleplay:owner>\n";
			echo '<googleplay:email>' . esc_html( $email ) . "</googleplay:email>\n";
		}

		/**
		 * Copyright notice
		 */
		$copyright = (string) get_option( 'podcasting_copyright', '' );
		if ( '' !== $copyright ) {
			echo '<copyright>' . esc_html( wp_strip_all_tags( $copyright ) ) . "</copyright>\n";
		}

		/**
		 * Explicit content flag
		 */
		$explicit = self::explicit_string();
		echo '<itunes:explicit>' . esc_html( $explicit ) . "</itunes:explicit>\n";
		echo '<googleplay:explicit>' . esc_html( $explicit ) . "</googleplay:explicit>\n";

		/**
		 * Show cover art
		 */
		$image = self::show_image_url();
		if ( '' !== $image ) {
			echo "<itunes:image href='" . esc_url( $image ) . "' />\n";
			echo "<googleplay:image href='" . esc_url( $image ) . "' />\n";
		}

		/**
		 * Categories (up to 3 itunes:category tags)
		 */
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
			echo '<itunes:author>' . esc_html( wp_strip_all_tags( $author ) ) . "</itunes:author>\n";
			echo '<googleplay:author>' . esc_html( wp_strip_all_tags( $author ) ) . "</googleplay:author>\n";
		}

		// Per Apple / Google Play spec, the channel-level `<itunes:explicit>`
		// applies to every item by default. We don't store a per-episode
		// override, so emitting it here would just be redundant XML.

		$episode_image = self::episode_image_url( $post->ID );
		if ( '' !== $episode_image ) {
			echo "<itunes:image href='" . esc_url( $episode_image ) . "' />\n";
			echo "<googleplay:image href='" . esc_url( $episode_image ) . "' />\n";
		}

		// Re-applying `the_excerpt_rss` here is intentional: `get_the_excerpt()`
		// doesn't run the filter chain itself, so this gets the same trimmed +
		// `pass_through_empty_excerpt`-suppressed value WP would emit in the
		// item's `<description>`.
		$excerpt = (string) apply_filters( 'the_excerpt_rss', get_the_excerpt() );
		if ( '' !== $excerpt ) {
			echo '<itunes:summary>' . esc_html( wp_strip_all_tags( $excerpt ) ) . "</itunes:summary>\n";
			echo '<googleplay:description>' . esc_html( wp_strip_all_tags( $excerpt ) ) . "</googleplay:description>\n";
		}
	}

	/**
	 * Rewrite the enclosure URL through the WPCOM stats endpoint and append
	 * `<itunes:duration>` when resolvable. Duration is looked up against the
	 * *original* attachment URL — the stats URL is synthetic.
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

		if ( null !== $post_obj && $enable ) {
			/**
			 * Override the blog ID baked into the stats URL. Atomic / non-Simple
			 * sites should return the WPCOM shadow ID so the public-api endpoint
			 * routes to the right blog.
			 *
			 * @param int     $blog_id Default current blog ID.
			 * @param WP_Post $post    The post being rendered.
			 */
			$blog_id   = (int) apply_filters( 'wpcom_podcasting_tracked_blog_id', get_current_blog_id(), $post_obj );
			$stats_url = self::build_stats_url( $blog_id, (int) $post_obj->ID, $original_url );
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
				static function ( array $matches ) use ( $stats_url ) {
					unset( $matches );
					return 'url="' . esc_url( $stats_url ) . '"';
				},
				$enclosure,
				1
			);
		}

		$attachment_id = attachment_url_to_postid( $original_url );
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
	 * Suppress the auto-generated excerpt fallback when the post itself has
	 * none. WP's default behavior is to derive an excerpt from `post_content`
	 * via `wp_trim_excerpt`, which produces noise in the podcast feed; users
	 * expect empty when they didn't write one.
	 *
	 * Inspect `$post->post_excerpt` directly — `get_the_excerpt()` would have
	 * already run the auto-generation chain by the time we ask, so it's never
	 * `''` for any post that has content.
	 *
	 * @param string $output Existing excerpt.
	 * @return string
	 */
	public static function pass_through_empty_excerpt( $output ) {
		global $post;
		if ( $post instanceof WP_Post && '' === trim( (string) $post->post_excerpt ) ) {
			return '';
		}
		return $output;
	}

	/**
	 * Stored explicit value, normalized to the `'true'`/`'false'` strings the
	 * iTunes / Google Play specs require. Reuses `Settings::sanitize_explicit`
	 * so legacy `'yes'`/`'no'`/`'clean'` and modern boolean storage both work.
	 *
	 * @return string
	 */
	public static function explicit_string(): string {
		return Settings::sanitize_explicit( get_option( 'podcasting_explicit', false ) ) ? 'true' : 'false';
	}

	/**
	 * Show-level cover image URL. Prefers `podcasting_image_id` (resolves to
	 * an attachment URL) when it points at an actual image attachment, falls
	 * back to the raw `podcasting_image` URL. Routes through Photon at
	 * 3000×3000 when available.
	 *
	 * @return string
	 */
	private static function show_image_url(): string {
		$image_id = (int) get_option( 'podcasting_image_id', 0 );
		if ( $image_id > 0 && wp_attachment_is_image( $image_id ) ) {
			$url = wp_get_attachment_url( $image_id );
			if ( false !== $url ) {
				return self::maybe_photon( $url );
			}
		}
		$url = (string) get_option( 'podcasting_image', '' );
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
	 * Mirrors `Automattic_Podcasting::podcasting_get_podcasting_category_id`
	 * in the wpcom mu-plugin.
	 *
	 * @return int
	 */
	public static function resolve_category_id(): int {
		$category_id = (int) get_option( 'podcasting_category_id', 0 );
		if ( $category_id > 0 ) {
			return $category_id;
		}

		$slug = (string) get_option( 'podcasting_archive', '' );
		if ( '' === $slug ) {
			return 0;
		}

		$term = get_term_by( 'slug', $slug, 'category' );
		return ( $term && ! is_wp_error( $term ) && isset( $term->term_id ) ) ? (int) $term->term_id : 0;
	}

	/**
	 * Episode-level image URL — the post's featured image, or `''` if none.
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
	 * Route through Photon at 3000×3000 if Jetpack Photon is available; pass
	 * through unchanged otherwise. Apple's spec wants 1400–3000px square art.
	 *
	 * @param string $url Image URL.
	 * @return string
	 */
	private static function maybe_photon( string $url ): string {
		if ( ! function_exists( 'jetpack_photon_url' ) ) {
			return $url;
		}
		// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by Jetpack's Photon module at runtime; guarded by `function_exists` above.
		return (string) jetpack_photon_url( $url, array( 'fit' => '3000,3000' ), 'https' );
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
		);
		$category              = $legacy_aliases[ $stored ] ?? $stored;

		if ( '' === $category ) {
			return '';
		}

		$splits = explode( ',', $category );
		if ( 2 === count( $splits ) ) {
			return "<itunes:category text='" . esc_attr( $splits[0] ) . "'>\n"
				. "\t<itunes:category text='" . esc_attr( $splits[1] ) . "' />\n"
				. "</itunes:category>\n";
		}
		return "<itunes:category text='" . esc_attr( $category ) . "' />\n";
	}
}
