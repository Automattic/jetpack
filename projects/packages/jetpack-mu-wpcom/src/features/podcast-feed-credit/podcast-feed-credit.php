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
 * podcast feed. The package registers on `wp` at priority 10, so this runs at 11.
 */
function wpcom_podcast_feed_credit_maybe_hook() {
	if ( ! has_action( 'rss2_head', array( Customize_Feed::class, 'output_channel_tags' ) ) ) {
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
 * `option_podcasting_summary` filter: append the credit to the channel summary.
 *
 * @param mixed $summary Option value.
 * @return string
 */
function wpcom_podcast_feed_credit_append_to_summary( $summary ) {
	$summary = rtrim( (string) $summary );
	return '' === $summary ? wpcom_podcast_feed_credit_text() : $summary . "\n\n" . wpcom_podcast_feed_credit_text();
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
	$excerpt = rtrim( (string) $excerpt );
	$credit  = str_replace( ']]>', ']]&gt;', wpcom_podcast_feed_credit_text() );
	return '' === $excerpt ? $credit : $excerpt . "\n\n" . $credit;
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
	$title    = wpcom_podcast_feed_credit_show_title();
	$product  = '<a href="https://wordpress.com/podcast/">Jetpack Podcast</a>';
	$link     = '<a href="' . esc_url( $site_url ) . '">' . esc_html( $site_url ) . '</a>';

	if ( '' === $title ) {
		$credit = sprintf(
			/* translators: 1: HTML link to "Jetpack Podcast", 2: HTML link to site URL */
			esc_html__( 'This podcast is made with %1$s. Full show notes and every episode at %2$s', 'jetpack-mu-wpcom' ),
			$product,
			$link
		);
	} else {
		$credit = sprintf(
			/* translators: 1: podcast title, 2: HTML link to "Jetpack Podcast", 3: HTML link to site URL */
			esc_html__( '%1$s is made with %2$s. Full show notes and every episode at %3$s', 'jetpack-mu-wpcom' ),
			esc_html( $title ),
			$product,
			$link
		);
	}
	return (string) $content . "\n<p>" . $credit . '</p>';
}

/**
 * Plain-text credit, for `<description>` and `<itunes:summary>`.
 *
 * @return string
 */
function wpcom_podcast_feed_credit_text(): string {
	$title = wpcom_podcast_feed_credit_show_title();

	if ( '' === $title ) {
		return sprintf(
			/* translators: 1: "Jetpack Podcast", 2: site URL */
			__( 'This podcast is made with %1$s. Full show notes and every episode at %2$s', 'jetpack-mu-wpcom' ),
			'Jetpack Podcast',
			home_url( '/' )
		);
	}

	return sprintf(
		/* translators: 1: podcast title, 2: "Jetpack Podcast", 3: site URL */
		__( '%1$s is made with %2$s. Full show notes and every episode at %3$s', 'jetpack-mu-wpcom' ),
		$title,
		'Jetpack Podcast',
		home_url( '/' )
	);
}

/**
 * The show title for the credit: `podcasting_title`, else the site name.
 * A site name that is just the site's slug or host is no title at all, so
 * it yields '' and the credit goes subjectless rather than reading
 * "example78687615498 is made with".
 *
 * @return string '' when there is nothing worth calling the show.
 */
function wpcom_podcast_feed_credit_show_title(): string {
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	$slug = strstr( $host, '.', true );
	$junk = array_filter( array( $host, false === $slug ? '' : $slug ) );

	foreach ( array( get_option( 'podcasting_title', '' ), get_bloginfo( 'name' ) ) as $candidate ) {
		$candidate = trim( wp_strip_all_tags( (string) $candidate ) );
		if ( '' !== $candidate && ! in_array( strtolower( $candidate ), $junk, true ) ) {
			return $candidate;
		}
	}
	return '';
}
