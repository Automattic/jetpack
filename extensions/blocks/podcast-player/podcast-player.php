<?php
/**
 * Podcast Player Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Jetpack\Podcast_Episodes_Block;

use WP_Error;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'podcast-player';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;
const BLOG_SLUG    = 'jetpack-' . FEATURE_NAME;
/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'attributes'      => array(
				'url'         => array(
					'type' => 'url',
				),
				'itemsToShow' => array(
					'type'    => 'integer',
					'default' => 5,
				),
			),
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Podcast Player block registration/dependency declaration.
 *
 * @param array  $attributes Array containing the Podcast Player block attributes.
 * @param string $content    String containing the Podcast Player block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {

	if ( empty( $attributes['url'] ) ) {
		return;
	}

	$track_list = get_track_list( $attributes['url'], $attributes['itemsToShow'] );

	if ( is_wp_error( $track_list ) ) {
		return '<p>' . __( 'Unable to retrieve track list. Please check your Podcast feed URL.', 'jetpack' ) . '</p>';
	}

	return render_player( $track_list, $attributes );
}

/**
 * Renders the HTML for the Podcast player and tracklist.
 *
 * @param array $track_list the list of podcast tracks.
 * @param array $attributes Array containing the Podcast Player block attributes.
 * @return string the HTML for the podcast player.
 */
function render_player( $track_list, $attributes ) {
	global $content_width;

	$player_data = array(
		'type'         => 'audio',
		// Don't pass strings to JSON, will be truthy in JS.
		'tracklist'    => true,
		'tracknumbers' => true,
		'images'       => true,
		'artists'      => true,
		'tracks'       => $track_list,
	);

	$outer         = 22; // Default padding and border of wrapper.
	$default_width = 640;
	$theme_width   = empty( $content_width ) ? $default_width : ( $content_width - $outer );

	// If there are no tracks (it is possible) then display appropriate user facing error message.
	if ( empty( $track_list ) ) {
		return '<p>' . __( 'No tracks available to play.', 'jetpack' ) . '</p>';
	}

	ob_start();
	wp_playlist_scripts( 'audio' );
	/**
	 * Prints and enqueues playlist scripts, styles, and JavaScript templates.
	 *
	 * @since 3.9.0
	 *
	 * @param string $type  Type of playlist. Possible values are 'audio' or 'video'.
	 * @param string $style The 'theme' for the playlist. Core provides 'light' and 'dark'.
	 */
	do_action( 'wp_playlist_scripts', 'audio', 'light' );

	$initial_track_src = ! empty( $track_list[0]['src'] ) ? $track_list[0]['src'] : '';
	$css_class         = Jetpack_Gutenberg::block_classes( BLOG_SLUG, $attributes );

	?>
	<div class="wp-block-<?php echo esc_attr( $css_class ); ?> wp-playlist wp-audio-playlist wp-playlist-light">
		<div class="wp-playlist-current-item"></div>
		<audio src="<?php echo esc_attr( $initial_track_src ); ?>" controls="controls" preload="none" width="<?php echo esc_attr( (int) $theme_width ); ?>"></audio>
		<div class="wp-playlist-next"></div>
		<div class="wp-playlist-prev"></div>
		<noscript>
			<ol>
				<?php
				foreach ( $track_list as $track ) :
					printf( '<li>%s</li>', esc_url( $track['src'] ) );
				endforeach;
				?>
			</ol>
		</noscript>
		<script type="application/json" class="wp-playlist-script"><?php echo wp_json_encode( $player_data ); ?></script>
	</div>
	<?php
	/*
	* Enqueue necessary scripts and styles.
	*/
	Jetpack_Gutenberg::load_assets_as_required( 'podcast-player' );

	return ob_get_clean();
}

/**
 * Gets a list of tracks for the supplied RSS feed.
 *
 * @param string $feed the RSS feed to load and list tracks for.
 * @param int    $quantity the number of tracks to return.
 * @return array|WP_Error the feed's tracks or a error object.
 */
function get_track_list( $feed, $quantity = 5 ) {
	if ( empty( $feed ) ) {
		return new WP_Error( 'missing_feed', __( 'Podcast audio RSS feed missing.', 'jetpack' ) );
	}

	$rss = fetch_feed( $feed );

	if ( is_wp_error( $rss ) ) {
		return $rss; // returns the WP_Error object.
	}

	if ( ! $rss->get_item_quantity() ) {
		return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
	}

	$episodes = $rss->get_items( 0, $quantity );

	$track_list = array_map(
		function( $episode ) {

			$url  = ! empty( $episode->data['child']['']['enclosure'][0]['attribs']['']['url'] ) ? $episode->data['child']['']['enclosure'][0]['attribs']['']['url'] : null;
			$type = ! empty( $episode->data['child']['']['enclosure'][0]['attribs']['']['type'] ) ? $episode->data['child']['']['enclosure'][0]['attribs']['']['type'] : null;

			// If there is no type return an empty array as the array entry. We will filter out later.
			if ( ! $url ) {
				return array();
			}

			// Build track data.
			$track = array(
				'src'         => $url,
				'type'        => $type,
				'caption'     => '',
				'description' => wp_kses_post( $episode->get_description() ),
				'meta'        => array(),
			);

			$track['title'] = esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) );

			if ( empty( $track['title'] ) ) {
				$track['title'] = __( '(no title)', 'jetpack' );
			}

			return $track;
		},
		$episodes
	);

	// Remove empty tracks.
	return \array_filter( $track_list );
}
