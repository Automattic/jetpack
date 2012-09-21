<?php
/**
 * The main template file.
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
 * Learn more: http://codex.wordpress.org/Template_Hierarchy
 *
 * @package Minileven
 */

get_header(); ?>

		<div id="primary">
			<div id="content" role="main">

				<?php if ( is_archive() ) : ?>
				<header class="page-header">
					<h1 class="page-title">
						<?php if ( is_day() ) : ?>
							<?php printf( __( 'Daily Archives: %s', 'minileven' ), '<span>' . get_the_date() . '</span>' ); ?>
						<?php elseif ( is_month() ) : ?>
							<?php printf( __( 'Monthly Archives: %s', 'minileven' ), '<span>' . get_the_date( 'F Y' ) . '</span>' ); ?>
						<?php elseif ( is_year() ) : ?>
							<?php printf( __( 'Yearly Archives: %s', 'minileven' ), '<span>' . get_the_date( 'Y' ) . '</span>' ); ?>
						<?php elseif ( is_category() ) : ?>
							<?php printf( __( 'Posted in %s', 'minileven' ), '<span>' . single_cat_title( '', false ) . '</span>' ); ?>
						<?php elseif ( is_tag() ) : ?>
							<?php printf( __( 'Tagged with %s', 'minileven' ), '<span>' . single_tag_title( '', false ) . '</span>' ); ?>
						<?php elseif( is_author() ) : ?>
							<?php printf( __( 'Posted by', 'minileven' ), '<span>' . get_the_author() . '</span>' ); ?>
						<?php else : ?>
							<?php _e( 'Blog Archives', 'minileven' ); ?>
						<?php endif; ?>
					</h1>
				</header>
				<?php endif; ?>

				<?php if ( is_search() ) : ?>
				<header class="page-header">
					<h1 class="page-title"><?php printf( __( 'Search Results for: %s', 'minileven' ), '<span>' . get_search_query() . '</span>' ); ?></h1>
				</header>
				<?php endif; ?>

				<?php if ( have_posts() ) : // Start the loop ?>
					<?php while ( have_posts() ) : the_post(); ?>

						<?php get_template_part( 'content', get_post_format() ); ?>

					<?php endwhile; ?>

				<?php else : ?>
					<article id="post-0" class="post error404 not-found">
						<header class="entry-header">
							<h1 class="entry-title"><?php _e( 'Nothing Found', 'minileven' ); ?></h1>
						</header><!-- .entry-header -->

						<div class="entry-content">
							<p><?php _e( 'Apologies, but no results were found for the requested archive. Perhaps searching will help find a related post.', 'minileven' ); ?></p>
							<?php get_search_form(); ?>
						</div><!-- .entry-content -->
					</article><!-- #post-0 -->

				<?php endif; ?>

			</div><!-- #content -->

			<?php minileven_content_nav( 'nav-below' ); ?>

		</div><!-- #primary -->
<?php get_footer(); ?>