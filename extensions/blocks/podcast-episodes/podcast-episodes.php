<?php
/**
 * Podcast Episodes Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Jetpack\Podcast_Episodes_Block;

use WP_Error;

const FEATURE_NAME = 'podcast-episodes';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

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
 * Podcast Episodes block registration/dependency declaration.
 *
 * @param array  $attributes Array containing the Podcast Episodes block attributes.
 * @param string $content    String containing the Podcast Episodes block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	global $content_width;

	if ( ! isset( $attributes['url'] ) ) {
		return;
	}

	$track_list = get_track_list( $attributes['url'], $attributes['itemsToShow'] );

	$data = array(
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

	?>
	<div class="wp-playlist wp-audio-playlist wp-playlist-light">
		<div class="wp-playlist-current-item"></div>
		<audio src="<?php echo esc_url( $track_list[0]['src'] ); ?>" controls="controls" preload="none" width="<?php echo esc_attr( (int) $theme_width ); ?>"></audio>
		<div class="wp-playlist-next"></div>
		<div class="wp-playlist-prev"></div>
		<noscript>
			<ol>
				<?php
				foreach ( $track_list as $att_id => $attachment ) :
					printf( '<li>%s</li>', esc_url( $attachment['src'] ) );
				endforeach;
				?>
			</ol>
		</noscript>
		<script type="application/json" class="wp-playlist-script"><?php echo wp_json_encode( $data ); ?></script>
	</div>
	<?php
	/*
	* Enqueue necessary scripts and styles.
	*/
	\Jetpack_Gutenberg::load_assets_as_required( 'podcast-episodes' );

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
		return $rss;
	}

	if ( ! $rss->get_item_quantity() ) {
		return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
	}

	$episodes   = $rss->get_items( 0, $quantity );
	$track_list = array();

	foreach ( $episodes as $episode ) {
		$list_item = array(
			'src'         => esc_url( $episode->data['child']['']['enclosure'][0]['attribs']['']['url'] ),
			'type'        => esc_attr( $episode->data['child']['']['enclosure'][0]['attribs']['']['type'] ),
			'caption'     => '',
			'description' => wp_kses_post( $episode->get_description() ),
			'meta'        => array(),
		);

		$list_item['title'] = esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) );
		if ( empty( $list_item['title'] ) ) {
			$list_item['title'] = __( '(no title)', 'jetpack' );
		}

		$track_list[] = $list_item;
	}

	return $track_list;
}
