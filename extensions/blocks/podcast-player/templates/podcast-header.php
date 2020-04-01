<?php
/**
 * Podcast Header template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Block attributes
 */
$attributes = (array) $data['attributes'];

/**
 * Player data.
 */

$player_id                = (string) $data['playerId'];
$title                    = (string) $data['title'];
$cover                    = (string) $data['cover'];
$link                     = (string) $data['link'];
$track                    = ! empty( $data['tracks'] ) ? $data['tracks'][0] : array();
$show_cover_art           = (bool) $attributes['showCoverArt'];
$show_episode_description = (bool) $attributes['showEpisodeDescription'];
?>

<div class="jetpack-podcast-player__header">
	<div class="jetpack-podcast-player__current-track-info" aria-live="polite">
		<?php if ( $show_cover_art && isset( $cover ) ) : ?>
			<div class="jetpack-podcast-player__cover">
				<img class="jetpack-podcast-player__cover-image" src=<?php echo esc_url( $cover ); ?>alt="" />
			</div>

			<?php
			render(
				'podcast-header-title',
				array(
					'player_id' => $player_id,
					'title'     => $title,
					'link'      => $link,
					'track'     => $track,
				)
			);
			?>
		<?php endif; ?>
	</div>

	<?php
	if ( $show_episode_description && ! empty( $track ) && isset( $track['description'] ) ) :
		?>
	<div
		id="<?php echo esc_attr( $player_id ); ?>__track-description"
		class="jetpack-podcast-player__track-description"
	>
		<?php echo esc_attr( $track['description'] ); ?>
	</div>
	<?php endif; ?>
</div>
