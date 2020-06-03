<?php
/**
 * Podcast Header Title template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Template variables.
 *
 * @var string $player_id
 * @var string $title
 * @var string $link
 * @var array  $track
 * @var array  $primary_colors
 */

if ( ! isset( $title ) && empty( $track ) && ! isset( $track['title'] ) ) {
	return;
}
?>

<h2 id="<?php echo esc_attr( $player_id ); ?>__title" class="jetpack-podcast-player__title">
	<?php if ( ! empty( $track ) && isset( $track['title'] ) && isset( $track['link'] ) && isset( $track['src'] ) ) : ?>
		<span
			class="jetpack-podcast-player__current-track-title <?php echo esc_attr( $primary_colors['class'] ); ?>"
			<?php echo isset( $primary_colors['style'] ) ? 'style="' . esc_attr( $primary_colors['style'] ) . '"' : ''; ?>
		>
			<?php echo esc_html( $track['title'] ); ?>
			<a
				class="jetpack-podcast-player__track-title-link"
				href="<?php echo esc_url( empty( $track['link'] ) ? $track['src'] : $track['link'] ); ?>"
				target="_blank"
				rel="noopener noreferrer nofollow"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path d="M15.6 7.2H14v1.5h1.6c2 0 3.7 1.7 3.7 3.7s-1.7 3.7-3.7 3.7H14v1.5h1.6c2.8 0 5.2-2.3 5.2-5.2 0-2.9-2.3-5.2-5.2-5.2zM4.7 12.4c0-2 1.7-3.7 3.7-3.7H10V7.2H8.4c-2.9 0-5.2 2.3-5.2 5.2 0 2.9 2.3 5.2 5.2 5.2H10v-1.5H8.4c-2 0-3.7-1.7-3.7-3.7zm4.6.9h5.3v-1.5H9.3v1.5z" />
				</svg>
			</a>
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
