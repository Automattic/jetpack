<?php
/**
 * Podcast Post Settings.
 *
 * Adds a Jetpack Podcast sidebar to the post editor for setting per-post
 * podcast/episode metadata, and pushes those values into the RSS feed using
 * the iTunes namespace so the existing feed picks them up.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Post_Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const FEATURE_NAME = 'podcast-post-settings';

const META_AUDIO_URL       = '_jetpack_podcast_audio_url';
const META_AUDIO_MIME      = '_jetpack_podcast_audio_mime';
const META_AUDIO_SIZE      = '_jetpack_podcast_audio_size';
const META_DURATION        = '_jetpack_podcast_duration';
const META_EPISODE_TITLE   = '_jetpack_podcast_episode_title';
const META_EPISODE_SUMMARY = '_jetpack_podcast_episode_summary';
const META_EPISODE_NUMBER  = '_jetpack_podcast_episode_number';
const META_SEASON_NUMBER   = '_jetpack_podcast_season_number';
const META_EPISODE_TYPE    = '_jetpack_podcast_episode_type';
const META_EXPLICIT        = '_jetpack_podcast_explicit';
const META_BLOCK           = '_jetpack_podcast_block';

/**
 * Returns the post meta keys we register and sync.
 *
 * @return array<string, array{type: string, default?: mixed}>
 */
function get_meta_keys() {
	return array(
		META_AUDIO_URL       => array( 'type' => 'string' ),
		META_AUDIO_MIME      => array( 'type' => 'string' ),
		META_AUDIO_SIZE      => array(
			'type'    => 'integer',
			'default' => 0,
		),
		META_DURATION        => array( 'type' => 'string' ),
		META_EPISODE_TITLE   => array( 'type' => 'string' ),
		META_EPISODE_SUMMARY => array( 'type' => 'string' ),
		META_EPISODE_NUMBER  => array(
			'type'    => 'integer',
			'default' => 0,
		),
		META_SEASON_NUMBER   => array(
			'type'    => 'integer',
			'default' => 0,
		),
		META_EPISODE_TYPE    => array( 'type' => 'string' ),
		META_EXPLICIT        => array( 'type' => 'string' ),
		META_BLOCK           => array(
			'type'    => 'boolean',
			'default' => false,
		),
	);
}

/**
 * Register post meta fields with REST support so the editor sidebar can read/write them.
 */
function register_post_meta_fields() {
	$auth_callback = function () {
		return current_user_can( 'edit_posts' );
	};

	foreach ( get_meta_keys() as $meta_key => $args ) {
		$config = array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => $args['type'],
			'auth_callback' => $auth_callback,
		);
		if ( array_key_exists( 'default', $args ) ) {
			$config['default'] = $args['default'];
		}
		register_post_meta( 'post', $meta_key, $config );
	}
}
add_action( 'init', __NAMESPACE__ . '\register_post_meta_fields' );

/**
 * Sync the podcast post meta to WordPress.com so the WPCOM-side podcast feed
 * generator can read the same values.
 *
 * @param array $allowed_meta Existing whitelist.
 * @return array
 */
function sync_meta_whitelist( $allowed_meta ) {
	return array_merge( (array) $allowed_meta, array_keys( get_meta_keys() ) );
}
add_filter( 'jetpack_sync_post_meta_whitelist', __NAMESPACE__ . '\sync_meta_whitelist' );

/**
 * Add the iTunes and Podcast namespace declarations to the RSS2 root tag so
 * the per-item tags below validate.
 */
function rss2_namespaces() {
	echo 'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" ';
	echo 'xmlns:podcast="https://podcastindex.org/namespace/1.0"';
}
add_action( 'rss2_ns', __NAMESPACE__ . '\rss2_namespaces' );

/**
 * Inject the configured iTunes tags into each post's RSS item, when the post
 * has an audio URL. The site-wide podcast feed (configured via the
 * `podcasting_archive` option / WPCOM podcasting feature) will surface these
 * tags to subscribers.
 */
function rss2_item_tags() {
	$post_id = get_the_ID();
	if ( ! $post_id ) {
		return;
	}

	$audio_url = get_post_meta( $post_id, META_AUDIO_URL, true );
	if ( empty( $audio_url ) ) {
		return;
	}

	$mime     = get_post_meta( $post_id, META_AUDIO_MIME, true );
	$size     = (int) get_post_meta( $post_id, META_AUDIO_SIZE, true );
	$duration = get_post_meta( $post_id, META_DURATION, true );
	$title    = get_post_meta( $post_id, META_EPISODE_TITLE, true );
	$summary  = get_post_meta( $post_id, META_EPISODE_SUMMARY, true );
	$episode  = (int) get_post_meta( $post_id, META_EPISODE_NUMBER, true );
	$season   = (int) get_post_meta( $post_id, META_SEASON_NUMBER, true );
	$type     = get_post_meta( $post_id, META_EPISODE_TYPE, true );
	$explicit = get_post_meta( $post_id, META_EXPLICIT, true );
	$block    = (bool) get_post_meta( $post_id, META_BLOCK, true );

	printf(
		"\t\t<enclosure url=\"%s\" length=\"%s\" type=\"%s\" />\n",
		esc_url( $audio_url ),
		esc_attr( $size > 0 ? (string) $size : '0' ),
		esc_attr( ! empty( $mime ) ? $mime : 'audio/mpeg' )
	);

	if ( ! empty( $title ) ) {
		printf( "\t\t<itunes:title>%s</itunes:title>\n", esc_html( $title ) );
	}
	if ( ! empty( $summary ) ) {
		printf( "\t\t<itunes:summary>%s</itunes:summary>\n", esc_html( $summary ) );
	}
	if ( ! empty( $duration ) ) {
		printf( "\t\t<itunes:duration>%s</itunes:duration>\n", esc_html( $duration ) );
	}
	if ( $episode > 0 ) {
		printf( "\t\t<itunes:episode>%s</itunes:episode>\n", esc_html( (string) $episode ) );
	}
	if ( $season > 0 ) {
		printf( "\t\t<itunes:season>%s</itunes:season>\n", esc_html( (string) $season ) );
	}
	if ( ! empty( $type ) ) {
		printf( "\t\t<itunes:episodeType>%s</itunes:episodeType>\n", esc_attr( $type ) );
	}
	if ( ! empty( $explicit ) ) {
		printf( "\t\t<itunes:explicit>%s</itunes:explicit>\n", esc_attr( $explicit ) );
	}
	if ( $block ) {
		echo "\t\t<itunes:block>Yes</itunes:block>\n";
	}
}
add_action( 'rss2_item', __NAMESPACE__ . '\rss2_item_tags' );

// Register the extension as available to the block editor.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge( (array) $extensions, array( FEATURE_NAME ) );
	}
);

add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
