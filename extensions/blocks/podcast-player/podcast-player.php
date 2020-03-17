<?php
/**
 * Podcast Player Block.
 *
 * @since 8.4.0
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
 * @param array $attributes Array containing the Podcast Player block attributes.
 * @return string
 */
function render_block( $attributes ) {

	// Test for empty URLS.
	if ( empty( $attributes['url'] ) ) {
		return '<p>' . esc_html__( 'No Podcast URL provided. Please enter a valid Podcast RSS feed URL.', 'jetpack' ) . '</p>';
	}

	// Test for invalid URLs.
	if ( ! wp_http_validate_url( $attributes['url'] ) ) {
		return '<p>' . esc_html__( 'Your podcast URL is invalid and couldn\'t be embedded. Please double check your URL.', 'jetpack' ) . '</p>';
	}

	// Sanitize the URL.
	$attributes['url'] = esc_url_raw( $attributes['url'] );

	$track_list = get_track_list( $attributes['url'], 10 );

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
	// If there are no tracks (it is possible) then display appropriate user facing error message.
	if ( empty( $track_list ) ) {
		return '<p>' . esc_html__( 'No tracks available to play.', 'jetpack' ) . '</p>';
	}
	$instance_id = wp_unique_id( 'podcast-player-block-' );

	$player_data = array(
		'tracks'     => $track_list,
		'attributes' => $attributes,
	);

	$block_classname = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $block_classname ); ?>" id="<?php echo esc_attr( $instance_id ); ?>">
		<ol>
			<?php
			foreach ( $track_list as $attachment ) :
				printf( '<li><a href="%1$s" data-jetpack-podcast-audio="%2$s">%3$s</a></li>', esc_url( $attachment['link'] ), esc_url( $attachment['src'] ), esc_html( $attachment['title'] ) );
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
	wp_enqueue_style( 'wp-mediaelement' );
	Jetpack_Gutenberg::load_assets_as_required( 'podcast-player', array( 'wp-mediaelement' ) );

	return ob_get_clean();
}

/**
 * Gets a list of tracks for the supplied RSS feed.
 *
 * @param string $feed the RSS feed to load and list tracks for.
 * @param int    $quantity the number of tracks to return.
 * @return array|WP_Error the feed's tracks or a error object.
 */
function get_track_list( $feed, $quantity = 10 ) {
	$rss = fetch_feed( $feed );

	if ( is_wp_error( $rss ) ) {
		return new WP_Error( 'invalid_url', __( 'Your podcast couldn\'t be embedded. Please double check your URL.', 'jetpack' ) );
	}

	if ( ! $rss->get_item_quantity() ) {
		return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
	}

	$track_list = array_map( __NAMESPACE__ . '\setup_tracks_callback', $rss->get_items( 0, $quantity ) );

	// Remove empty tracks.
	return \array_filter( $track_list );
}

/**
 * Prepares Episode data to be used with MediaElement.js.
 *
 * @param \SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
 * @return array
 */
function setup_tracks_callback( \SimplePie_Item $episode ) {
	$enclosure = $episode->get_enclosure();

	$url = ! empty( $episode->data['child']['']['enclosure'][0]['attribs']['']['url'] ) ? $episode->data['child']['']['enclosure'][0]['attribs']['']['url'] : null;

	// If there is no link return an empty array. We will filter out later.
	if ( ! $url ) {
		return array();
	}

	// Build track data.
	$track = array(
		'link'        => esc_url( $episode->get_link() ),
		'src'         => esc_url( $url ),
		'type'        => $enclosure->type,
		'caption'     => '',
		'description' => wp_kses_post( $episode->get_description() ),
		'meta'        => array(),
	);

	$track['title'] = esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) );

	if ( empty( $track['title'] ) ) {
		$track['title'] = esc_html__( '(no title)', 'jetpack' );
	}

	return $track;
}
