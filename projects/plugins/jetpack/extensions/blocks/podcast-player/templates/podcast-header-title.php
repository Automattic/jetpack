<?php
/**
 * Podcast Header Title template.
 *
 * @package automattic/jetpack
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

if ( ! isset( $title ) && empty( $track['title'] ) ) {
	return;
}

$track_link = empty( $track['link'] ) ? $track['src'] : $track['link'];
?>

<h2 id="<?php echo esc_attr( $player_id ); ?>__title" class="jetpack-podcast-player__title">
	<span
		class="jetpack-podcast-player__current-track-title <?php echo esc_attr( $primary_colors['class'] ); ?>"
		<?php echo isset( $primary_colors['style'] ) ? 'style="' . esc_attr( $primary_colors['style'] ) . '"' : ''; ?>
	>
		<?php
		echo esc_html( $track['title'] );
		if ( ! empty( $track_link ) ) :
			// Prevent whitespace between title and link to cause a jump when JS kicks in.
			// phpcs:disable Squiz.PHP.EmbeddedPhp.ContentAfterEnd
			?><a
				class="jetpack-podcast-player__track-title-link"
				href="<?php echo esc_url( $track_link ); ?>"
				target="_blank"
				rel="noopener noreferrer nofollow"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
					<path d="M15.6 7.2H14v1.5h1.6c2 0 3.7 1.7 3.7 3.7s-1.7 3.7-3.7 3.7H14v1.5h1.6c2.8 0 5.2-2.3 5.2-5.2 0-2.9-2.3-5.2-5.2-5.2zM4.7 12.4c0-2 1.7-3.7 3.7-3.7H10V7.2H8.4c-2.9 0-5.2 2.3-5.2 5.2 0 2.9 2.3 5.2 5.2 5.2H10v-1.5H8.4c-2 0-3.7-1.7-3.7-3.7zm4.6.9h5.3v-1.5H9.3v1.5z" />
				</svg>
			</a>
		<?php endif; // phpcs:enable ?>
	</span>

	<?php if ( ! empty( $title ) ) : ?>
		<span class="jetpack-podcast-player--visually-hidden"> - </span>

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
