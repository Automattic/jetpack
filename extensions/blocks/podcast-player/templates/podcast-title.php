<?php
/**
 * Podcast Title template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

if ( ! isset( $title ) ) {
	return;
}
?>

<?php if ( isset( $link ) ) : ?>
	<a
		class="jetpack-podcast-player__podcast-title"
		href="<?php echo esc_url( $link ); ?>"
		target="_blank"
		rel="noopener noreferrer nofollow"
	>
		<?php echo esc_attr( $title ); ?>
	</a>
<?php else : ?>
	<span class="jetpack-podcast-player__podcast-title">
		<?php echo esc_attr( $title ); ?>
	</span>;
<?php endif; ?>

<?php
// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
