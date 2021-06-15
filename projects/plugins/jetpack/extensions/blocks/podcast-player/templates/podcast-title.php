<?php
/**
 * Podcast Title template.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Template variables.
 *
 * @var string $title
 * @var string $link
 */

if ( empty( $title ) ) {
	return;
}

?>
<span class="jetpack-podcast-player__podcast-title">
	<?php
	if ( ! empty( $link ) ) :
		?>
		<a
			class="jetpack-podcast-player__link"
			href="<?php echo esc_url( $link ); ?>"
			target="_blank"
			rel="noopener noreferrer nofollow"
		>
			<?php echo esc_html( $title ); ?>
		</a>
		<?php
	else :
		echo esc_html( $title );
	endif;
	?>
</span>
