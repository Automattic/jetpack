<?php
/**
 * Podcast Header template.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Template variables.
 *
 * @var array  $template_props
 * @var string $player_id
 * @var string $title
 * @var string $link
 * @var array  $primary_colors
 */

/**
 * Block attributes
 */
$attributes               = (array) $template_props['attributes']; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
$show_cover_art           = (bool) $attributes['showCoverArt'];
$show_episode_title       = (bool) $attributes['showEpisodeTitle'];
$show_episode_description = (bool) $attributes['showEpisodeDescription'];

// Current track.
$tracks = $template_props['tracks'];
$track  = ( is_array( $tracks ) && ! empty( $tracks ) ) ? $tracks[0] : array();
?>

<div class="jetpack-podcast-player__header">
	<div class="jetpack-podcast-player__current-track-info">
		<?php if ( $show_cover_art && isset( $cover ) ) : ?>
			<div class="jetpack-podcast-player__cover">
				<img class="jetpack-podcast-player__cover-image" src="<?php echo esc_url( $cover ); ?>" alt="" />
			</div>
		<?php endif; ?>

		<?php
		if ( $show_episode_title ) {
			render(
				'podcast-header-title',
				array(
					'player_id'      => $player_id,
					'title'          => $title,
					'link'           => $link,
					'track'          => $track,
					'primary_colors' => $primary_colors,
				)
			);
		}
		?>
	</div>

	<?php
	if ( $show_episode_description && ! empty( $track ) && isset( $track['description'] ) ) :
		?>
	<div
		id="<?php echo esc_attr( $player_id ); ?>__track-description"
		class="jetpack-podcast-player__track-description"
	>
		<?php echo esc_html( $track['description'] ); ?>
	</div>
	<?php endif; ?>

	<div class="jetpack-podcast-player__audio-player">
		<div class="jetpack-podcast-player--audio-player-loading"></div>
	</div>
</div>
