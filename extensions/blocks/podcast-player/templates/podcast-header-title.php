<?php
/**
 * Podcast Header Title template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

if ( ! isset( $title ) && empty( $track ) && ! isset( $track['title'] ) ) {
	return;
}
?>

<h2 id=<?php echo esc_attr( $playerId ); ?>__title" class="jetpack-podcast-player__title">
	<?php if ( ! empty( $track ) && isset( $track['title'] ) ) : ?>
		<span class="jetpack-podcast-player__current-track-title">
			<?php echo esc_attr( $track['title'] ); ?>
		</span>
	<?php endif; ?>

	<?php if ( ! empty( $track ) && isset( $track['title'] ) && isset( $title ) ) : ?>
		<span class="jetpack-podcast-player--visually-hidden"> - </span>
	<?php endif; ?>

	<?php if ( isset( $title ) ) : ?>
		<?php
		render(
			'podcast-title',
			array(
				'title' => $title,
				'link'  => $link,
			)
		);
		?>
	<?php endif; ?>
</h2>

<?php
// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
