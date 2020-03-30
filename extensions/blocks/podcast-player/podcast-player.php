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

	$block_classname = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes, array( 'is-default' ) );
	$is_amp          = ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $block_classname ); ?>" id="<?php echo esc_attr( $instance_id ); ?>">
		<?php
		render_podcast_header(
			$instance_id,
			$player_data['title'],
			$player_data['link'],
			$attributes['showCoverArt'],
			$player_data['cover'],
			$player_data['tracks'][0]
		);
		?>

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
 * Helper function to render the podcast title.
 *
 * @param string $title Podcast title.
 * @param string $link  Podcast link.
 */
function render_podcast_title( $title, $link ) {
	?>
	<span class="jetpack-podcast-player__title">
		<?php if ( isset( $link ) ) : ?>
			<a class="jetpack-podcast-player__title-link" href="<?php echo esc_url( $link ); ?>">
				<?php echo esc_attr( $title ); ?>
			</a>
		<?php else : ?>
			<?php echo esc_attr( $title ); ?>
		<?php endif; ?>
	</span>
	<?php
};

/**
 * Render the poscast title.
 *
 * @param string $player_id Podcast player instance ID.
 * @param string $title     Podcast title.
 * @param string $link      Podcast link.
 * @param array  $track     Track array. Usually it expects the first one.
 */
function render_title( $player_id, $title, $link, $track ) {
	?>
	<h2 id="<?php echo esc_attr( "${player_id}__title" ); ?>" class="jetpack-podcast-player__titles">
		<?php if ( isset( $track ) && isset( $track['title'] ) ) : ?>
			<span class="jetpack-podcast-player__track-title">
				<?php echo esc_attr( $track['title'] ); ?>
			</span>
		<?php endif; ?>


		<?php if ( isset( $track ) && isset( $track['title'] ) && isset( $title ) ) : ?>
			<span class="jetpack-podcast-player--visually-hidden"> - </span>
		<?php endif; ?>

		<?php if ( isset( $title ) ) : ?>
			<?php render_podcast_title( $title, $link ); ?>
		<?php endif; ?>
	</h2>
	<?php
};

/**
 * Render the podcast header.
 *
 * @param string $player_id    Podcast player instance ID.
 * @param string $title        Podcast title.
 * @param string $link         Podcast link.
 * @param bool   $show_cover_art Attribute which defines if it should show the cover.
 * @param string $cover        Podcast art cover.
 * @param array  $track         Track array. Usually it expects the first one.
 */
function render_podcast_header( $player_id, $title, $link, $show_cover_art, $cover, $track ) {
	?>
	<div class="jetpack-podcast-player__header-wrapper">
		<div class="jetpack-podcast-player__header" aria-live="polite">
			<?php if ( isset( $show_cover_art ) && isset( $cover ) ) : ?>
				<div class="jetpack-podcast-player__track-image-wrapper">
					<img
						class="jetpack-podcast-player__track-image"
						src=<?php echo esc_attr( $cover ); ?>
						alt=""
					/>
				</div>
			<?php endif; ?>

			<?php if ( isset( $title ) || ( isset( $track ) && isset( $track['title'] ) ) ) : ?>
				<div class="jetpack-podcast-player__titles">
					<?php render_title( $player_id, $title, $link, $track ); ?>
				</div>
			<?php endif; ?>
		</div>

		<div
			id="<?php echo esc_attr( "${player_id}__track-description" ); ?>"
			class="jetpack-podcast-player__track-description"
		>
			<?php echo esc_attr( $track['description'] ); ?>
		</div>
	</div>
	<?php
}
