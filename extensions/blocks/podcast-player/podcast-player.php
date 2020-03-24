<?php
/**
 * Podcast Player Block.
 *
 * @since 8.4.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

use WP_Error;
use Jetpack_Gutenberg;
use Jetpack_Podcast_Helper;

const FEATURE_NAME = 'podcast-player';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

if ( ! class_exists( 'Jetpack_Podcast_Helper' ) ) {
	\jetpack_require_lib( 'class-jetpack-podcast-helper' );
}

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

	$track_list = Jetpack_Podcast_Helper::get_track_list( $attributes['url'], absint( $attributes['itemsToShow'] ) );

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
	$instance_id = wp_unique_id( 'jetpack-podcast-player-block-' );

	// Generate object to be used as props for PodcastPlayer.
	$player_data = array_merge(
		// Make all attributes available.
		$attributes,
		// And add some computed properties.
		array(
			'tracks'   => $track_list,
			'coverArt' => '',
		)
	);

	$block_classname = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $block_classname ); ?>" id="<?php echo esc_attr( $instance_id ); ?>">
		<noscript>
			<ol class="jetpack-podcast-player__episodes">
				<?php foreach ( $track_list as $attachment ) : ?>
				<li class="jetpack-podcast-player__episode">
					<a
						class="jetpack-podcast-player__episode-link"
						href="<?php echo esc_url( $attachment['link'] ); ?>"
						role="button"
						aria-pressed="false"
					>
						<span class="jetpack-podcast-player__episode-status-icon"></span>
						<span class="jetpack-podcast-player__episode-title"><?php echo esc_html( $attachment['title'] ); ?></span>
						<time class="jetpack-podcast-player__episode-duration"><?php echo ( ! empty( $attachment['duration'] ) ? esc_html( $attachment['duration'] ) : '' ); ?></time>
					</a>
				</li>
				<?php endforeach; ?>
			</ol>
		</noscript>
		<script type="application/json"><?php echo wp_json_encode( $player_data ); ?></script>
	</div>
	<script>window.jetpackPodcastPlayers=(window.jetpackPodcastPlayers||[]);window.jetpackPodcastPlayers.push( <?php echo wp_json_encode( $instance_id ); ?> );</script>
	<?php
	/**
	 * Enqueue necessary scripts and styles.
	 */
	wp_enqueue_style( 'mediaelement' );
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'mediaelement' ) );

	return ob_get_clean();
}
