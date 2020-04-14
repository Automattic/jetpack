<?php
/**
 * Podcast Header template.
 *
 * @package Jetpack
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
 * @var bool   $is_amp
 * @var string $cover
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
					'is_amp'         => $is_amp,
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
		<?php echo $is_amp ? '[text]="podcastPlayer.tracks[currentTrack].description"' : ''; ?>
	>
		<?php echo esc_html( $track['description'] ); ?>
	</div>
	<?php endif; ?>

	<div class="jetpack-podcast-player__audio-player">
		<?php if ( $is_amp ) : ?>
			<amp-audio
				width="100%"
				height="40"
				artwork="<?php echo esc_url( $cover ); ?>"
				artist="<?php echo esc_attr( $title ); ?>"
				src="<?php echo esc_url( $track['src'] ); ?>"
				title="<?php echo esc_attr( $track['title'] ); ?>"
				[src]="podcastPlayer.tracks[currentTrack].src"
				[title]="podcastPlayer.tracks[currentTrack].title"
			>
				<p fallback>
					<a [href]="podcastPlayer.tracks[currentTrack].link" href="<?php echo esc_url( $track['link'] ); ?>">
						<?php esc_html_e( 'Open episode page', 'jetpack' ); ?>
					</a>
					<a download [href]="podcastPlayer.tracks[currentTrack].src" href="<?php echo esc_url( $track['src'] ); ?>">
						<?php esc_html_e( 'Download audio', 'jetpack' ); ?>
					</a>
				</p>
			</amp-audio>
		<?php else : ?>
			<div class="jetpack-podcast-player--audio-player-loading"></div>
		<?php endif; ?>
	</div>
</div>
