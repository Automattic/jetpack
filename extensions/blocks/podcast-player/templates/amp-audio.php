<?php
/**
 * Podcast AMP Audio template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Template variables.
 *
 * @var string $title
 * @var string $cover
 * @var array  $track
 */
?>

<amp-audio
	layout="fixed-height"
	height="40"
	controls
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
