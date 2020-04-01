<?php

namespace Automattic\Jetpack\Extensions\Podcast_Player;

if ( ! isset( $title ) && empty( $track ) && ! isset( $track['title'] ) ) {
	return;
}
?>

<h2 id=<?php echo esc_attr( $player_id ); ?>__title" class="jetpack-podcast-player__title">
	<?php if ( ! empty( $track ) && isset( $track['title'] ) ) : ?>
		<span class="jetpack-podcast-player__current-track-title">
			<?php echo $track['title']; ?>
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
