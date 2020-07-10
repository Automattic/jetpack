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
	style="<?php echo esc_attr( $style ); ?>"
>
	<a
		class="jetpack-podcast-player__track-link jetpack-podcast-player__link"
		href="<?php echo esc_url( $track_link ); ?>"
		role="button"
		<?php echo $is_active ? 'aria-current="track"' : ''; ?>
	>
		<span class="jetpack-podcast-player__track-status-icon"></span>
		<span class="jetpack-podcast-player__track-title"><?php echo esc_html( $track_title ); ?></span>
		<time class="jetpack-podcast-player__track-duration"><?php echo esc_html( $track_duration ); ?></time>
	</a>
</li>
