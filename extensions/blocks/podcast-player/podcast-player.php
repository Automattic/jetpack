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
				'url'                    => array(
					'type' => 'url',
				),
				'itemsToShow'            => array(
					'type'    => 'integer',
					'default' => 5,
				),
				'showCoverArt'           => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'showEpisodeDescription' => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'textColor'              => array(
					'type' => 'string',
				),
				'customTextColor'        => array(
					'type' => 'string',
				),
				'backgroundColor'        => array(
					'type' => 'string',
				),
				'customBackgroundColor'  => array(
					'type' => 'string',
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

	$track_list = get_track_list( $attributes['url'], absint( $attributes['itemsToShow'] ) );

	if ( is_wp_error( $track_list ) ) {
		return '<p>' . esc_html( $track_list->get_error_message() ) . '</p>';
	}

	return render_player( $track_list, $attributes );
}

/**
 * Renders the HTML for the Podcast player and tracklist.
 *
 * @param array $track_list The list of podcast tracks.
 * @param array $attributes Array containing the Podcast Player block attributes.
 * @return string The HTML for the podcast player.
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
		<ol class="podcast-player__episodes">
			<?php foreach ( $track_list as $attachment ) : ?>
			<li class="podcast-player__episode">
				<a
					class="podcast-player__episode-link"
					href="<?php echo esc_url( $attachment['link'] ); ?>"
					data-jetpack-podcast-audio="<?php echo esc_url( $attachment['src'] ); ?>"
					role="button"
					aria-pressed="false"
				>
					<span class="podcast-player__episode-status-icon"></span>
					<span class="podcast-player__episode-title"><?php echo esc_html( $attachment['title'] ); ?></span>
					<time class="podcast-player__episode-duration"><?php echo ( ! empty( $attachment['duration'] ) ? esc_html( $attachment['duration'] ) : '' ); ?></time>
				</a>
			</li>
			<?php endforeach; ?>
		</ol>
		<script type="application/json"><?php echo wp_json_encode( $player_data ); ?></script>
	</div>
	<script>window.jetpackPodcastPlayers=(window.jetpackPodcastPlayers||[]);window.jetpackPodcastPlayers.push( <?php echo wp_json_encode( $instance_id ); ?> );</script>
	<?php
	/**
	 * Enqueue necessary scripts and styles.
	 */
	wp_enqueue_style( 'mediaelement' );
	Jetpack_Gutenberg::load_assets_as_required( 'podcast-player', array( 'mediaelement' ) );

	return ob_get_clean();
}

/**
 * Gets a list of tracks for the supplied RSS feed.
 *
 * @param string $feed     The RSS feed to load and list tracks for.
 * @param int    $quantity Optional. The number of tracks to return.
 * @return array|WP_Error The feed's tracks or a error object.
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
	$enclosure = get_audio_enclosure( $episode );

	// If there is no link return an empty array. We will filter out later.
	if ( empty( $enclosure->link ) ) {
		return array();
	}

	// Build track data.
	$track = array(
		'link'        => esc_url( $episode->get_link() ),
		'src'         => esc_url( $enclosure->link ),
		'type'        => esc_attr( $enclosure->type ),
		'description' => wp_kses_post( $episode->get_description() ),
	);

	$track['title'] = esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) );

	if ( empty( $track['title'] ) ) {
		$track['title'] = esc_html__( '(no title)', 'jetpack' );
	}

	if ( ! empty( $enclosure->duration ) ) {
		$track['duration'] = format_track_duration( $enclosure->duration );
	}

	return $track;
}

/**
 * Retrieves an audio enclosure.
 *
 * @param \SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
 * @return \SimplePie_Enclosure|null
 */
function get_audio_enclosure( \SimplePie_Item $episode ) {
	foreach ( (array) $episode->get_enclosures() as $enclosure ) {
		if ( 0 === strpos( $enclosure->type, 'audio/' ) ) {
			return $enclosure;
		}
	}

	// Default to empty SimplePie_Enclosure object.
	return $episode->get_enclosure();
}

/**
 * Returns the track duration as a formatted string.
 *
 * @param number $duration of the track in seconds.
 * @return string
 */
function format_track_duration( $duration ) {
	$format = $duration > HOUR_IN_SECONDS ? 'H:i:s' : 'i:s';

	return date_i18n( $format, $duration );
}

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to player either in the editor-canvas
 * as well as in the front-end side.
 *
 * @param  array $attributes block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function get_colors( $attributes ) {
	$colors = array(
			'css_classes'   => array(),
			'inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = isset( $attributes['textColor'] );
	$has_custom_text_color = isset( $attributes['customTextColor'] );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = isset( $attributes['backgroundColor'] );
	$has_custom_background_color = isset( $attributes['customBackgroundColor'] );

	// If has background color.
	if ( $has_custom_background_color || $has_named_background_color ) {
		// Add has-background class.
		$colors['css_classes'][] = 'has-background';
	}

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	return $colors;
}
