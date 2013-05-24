<?php
/**
 * The default template for displaying content
 *
 * @package Minileven
 */
?>

	<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
		<header class="entry-header">
			<?php if ( '1' == get_option( 'wp_mobile_featured_images' ) && is_home() || is_search() || is_archive() ) : ?>
				<div class="entry-thumbnail">
					<a href="<?php the_permalink(); ?>" title="<?php echo esc_attr( sprintf( __( 'Permalink to %s', 'jetpack' ), the_title_attribute( 'echo=0' ) ) ); ?>" rel="<?php the_ID(); ?>" class="minileven-featured-thumbnail"><?php the_post_thumbnail(); ?></a>
				</div><!-- .entry-thumbnail -->
			<?php endif; ?>
			<?php if ( is_sticky() ) : ?>
				<div class="entry-heading">
					<h2 class="entry-title"><a href="<?php the_permalink(); ?>" title="<?php echo esc_attr( sprintf( __( 'Permalink to %s', 'jetpack' ), the_title_attribute( 'echo=0' ) ) ); ?>" rel="bookmark"><?php the_title(); ?></a></h2>
					<h3 class="entry-format"><?php _e( 'Featured', 'jetpack' ); ?></h3>
				<div>
			<?php else : ?>
			<h1 class="entry-title"><a href="<?php the_permalink(); ?>" title="<?php echo esc_attr( sprintf( __( 'Permalink to %s', 'jetpack' ), the_title_attribute( 'echo=0' ) ) ); ?>" rel="bookmark"><?php the_title(); ?></a></h1>
			<?php endif; ?>

			<div class="entry-meta">
				<?php if ( is_singular() && is_multi_author() ) : ?>
					<span class="author-link">
						<?php _e( 'Posted by ', 'jetpack' ); ?>
						<a href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>" rel="author">
							<?php printf( __( '%s', 'jetpack' ), get_the_author() ); ?>
						</a>
					</span><!-- .author-link -->
				<?php endif; ?>
			</div><!-- .entry-meta -->
		</header><!-- .entry-header -->

		<div class="entry-content">
		<?php if ( '1' == get_option( 'wp_mobile_excerpt' ) && is_home() || is_search() || is_archive() ) : ?>
			<?php echo minileven_excerpt( 300 ); ?>
		<?php else : ?>
			<?php the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'jetpack' ) ); ?>
		<?php endif; ?>
			<?php wp_link_pages( array( 'before' => '<div class="page-link"><span>' . __( 'Pages:', 'jetpack' ) . '</span>', 'after' => '</div>' ) ); ?>
		</div><!-- .entry-content -->

		<footer class="entry-meta">
			<?php if ( 'post' == get_post_type() ) : ?>
				<?php minileven_posted_on(); ?>
			<?php endif; ?>
			<?php if ( comments_open() ) : ?>
			<span class="comments-link"><?php comments_popup_link( '<span class="leave-reply">' . __( 'Leave a reply', 'jetpack' ) . '</span>', __( '<b>1</b> Reply', 'minileven' , 'jetpack'), __( '<b>%</b> Replies', 'minileven' , 'jetpack') ); ?></span>
			<?php endif; // End if comments_open() ?>
			<?php edit_post_link( __( 'Edit', 'jetpack' ), '<span class="edit-link">', '</span>' ); ?>
		</footer><!-- #entry-meta -->
	</article><!-- #post-<?php the_ID(); ?> -->

	<?php if ( is_single() ) : ?>
	<nav id="nav-single">
		<h3 class="assistive-text"><?php _e( 'Post navigation', 'jetpack' ); ?></h3>
		<span class="nav-previous"><?php previous_post_link( '%link', __( '&laquo; Previous', 'jetpack' ) ); ?></span>
		<span class="nav-next"><?php next_post_link( '%link', __( 'Next &raquo;', 'jetpack' ) ); ?></span>
	</nav><!-- #nav-single -->
	<?php endif; ?>

	<?php comments_template( '', true ); ?>