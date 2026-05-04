<?php
/**
 * RSS feed customization for Jetpack Podcast.
 *
 * Injects iTunes / Google Play namespaces, channel-level metadata, and per-item
 * tags into the standard category RSS2 feed. Loaded only when the configured
 * podcast category feed is being served.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Feed;

use Automattic\Jetpack\Podcast\Podcast;

/**
 * Hooks RSS2 feed filters/actions to produce a podcast-friendly feed.
 */
class Customize_Feed {

	/**
	 * Whether hooks have been registered.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Register hooks. Called from `Podcast::maybe_load_feed_customization()`
	 * once we've confirmed the current request is the podcast category feed.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Strip default RSS chrome that conflicts with iTunes/Google Play namespaces.
		remove_action( 'rss2_head', 'rss2_blavatar' );
		remove_action( 'rss2_head', 'rss2_site_icon' );
		remove_action( 'rss2_head', 'rsscloud_add_rss_cloud_element' );
		remove_filter( 'the_excerpt_rss', 'add_bug_to_feed', 100 );

		add_action( 'rss2_ns', array( __CLASS__, 'render_xmlns' ) );
		add_filter( 'wp_title_rss', array( __CLASS__, 'filter_feed_title' ) );
		add_filter( 'bloginfo_rss', array( __CLASS__, 'filter_feed_description' ), 10, 2 );
		add_action( 'rss2_head', array( __CLASS__, 'render_feed_head' ) );
		add_action( 'rss2_item', array( __CLASS__, 'render_feed_item' ) );
		add_filter( 'rss_enclosure', array( __CLASS__, 'filter_rss_enclosure' ) );
		add_filter( 'the_excerpt_rss', array( __CLASS__, 'filter_empty_rss_excerpt' ), 1000 );
	}

	/**
	 * Inject iTunes and Google Play XML namespaces into the rss2 root element.
	 */
	public static function render_xmlns() {
		echo "\n\t" . 'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"' . "\n";
		echo "\t" . 'xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0"' . "\n";
	}

	/**
	 * Use the configured podcast title (or fall back to "Site » Category").
	 *
	 * @param string $output Default title.
	 * @return string
	 */
	public static function filter_feed_title( $output ) {
		$title = get_option( 'podcasting_title' );
		if ( ! empty( $title ) ) {
			return $title;
		}

		$category_id = Podcast::get_category_id();
		if ( ! $category_id ) {
			return $output;
		}

		$category = get_category( $category_id );
		if ( ! $category ) {
			return $output;
		}

		return get_bloginfo( 'name' ) . ' &#187; ' . $category->name;
	}

	/**
	 * Override the RSS feed description with the podcast summary.
	 *
	 * @param string $value Default value.
	 * @param string $field Bloginfo field name.
	 * @return string
	 */
	public static function filter_feed_description( $value, $field ) {
		if ( 'description' !== $field ) {
			return $value;
		}
		return (string) get_option( 'podcasting_summary', '' );
	}

	/**
	 * Render channel-level iTunes / Google Play metadata.
	 */
	public static function render_feed_head() {
		$summary = get_option( 'podcasting_summary' );
		if ( ! empty( $summary ) ) {
			$summary = wp_strip_all_tags( $summary );
			echo '<itunes:summary>' . esc_html( $summary ) . "</itunes:summary>\n";
			echo '<googleplay:description>' . esc_html( $summary ) . "</googleplay:description>\n";
		}

		$author = get_option( 'podcasting_talent_name' );
		if ( ! empty( $author ) ) {
			$author = wp_strip_all_tags( $author );
			echo '<itunes:author>' . esc_html( $author ) . "</itunes:author>\n";
			echo '<googleplay:author>' . esc_html( $author ) . "</googleplay:author>\n";
		}

		$email = get_option( 'podcasting_email' );
		if ( ! empty( $email ) ) {
			$email = wp_strip_all_tags( $email );
			echo "<itunes:owner>\n";
			echo "\t<itunes:email>" . esc_html( $email ) . "</itunes:email>\n";
			echo "</itunes:owner>\n";
			echo '<googleplay:owner>' . esc_html( $email ) . "</googleplay:owner>\n";
			echo '<googleplay:email>' . esc_html( $email ) . "</googleplay:email>\n";
		}

		$copyright = get_option( 'podcasting_copyright' );
		if ( ! empty( $copyright ) ) {
			echo '<copyright>' . esc_html( wp_strip_all_tags( $copyright ) ) . "</copyright>\n";
		}

		// 'yes' is the only value that flips explicit to true; both 'no' and 'clean' are not-explicit.
		$explicit = 'yes' === get_option( 'podcasting_explicit', 'no' ) ? 'true' : 'false';
		echo '<itunes:explicit>' . esc_html( $explicit ) . "</itunes:explicit>\n";
		echo '<googleplay:explicit>' . esc_html( $explicit ) . "</googleplay:explicit>\n";

		$image = Podcast::get_image_url();
		if ( ! empty( $image ) ) {
			if ( function_exists( 'jetpack_photon_url' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only helper; guarded above.
				$image = jetpack_photon_url( $image, array( 'fit' => '3000,3000' ), 'https' );
			}
			echo "<itunes:image href='" . esc_url( $image ) . "' />\n";
			echo "<googleplay:image href='" . esc_url( $image ) . "' />\n";
		}

		foreach ( array( 'podcasting_category_1', 'podcasting_category_2', 'podcasting_category_3' ) as $option ) {
			$tag = self::generate_category_tag( $option );
			if ( ! empty( $tag ) ) {
				echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- generate_category_tag escapes its inputs.
			}
		}
	}

	/**
	 * Render per-episode iTunes / Google Play metadata inside the rss2 item.
	 */
	public static function render_feed_item() {
		global $post;

		$author = get_the_author();
		if ( empty( $author ) ) {
			$author = get_option( 'podcasting_talent_name' );
		}
		$author = wp_strip_all_tags( $author );
		echo '<itunes:author>' . esc_html( $author ) . "</itunes:author>\n";
		echo '<googleplay:author>' . esc_html( $author ) . "</googleplay:author>\n";

		$explicit = 'yes' === get_option( 'podcasting_explicit', 'no' ) ? 'true' : 'false';
		echo '<itunes:explicit>' . esc_html( $explicit ) . "</itunes:explicit>\n";
		echo '<googleplay:explicit>' . esc_html( $explicit ) . "</googleplay:explicit>\n";

		if ( $post && has_post_thumbnail( $post->ID ) ) {
			$image_src = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full' );
			if ( ! empty( $image_src ) && is_array( $image_src ) ) {
				$image = $image_src[0];
				if ( function_exists( 'jetpack_photon_url' ) ) {
					// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only helper; guarded above.
					$image = jetpack_photon_url( $image, array( 'fit' => '3000,3000' ), 'https' );
				}
				echo "<itunes:image href='" . esc_url( $image ) . "' />\n";
				echo "<googleplay:image href='" . esc_url( $image ) . "' />\n";
			}
		}

		$excerpt = apply_filters( 'the_excerpt_rss', get_the_excerpt() );
		$excerpt = wp_strip_all_tags( $excerpt );
		echo '<itunes:summary>' . esc_html( $excerpt ) . "</itunes:summary>\n";
		echo '<googleplay:description>' . esc_html( $excerpt ) . "</googleplay:description>\n";
	}

	/**
	 * Append `<itunes:duration>` to each RSS enclosure when attachment metadata is available.
	 *
	 * @param string $enclosure Default WP-rendered enclosure tag.
	 * @return string
	 */
	public static function filter_rss_enclosure( $enclosure ) {
		preg_match( '/url="([^"]*)"/i', $enclosure, $matches );
		if ( empty( $matches ) ) {
			return $enclosure;
		}

		$attachment_id = attachment_url_to_postid( $matches[1] );
		if ( 0 === $attachment_id ) {
			return $enclosure;
		}

		$metadata = wp_get_attachment_metadata( $attachment_id );
		$duration = absint( $metadata['length'] ?? 0 );
		if ( 0 === $duration ) {
			return $enclosure;
		}

		return $enclosure . '<itunes:duration>' . $duration . "</itunes:duration>\n";
	}

	/**
	 * Suppress the standard "[...]" placeholder when an episode has no excerpt.
	 *
	 * Hooked at priority 1000 so it runs after any other filter that may have inserted text.
	 *
	 * @param string $output Output from earlier filters.
	 * @return string
	 */
	public static function filter_empty_rss_excerpt( $output ) {
		$excerpt = get_the_excerpt();
		return empty( $excerpt ) ? '' : $output;
	}

	/**
	 * Convert a stored "Primary,Sub" category option into nested itunes:category tags.
	 *
	 * Includes a few legacy normalizations for category names that have changed in iTunes.
	 *
	 * @param string $option Option name (e.g. 'podcasting_category_1').
	 * @return string Rendered tag(s) or an empty string.
	 */
	private static function generate_category_tag( $option ) {
		$category = get_option( $option );
		if ( empty( $category ) ) {
			return '';
		}

		// Normalize a few legacy iTunes category names.
		$legacy_aliases = array(
			'Education,Education'                => 'Education',
			'Education,Education Technology'     => 'Education, Educational Technology',
			'Tech News'                          => 'Technology,Tech News',
			'Sports &amp; Recreation,Technology' => 'Technology',
			'Sports &amp; Recreation,Gadgets'    => 'Technology,Gadgets',
		);
		if ( isset( $legacy_aliases[ $category ] ) ) {
			$category = $legacy_aliases[ $category ];
		}

		$splits = explode( ',', $category );
		if ( 2 === count( $splits ) ) {
			$out  = "<itunes:category text='" . esc_attr( $splits[0] ) . "'>\n";
			$out .= "\t<itunes:category text='" . esc_attr( $splits[1] ) . "' />\n";
			$out .= "</itunes:category>\n";
			return $out;
		}

		return "<itunes:category text='" . esc_attr( $category ) . "' />\n";
	}
}
