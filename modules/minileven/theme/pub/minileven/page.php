<?php
/**
 * The template for displaying all pages.
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site will use a
 * different template.
 *
 * @package Minileven
 */

get_header(); ?>

		<div id="primary">
			<div id="content" role="main">

				<?php while ( have_posts() ) : the_post(); ?>

					<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
						<header class="entry-header">
							<?php if ( '1' == get_option( 'wp_mobile_featured_images' ) && minileven_show_featured_images() ) : ?>
								<div class="entry-thumbnail">
									<a href="<?php the_permalink(); ?>" title="<?php echo esc_attr( sprintf( __( 'Permalink to %s', 'jetpack' ), the_title_attribute( 'echo=0' ) ) ); ?>" rel="<?php the_ID(); ?>" class="minileven-featured-thumbnail"><?php the_post_thumbnail(); ?></a>
								</div><!-- .entry-thumbnail -->
							<?php endif; ?>
							<h1 class="entry-title"><?php the_title(); ?></h1>
						</header><!-- .entry-header -->

						<div class="entry-content">
							<?php the_content(); ?>
							<?php wp_link_pages( array( 'before' => '<div class="page-link"><span>' . __( 'Pages:', 'jetpack' ) . '</span>', 'after' => '</div>' ) ); ?>
						</div><!-- .entry-content -->
						<?php if ( is_user_logged_in() ) : ?>
							<footer class="entry-meta">
								<?php edit_post_link( __( 'Edit', 'jetpack' ), '<span class="edit-link">', '</span>' ); ?>
							</footer><!-- .entry-meta -->
						<?php endif; ?>
					</article><!-- #post-<?php the_ID(); ?> -->

					<?php comments_template( '', true ); ?>

				<?php endwhile; // end of the loop. ?>

			</div><!-- #content -->
		</div><!-- #primary -->
<?php get_footer(); ?>
