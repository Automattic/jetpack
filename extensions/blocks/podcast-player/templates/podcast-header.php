<?php
/**
 * Podcast Header template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

/**
 * Block attributes
 */
$attributes               = (array) $data['attributes'];
$show_cover_art           = (bool) $attributes['showCoverArt'];
$show_episode_description = (bool) $attributes['showEpisodeDescription'];

// Current track.
$track = ! empty( $data['tracks'] ) ? $data['tracks'][0] : array();
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
					'playerId' => $playerId,
					'title'    => $title,
					'link'     => $link,
					'track'    => $track,
				)
			);
			?>
		<?php endif; ?>
	</div>

	<?php
	if ( $show_episode_description && ! empty( $track ) && isset( $track['description'] ) ) :
		?>
	<div
		id="<?php echo esc_attr( $playerId ); ?>__track-description"
		class="jetpack-podcast-player__track-description"
	>
		<?php echo esc_attr( $track['description'] ); ?>
	</div>
	<?php endif; ?>
</div>

<?php
// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
