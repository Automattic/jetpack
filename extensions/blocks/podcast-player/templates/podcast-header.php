<?php
/**
 * Podcast Header template.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

/**
 * Block attributes
 */
$attributes = (array) $data['attributes'];

/**
 * Player data.
 */

$player_id                = (string) $data['playerId'];
$title                    = (string) $data['title'];
$cover                    = (string) $data['cover'];
$link                     = (string) $data['link'];
$track                    = ! empty( $data['tracks'] ) ? $data['tracks'][0] : array();
$show_cover_art           = (bool) $attributes['showCoverArt'];
$show_episode_description = (bool) $attributes['showEpisodeDescription'];
?>


<?php
function render_podcast_title( $title, $link ) {
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
<?php } ?>

<?php
function render_title( $player_id, $title, $link, $track ) {
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
			<?php render_podcast_title( $title, $link ); ?>
		<?php endif; ?>
	</h2>
<?php } ?>

<div class="jetpack-podcast-player__header">
	<div class="jetpack-podcast-player__current-track-info" aria-live="polite">
		<?php if ( $show_cover_art && isset( $cover ) ) : ?>
		<div class="jetpack-podcast-player__cover">
			<img class="jetpack-podcast-player__cover-image" src=<?php echo esc_url( $cover ); ?>alt="" />
		</div>

			<?php render_title( $player_id, $title, $link, $track ); ?>
		<?php endif; ?>
	</div>

	<?php
	if ( $show_episode_description && ! empty( $track ) && isset( $track['description'] ) ) :
		?>
	<div
		id="<?php echo esc_attr( $player_id ); ?>__track-description"
		class="jetpack-podcast-player__track-description"
	>
		<?php echo esc_attr( $track['description'] ); ?>
	</div>
	<?php endif; ?>
</div>
