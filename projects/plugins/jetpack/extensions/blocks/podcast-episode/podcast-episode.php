<?php
/**
 * Podcast Episode Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Episode;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Request;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg.
 *
 * Only registered on WordPress.com sites (Simple or Atomic/WoA).
 */
function register_block() {
	if ( ! ( new Host() )->is_wpcom_platform() ) {
		return;
	}

	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			// Reuse the core media element styles for the audio/video player.
			'style'           => 'wp-mediaelement',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Podcast Episode block render callback.
 *
 * Pulls title, cover art, excerpt, and author from the surrounding post —
 * the post is the episode. The block stores only audio + episode metadata.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Inner content (fallback direct-link markup from save.js).
 * @return string
 */
function render_block( $attributes, $content ) {
	// Outside the frontend, fall back to the saved direct link so RSS / email / REST export stays
	// simple and predictable.
	if ( ! Request::is_frontend() ) {
		return $content;
	}

	// The block only renders inside a singular post/page context, since it pulls
	// title, cover art, and excerpt from the surrounding post.
	if ( ! is_singular() ) {
		return '';
	}

	if ( empty( $attributes['mediaUrl'] ) ) {
		return '';
	}

	$media_url = esc_url_raw( $attributes['mediaUrl'] );
	if ( ! wp_http_validate_url( $media_url ) ) {
		return '';
	}

	$media_type     = isset( $attributes['mediaType'] ) && 'video' === $attributes['mediaType'] ? 'video' : 'audio';
	$mime_type      = isset( $attributes['mediaMimeType'] ) ? (string) $attributes['mediaMimeType'] : '';
	$episode_number = isset( $attributes['episodeNumber'] ) ? (int) $attributes['episodeNumber'] : 0;
	$season_number  = isset( $attributes['seasonNumber'] ) ? (int) $attributes['seasonNumber'] : 0;
	$episode_type   = isset( $attributes['episodeType'] ) ? (string) $attributes['episodeType'] : 'full';
	$is_explicit    = ! empty( $attributes['explicit'] );
	$duration       = isset( $attributes['duration'] ) ? (string) $attributes['duration'] : '';
	$show_poster    = ! isset( $attributes['showPoster'] ) || ! empty( $attributes['showPoster'] );
	$transcript_url = isset( $attributes['transcriptUrl'] ) ? esc_url_raw( $attributes['transcriptUrl'] ) : '';
	$chapters_url   = isset( $attributes['chaptersUrl'] ) ? esc_url_raw( $attributes['chaptersUrl'] ) : '';
	$location_name  = isset( $attributes['locationName'] ) ? (string) $attributes['locationName'] : '';
	$license        = isset( $attributes['license'] ) ? (string) $attributes['license'] : '';
	$license_url    = isset( $attributes['licenseUrl'] ) ? esc_url_raw( $attributes['licenseUrl'] ) : '';
	$people         = isset( $attributes['people'] ) && is_array( $attributes['people'] ) ? $attributes['people'] : array();

	// Pull display content from the surrounding post.
	$title        = get_the_title();
	$excerpt      = get_the_excerpt();
	$author_name  = get_the_author();
	$publish_date = get_the_date( 'c' );
	$image_url    = $show_poster ? (string) get_the_post_thumbnail_url( null, 'medium_large' ) : '';

	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();
	$wrapper_style      = ! empty( $wrapper_attributes['style'] ) ? $wrapper_attributes['style'] : '';
	$block_classname    = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attributes );
	$is_amp             = Blocks::is_amp_request();

	ob_start();
	?>
	<div
		class="<?php echo esc_attr( $block_classname ); ?>"
		<?php
		if ( $wrapper_style ) :
			?>
			style="<?php echo esc_attr( $wrapper_style ); ?>"<?php endif; ?>
	>
		<article class="jetpack-podcast-episode" itemscope itemtype="https://schema.org/PodcastEpisode">
			<?php if ( $image_url ) : ?>
				<figure class="jetpack-podcast-episode__poster">
					<img
						src="<?php echo esc_url( $image_url ); ?>"
						alt="<?php echo esc_attr( $title ); ?>"
						itemprop="image"
						loading="lazy"
					/>
				</figure>
			<?php endif; ?>

			<div class="jetpack-podcast-episode__body">
				<?php if ( $season_number || $episode_number || 'full' !== $episode_type ) : ?>
					<p class="jetpack-podcast-episode__meta-line">
						<?php if ( $season_number ) : ?>
							<span class="jetpack-podcast-episode__season">
								<?php
								/* translators: %d: season number. */
								echo esc_html( sprintf( __( 'Season %d', 'jetpack' ), $season_number ) );
								?>
							</span>
						<?php endif; ?>
						<?php if ( $episode_number ) : ?>
							<span class="jetpack-podcast-episode__episode-number" itemprop="episodeNumber">
								<?php
								/* translators: %d: episode number. */
								echo esc_html( sprintf( __( 'Episode %d', 'jetpack' ), $episode_number ) );
								?>
							</span>
						<?php endif; ?>
						<?php if ( 'trailer' === $episode_type ) : ?>
							<span class="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--trailer"><?php esc_html_e( 'Trailer', 'jetpack' ); ?></span>
						<?php elseif ( 'bonus' === $episode_type ) : ?>
							<span class="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--bonus"><?php esc_html_e( 'Bonus', 'jetpack' ); ?></span>
						<?php endif; ?>
						<?php if ( $is_explicit ) : ?>
							<span class="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--explicit" title="<?php esc_attr_e( 'Explicit content', 'jetpack' ); ?>"><?php esc_html_e( 'E', 'jetpack' ); ?></span>
						<?php endif; ?>
					</p>
				<?php endif; ?>

				<?php if ( $title ) : ?>
					<h3 class="jetpack-podcast-episode__title" itemprop="name"><?php echo esc_html( $title ); ?></h3>
				<?php endif; ?>

				<?php if ( $author_name || $publish_date || $duration ) : ?>
					<p class="jetpack-podcast-episode__byline">
						<?php if ( $author_name ) : ?>
							<span class="jetpack-podcast-episode__author" itemprop="author"><?php echo esc_html( $author_name ); ?></span>
						<?php endif; ?>
						<?php if ( $publish_date ) : ?>
							<time
								class="jetpack-podcast-episode__date"
								datetime="<?php echo esc_attr( $publish_date ); ?>"
								itemprop="datePublished"
							>
								<?php echo esc_html( get_the_date() ); ?>
							</time>
						<?php endif; ?>
						<?php if ( $duration ) : ?>
							<span class="jetpack-podcast-episode__duration" itemprop="duration"><?php echo esc_html( $duration ); ?></span>
						<?php endif; ?>
					</p>
				<?php endif; ?>

				<div class="jetpack-podcast-episode__player">
					<?php if ( 'video' === $media_type ) : ?>
						<video
							class="jetpack-podcast-episode__video"
							controls
							preload="metadata"
							src="<?php echo esc_url( $media_url ); ?>"
							<?php
							if ( $image_url ) :
								?>
								poster="<?php echo esc_url( $image_url ); ?>"<?php endif; ?>
							<?php
							if ( $mime_type ) :
								?>
								data-mime="<?php echo esc_attr( $mime_type ); ?>"<?php endif; ?>
							itemprop="associatedMedia"
						></video>
					<?php else : ?>
						<audio
							class="jetpack-podcast-episode__audio"
							controls
							preload="metadata"
							src="<?php echo esc_url( $media_url ); ?>"
							<?php
							if ( $mime_type ) :
								?>
								data-mime="<?php echo esc_attr( $mime_type ); ?>"<?php endif; ?>
							itemprop="associatedMedia"
						></audio>
					<?php endif; ?>
				</div>

				<?php if ( $excerpt ) : ?>
					<p class="jetpack-podcast-episode__summary" itemprop="description"><?php echo esc_html( $excerpt ); ?></p>
				<?php endif; ?>

				<?php if ( ! empty( $people ) ) : ?>
					<ul class="jetpack-podcast-episode__people">
						<?php
						foreach ( $people as $person ) :
							if ( empty( $person['name'] ) ) {
								continue;
							}
							$person_name = (string) $person['name'];
							$person_role = isset( $person['role'] ) ? (string) $person['role'] : '';
							$person_href = isset( $person['href'] ) ? esc_url_raw( $person['href'] ) : '';
							$person_img  = isset( $person['img'] ) ? esc_url_raw( $person['img'] ) : '';
							?>
							<li class="jetpack-podcast-episode__person" itemprop="actor" itemscope itemtype="https://schema.org/Person">
								<?php if ( $person_img ) : ?>
									<img src="<?php echo esc_url( $person_img ); ?>" alt="" loading="lazy" />
								<?php endif; ?>
								<?php if ( $person_href ) : ?>
									<a href="<?php echo esc_url( $person_href ); ?>" itemprop="url">
										<span itemprop="name"><?php echo esc_html( $person_name ); ?></span>
									</a>
								<?php else : ?>
									<span itemprop="name"><?php echo esc_html( $person_name ); ?></span>
								<?php endif; ?>
								<?php if ( $person_role ) : ?>
									<span class="jetpack-podcast-episode__person-role"><?php echo esc_html( $person_role ); ?></span>
								<?php endif; ?>
							</li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>

				<?php if ( $transcript_url || $chapters_url || $location_name || $license ) : ?>
					<ul class="jetpack-podcast-episode__links">
						<?php if ( $transcript_url ) : ?>
							<li>
								<a href="<?php echo esc_url( $transcript_url ); ?>" class="jetpack-podcast-episode__transcript-link">
									<?php esc_html_e( 'Read transcript', 'jetpack' ); ?>
								</a>
							</li>
						<?php endif; ?>
						<?php if ( $chapters_url ) : ?>
							<li>
								<a href="<?php echo esc_url( $chapters_url ); ?>" class="jetpack-podcast-episode__chapters-link">
									<?php esc_html_e( 'View chapters', 'jetpack' ); ?>
								</a>
							</li>
						<?php endif; ?>
						<?php if ( $location_name ) : ?>
							<li class="jetpack-podcast-episode__location" itemprop="contentLocation"><?php echo esc_html( $location_name ); ?></li>
						<?php endif; ?>
						<?php if ( $license ) : ?>
							<li class="jetpack-podcast-episode__license">
								<?php
								/* translators: %s: license identifier. */
								$license_label = sprintf( __( 'License: %s', 'jetpack' ), $license );
								?>
								<?php if ( $license_url ) : ?>
									<a href="<?php echo esc_url( $license_url ); ?>" itemprop="license"><?php echo esc_html( $license_label ); ?></a>
								<?php else : ?>
									<?php echo esc_html( $license_label ); ?>
								<?php endif; ?>
							</li>
						<?php endif; ?>
					</ul>
				<?php endif; ?>
			</div>
		</article>
	</div>
	<?php

	if ( ! $is_amp ) {
		wp_enqueue_style( 'wp-mediaelement' );
	}
	Jetpack_Gutenberg::load_assets_as_required( __DIR__, array( 'mediaelement' ) );

	return ob_get_clean();
}
