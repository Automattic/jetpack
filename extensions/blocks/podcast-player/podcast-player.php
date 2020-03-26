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
use Jetpack_AMP_Support;

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

	$player_data = Jetpack_Podcast_Helper::get_player_data( $attributes['url'] );

	if ( is_wp_error( $player_data ) ) {
		return '<p>' . esc_html( $player_data->get_error_message() ) . '</p>';
	}

	return render_player( $player_data, $attributes );
}

/**
 * Renders the HTML for the Podcast player and tracklist.
 *
 * @param array $player_data The player data details.
 * @param array $attributes Array containing the Podcast Player block attributes.
 * @return string The HTML for the podcast player.
 */
function render_player( $player_data, $attributes ) {
	// If there are no tracks (it is possible) then display appropriate user facing error message.
	if ( empty( $player_data['tracks'] ) ) {
		return '<p>' . esc_html__( 'No tracks available to play.', 'jetpack' ) . '</p>';
	}

	// Only use the amount of tracks requested.
	$player_data['tracks'] = array_slice(
		$player_data['tracks'],
		0,
		absint( $attributes['itemsToShow'] )
	);

	// Genereate a unique id for the block instance.
	$instance_id             = wp_unique_id( 'jetpack-podcast-player-block-' );
	$player_data['playerId'] = $instance_id;

	// Generate object to be used as props for PodcastPlayer.
	$player_props = array_merge(
		// Add all attributes.
		array( 'attributes' => $attributes ),
		// Add all player data.
		$player_data
	);

	// Set CSS classes for `secondary` and `background` colors.
	$secondary_color         = isset( $attributes['secondaryColor'] ) ? $attributes['secondaryColor'] : null;
	$custom_secondary_color  = isset( $attributes['customSecondaryColor'] ) ? $attributes['customSecondaryColor'] : null;
	$background_color        = isset( $attributes['backgroundColor'] ) ? $attributes['backgroundColor'] : null;
	$custom_background_color = isset( $attributes['customBackgroundColor'] ) ? $attributes['customBackgroundColor'] : null;

	$secondary_color_class  = get_color_class_name( 'color', $secondary_color );
	$background_color_class = get_color_class_name( 'background-color', $background_color );

	$podcast_player_classes_name = array();
	if ( isset( $secondary_color_class ) || isset( $custom_secondary_color ) ) {
		array_push( $podcast_player_classes_name, 'has-secondary' );
		if ( isset( $secondary_color_class ) ) {
			array_push( $podcast_player_classes_name, $secondary_color_class );
		}
	}
	if ( isset( $background_color_class ) || isset( $custom_background_color ) ) {
		array_push( $podcast_player_classes_name, 'has-background' );
		if ( isset( $background_color_class ) ) {
			array_push( $podcast_player_classes_name, $background_color_class );
		}
	}
	$podcast_player_classes_name = implode( ' ', $podcast_player_classes_name );

	$block_classname = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes, array( 'is-default' ) );
	$is_amp          = ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $block_classname ); ?>" id="<?php echo esc_attr( $instance_id ); ?>">
		<div
			<?php
			echo ! empty( $podcast_player_classes_name )
				? ' class="' . esc_attr( $podcast_player_classes_name ) . '"'
				: '';
			?>
		>
			<ol class="jetpack-podcast-player__episodes">
				<?php foreach ( $player_data['tracks'] as $attachment ) : ?>
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
		</div>
		<?php if ( ! $is_amp ) : ?>
		<script type="application/json"><?php echo wp_json_encode( $player_props ); ?></script>
		<?php endif; ?>
	</div>
	<?php if ( ! $is_amp ) : ?>
	<script>
		( function( instanceId ) {
			document.getElementById( instanceId ).classList.remove( 'is-default' );
			window.jetpackPodcastPlayers=(window.jetpackPodcastPlayers||[]);
			window.jetpackPodcastPlayers.push( instanceId );
		} )( <?php echo wp_json_encode( $instance_id ); ?> );
	</script>
	<?php endif; ?>
	<?php
	/**
	 * Enqueue necessary scripts and styles.
	 */
	if ( ! $is_amp ) {
		wp_enqueue_style( 'mediaelement' );
	}
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'mediaelement' ) );

	return ob_get_clean();
}

/**
 * Returns a CSS class based on the context a color is being used and its slug.
 *
 * @param string $color_context_name Context/place where color is being used e.g: background, text etc...
 * @param string $color_slug         Slug of the color.
 *
 * @return string String with the class corresponding to the color in the provided context.
 */
function get_color_class_name( $color_context_name, $color_slug ) {
	if ( ! isset( $color_context_name ) || ! isset( $color_slug ) ) {
		return '';
	}

	return "has-${color_slug}-${color_context_name}";
}
