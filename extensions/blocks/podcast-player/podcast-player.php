<?php
/**
 * Podcast Player Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Jetpack\Podcast_Player_Block;

use WP_Error;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'podcast-player';
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
 * Podcast Player block registration/dependency declaration.
 *
 * @param array  $attributes Array containing the Podcast Player block attributes.
 * @param string $content    String containing the Podcast Player block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {

	// Test for empty URLS.
	if ( empty( $attributes['url'] ) ) {
		return '<p>' . esc_html__( 'No Podcast URL provided. Please enter a valid Podcast RSS feed URL.', 'jetpack' ) . '</p>';
	}

	// Test for invalid URLs.
	if ( ! wp_http_validate_url( $attributes['url'] ) ) {
		return '<p>' . esc_html__( 'Invalid Podcast URL. Please double check the URL you entered.', 'jetpack' ) . '</p>';
	}

	// Sanitize the URL.
	$attributes['url'] = esc_url_raw( $attributes['url'] );

	$track_list = get_track_list( $attributes['url'], $attributes['itemsToShow'] );

	if ( is_wp_error( $track_list ) ) {
		return '<p>' . esc_html( $track_list->get_error_message() ) . '</p>';
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
	static $counter = 0;
	$instance_id    = FEATURE_NAME . '-' . ( $counter++ );

	$player_data = array(
		'type'         => 'audio',
		// Don't pass strings to JSON, will be truthy in JS.
		'tracklist'    => true,
		'tracknumbers' => true,
		'images'       => true,
		'artists'      => true,
		'tracks'       => $track_list,
	);

	$block_classname = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes );

	// If there are no tracks (it is possible) then display appropriate user facing error message.
	if ( empty( $track_list ) ) {
		return '<p>' . esc_html__( 'No tracks available to play.', 'jetpack' ) . '</p>';
	}

	ob_start();
	$initial_track_src = ! empty( $track_list[0]['src'] ) ? $track_list[0]['src'] : '';

	wp_enqueue_script( 'wp-mediaelement' );
	wp_enqueue_style( 'wp-mediaelement' );

	?>
	<div class="<?php echo esc_attr( $block_classname ); ?>" id="<?php echo esc_attr( $instance_id ); ?>">
		<audio src="<?php echo esc_attr( $initial_track_src ); ?>" preload="none"></audio>
		<ol>
			<?php
			foreach ( $track_list as $att_id => $attachment ) :
				printf( '<li><a href="%1$s" data-podcast-audio="%2$s">%3$s</a></li>', esc_url( $attachment['link'] ), esc_url( $attachment['src'] ), esc_html( $attachment['title'] ) );
			endforeach;
			?>
		</ol>
		<script type="application/json"><?php echo wp_json_encode( $player_data ); ?></script>
	</div>
	<script>window.jetpackPodcastPlayers=(window.jetpackPodcastPlayers||[]);window.jetpackPodcastPlayers.push( <?php echo wp_json_encode( $instance_id ); ?> );</script>
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
		return new WP_Error( 'invalid_url', __( 'That RSS feed could not be found. Double check the URL you entered.', 'jetpack' ) );
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
				'link'        => esc_url( $episode->get_link() ),
				'src'         => $url,
				'type'        => $type,
				'caption'     => '',
				'description' => wp_kses_post( $episode->get_description() ),
				'meta'        => array(),
			);

			$track['title'] = esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) );

			if ( empty( $track['title'] ) ) {
				$track['title'] = esc_html__( '(no title)', 'jetpack' );
			}

			return $track;
		},
		$episodes
	);

	// Remove empty tracks.
	return \array_filter( $track_list );
}
