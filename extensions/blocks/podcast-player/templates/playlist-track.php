<?php
/**
 * Podcast Title template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>

<li
	class="jetpack-podcast-player__track <?php echo esc_attr( $secondary_colors['class'] ); ?>"
	style="<?php echo esc_attr( $secondary_colors['style'] ); ?>"
>
	<a
		class="jetpack-podcast-player__track-link"
		href="<?php echo esc_url( $attachment['link'] ); ?>"
		role="button"
		aria-pressed="false"
	>
		<span class="jetpack-podcast-player__track-status-icon"></span>
		<span class="jetpack-podcast-player__track-title"><?php echo esc_html( $attachment['title'] ); ?></span>
		<time class="jetpack-podcast-player__track-duration"><?php echo ( ! empty( $attachment['duration'] ) ? esc_html( $attachment['duration'] ) : '' ); ?></time>
	</a>
</li>

<?php
// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
