<?php
/**
 * Appends a "Made with Jetpack Podcast" credit to the podcast feed of sites
 * without podcast plan access.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Automattic\Jetpack\Podcast\Podcast_Gate;

/**
 * Hook the credit once the podcast package has claimed this request as the
 * podcast feed. Runs after the package's own `wp` callback.
 */
function wpcom_podcast_feed_credit_maybe_hook() {
	if ( ! class_exists( Customize_Feed::class ) || ! has_action( 'rss2_head', array( Customize_Feed::class, 'output_channel_tags' ) ) ) {
		return;
	}
	if ( Podcast_Gate::has_product_access() ) {
		return;
	}
	// The package reads the channel summary through `get_option()`, so both
	// `<description>` and `<itunes:summary>` pick the credit up here.
	add_filter( 'option_podcasting_summary', 'wpcom_podcast_feed_credit_append_to_summary' );
	add_filter( 'default_option_podcasting_summary', 'wpcom_podcast_feed_credit_append_to_summary' );
	// Just below the package's `capture_item_summary()` at PHP_INT_MAX, so the
	// item `<description>` and the `<itunes:summary>` built from it agree.
	add_filter( 'the_excerpt_rss', 'wpcom_podcast_feed_credit_append_to_excerpt', PHP_INT_MAX - 1 );
	add_filter( 'the_content_feed', 'wpcom_podcast_feed_credit_append_to_content' );
}
add_action( 'wp', 'wpcom_podcast_feed_credit_maybe_hook', 11 );

/**
 * Append a credit line to plain text after a blank line.
 *
 * @param string $text   Plain text.
 * @param string $credit Credit line.
 * @return string
 */
function wpcom_podcast_feed_credit_append( string $text, string $credit ): string {
	$text = rtrim( $text );
	return '' === $text ? $credit : $text . "\n\n" . $credit;
}

/**
 * `option_podcasting_summary` filter: append the credit to the channel summary.
 *
 * @param mixed $summary Option value.
 * @return string
 */
function wpcom_podcast_feed_credit_append_to_summary( $summary ) {
	return wpcom_podcast_feed_credit_append( (string) $summary, wpcom_podcast_feed_credit_text() );
}

/**
 * `the_excerpt_rss` filter: append the credit to the episode `<description>`.
 * The template wraps it in CDATA, so `]]>` gets the escape core gives
 * generated excerpts.
 *
 * @param string $excerpt Item excerpt.
 * @return string
 */
function wpcom_podcast_feed_credit_append_to_excerpt( $excerpt ) {
	return wpcom_podcast_feed_credit_append( (string) $excerpt, str_replace( ']]>', ']]&gt;', wpcom_podcast_feed_credit_text() ) );
}

/**
 * `the_content_feed` filter: append the linked credit to `<content:encoded>`.
 * Empty content stays empty so core falls back to the excerpt, which already
 * carries the credit.
 *
 * @param string $content Item content.
 * @return string
 */
function wpcom_podcast_feed_credit_append_to_content( $content ) {
	if ( '' === (string) $content ) {
		return $content;
	}
	$site_url = home_url( '/' );
	$credit   = sprintf(
		/* translators: 1: podcast title, 2: HTML link to "Jetpack Podcast", 3: HTML link to site URL */
		esc_html__( '%1$s is made with %2$s. Full show notes and every episode at %3$s', 'jetpack-mu-wpcom' ),
		esc_html( wpcom_podcast_feed_credit_show_title() ),
		'<a href="https://wordpress.com/podcast/">Jetpack Podcast</a>',
		'<a href="' . esc_url( $site_url ) . '">' . esc_html( $site_url ) . '</a>'
	);
	return (string) $content . "\n<p>" . $credit . '</p>';
}

/**
 * Plain-text credit, for `<description>` and `<itunes:summary>`.
 *
 * @return string
 */
function wpcom_podcast_feed_credit_text(): string {
	return sprintf(
		/* translators: 1: podcast title, 2: "Jetpack Podcast", 3: site URL */
		__( '%1$s is made with %2$s. Full show notes and every episode at %3$s', 'jetpack-mu-wpcom' ),
		wpcom_podcast_feed_credit_show_title(),
		'Jetpack Podcast',
		home_url( '/' )
	);
}

/**
 * The show title for the credit: `podcasting_title`, else the site name, else
 * the site's host so the sentence always has a subject.
 *
 * @return string
 */
function wpcom_podcast_feed_credit_show_title(): string {
	foreach ( array( get_option( 'podcasting_title', '' ), get_bloginfo( 'name' ) ) as $candidate ) {
		$candidate = trim( wp_strip_all_tags( (string) $candidate ) );
		if ( '' !== $candidate ) {
			return $candidate;
		}
	}
	return (string) wp_parse_url( home_url(), PHP_URL_HOST );
}
