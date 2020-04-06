<?php
/**
 * Podcast Title template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Template variables.
 *
 * @var array $attachment
 * @var array $primary_colors
 * @var array $secondary_colors
 * @var bool  $is_active
 * @var bool  $is_amp
 * @var int   $index
 */

$track_title    = $attachment['title'];
$track_link     = empty( $attachment['link'] ) ? $attachment['src'] : $attachment['link'];
$track_duration = ! empty( $attachment['duration'] ) ? $attachment['duration'] : '';

$class = 'jetpack-podcast-player__track ' . $secondary_colors['class'];
$style = $secondary_colors['style'];
if ( $is_active ) {
	$class = 'jetpack-podcast-player__track is-active ' . $primary_colors['class'];
	$style = $primary_colors['style'];
}

?>

<li
	class="<?php echo esc_attr( trim( $class ) ); ?>"
	[class]="'<?php echo esc_attr( trim( 'jetpack-podcast-player__track ' . $secondary_colors['class'] ) ); ?> ' + (currentTrack == <?php echo esc_attr( $index ); ?> ? 'is-active' : '')"
	style="<?php echo esc_attr( $style ); ?>"
	option="<?php echo esc_attr( $index ); ?>"
	<?php echo $is_active ? 'selected' : ''; ?>
>
	<?php if ( $is_amp ) : ?>
	<div class="jetpack-podcast-player__track-link">
	<?php else : ?>
	<a
		class="jetpack-podcast-player__track-link jetpack-podcast-player__link"
		href="<?php echo esc_url( $track_link ); ?>"
		role="button"
		<?php echo $is_active ? 'aria-current="track"' : ''; ?>
		role="button"
		class="jetpack-podcast-player__track-link"
	>
	<?php endif; ?>
		<span class="jetpack-podcast-player__track-status-icon"></span>
		<span class="jetpack-podcast-player__track-title"><?php echo esc_html( $track_title ); ?></span>
		<time class="jetpack-podcast-player__track-duration"><?php echo esc_html( $track_duration ); ?></time>
	<?php if ( $is_amp ) : ?>
	</div>
	<?php else : ?>
	</a>
	<?php endif; ?>
</li>
