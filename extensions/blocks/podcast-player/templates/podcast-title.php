<?php
namespace Automattic\Jetpack\Extensions\Podcast_Player;

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
