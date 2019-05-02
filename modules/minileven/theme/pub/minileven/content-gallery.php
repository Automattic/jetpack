<?php
/**
 * The template for displaying posts in the Gallery Post Format on index and archive pages
 *
 * Learn more: http://codex.wordpress.org/Post_Formats
 *
 * @package Minileven
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<header class="entry-header">
		<div class="entry-heading">
			<?php if ( '1' == get_option( 'wp_mobile_featured_images' ) && minileven_show_featured_images() ) : ?>
				<div class="entry-thumbnail">
					<a href="<?php the_permalink(); ?>" title="<?php echo esc_attr( sprintf( __( 'Permalink to %s', 'jetpack' ), the_title_attribute( 'echo=0' ) ) ); ?>" rel="<?php the_ID(); ?>" class="minileven-featured-thumbnail"><?php the_post_thumbnail(); ?></a>
				</div><!-- .entry-thumbnail -->
			<?php endif; ?>
			<h2 class="entry-title"><a href="<?php the_permalink(); ?>" rel="bookmark"><?php the_title(); ?></a></h2>
			<h3 class="entry-format"><?php _e( 'Gallery', 'jetpack' ); ?></h3>
		</div>
	</header><!-- .entry-header -->

	<div class="entry-content">
		<?php if ( is_single() || post_password_required() ) : ?>
			<?php the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'jetpack' ) ); ?>

		<?php else : ?>
			<?php
					$images = minileven_get_gallery_images();
					if ( $images ) :
						$total_images = count( $images );
						$large_image  = array_shift( $images );
						$thumb1_image = array_shift( $images );
						$thumb2_image = array_shift( $images );
						$thumb3_image = array_shift( $images );

						$image_img_tag  = wp_get_attachment_image( (int) $large_image, 'large' );
						$thumb1_img_tag = wp_get_attachment_image( (int) $thumb1_image, 'thumbnail' );
						$thumb2_img_tag = wp_get_attachment_image( (int) $thumb2_image, 'thumbnail' );
						$thumb3_img_tag = wp_get_attachment_image( (int) $thumb3_image, 'thumbnail' );
					?>
					<div class="img-gallery">
						<div class="gallery-large">
							<a href="<?php the_permalink(); ?>"><?php echo $image_img_tag; ?></a>
						</div><!-- .gallery-large -->
					<?php if ( 3 == $total_images ) : ?>
						<div class="gallery-thumbs-2">
							<a href="<?php the_permalink(); ?>" class="gallery-thumb-1"><?php echo $thumb1_img_tag; ?></a>
							<a href="<?php the_permalink(); ?>" class="gallery-thumb-2"><?php echo $thumb2_img_tag; ?></a>
						</div><!-- .gallery-thumbs -->

					<?php elseif ( 4 <= $total_images ) : ?>
						<div class="gallery-thumbs-3">
							<a href="<?php the_permalink(); ?>" class="gallery-thumb-1"><?php echo $thumb1_img_tag; ?></a>
							<a href="<?php the_permalink(); ?>" class="gallery-thumb-2"><?php echo $thumb2_img_tag; ?></a>
							<a href="<?php the_permalink(); ?>" class="gallery-thumb-3"><?php echo $thumb3_img_tag; ?></a>
						</div><!-- .gallery-thumbs -->
					</div><!-- .img-gallery -->
					<?php endif; ?>

					<p class="gallery-info"><em><?php printf( _n( 'This gallery contains <a %1$s>%2$s photo</a>.', 'This gallery contains <a %1$s>%2$s photos</a>.', $total_images, 'jetpack' ),
							'href="' . esc_url( get_permalink() ) . '" title="' . esc_attr( sprintf( __( 'Permalink to %s', 'jetpack' ), the_title_attribute( 'echo=0' ) ) ) . '" rel="bookmark"',
							number_format_i18n( $total_images ) );
					?></em></p>

				<?php endif; ?>
			<?php endif; ?>

	<?php wp_link_pages( array( 'before' => '<div class="page-link"><span>' . __( 'Pages:', 'jetpack' ) . '</span>', 'after' => '</div>' ) ); ?>
</div><!-- .entry-content -->

	<footer class="entry-meta">
		<?php minileven_posted_on(); ?>
		<?php if ( comments_open() ) : ?>
		<span class="comments-link"><?php comments_popup_link( '<span class="leave-reply">' . __( 'Leave a Reply', 'jetpack' ) . '</span>', __( '<b>1</b> Reply', 'jetpack' ), __( '<b>%</b> Replies', 'jetpack' ) ); ?></span>
		<?php endif; // End if comments_open() ?>

		<?php edit_post_link( __( 'Edit', 'jetpack' ), '<span class="edit-link">', '</span>' ); ?>
	</footer><!-- #entry-meta -->
</article><!-- #post-<?php the_ID(); ?> -->

<?php comments_template( '', true ); ?>
