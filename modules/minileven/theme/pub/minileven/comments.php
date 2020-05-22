<?php
/**
 * The template for displaying Comments.
 *
 * The area of the page that contains both current comments
 * and the comment form. The actual display of comments is
 * handled by a callback to minileven_comment() which is
 * located in the functions.php file.
 *
 * @package Minileven
 */
?>
	<div id="comments">
	<?php if ( post_password_required() ) : ?>
		<p class="nopassword"><?php _e( 'This post is password protected. Enter the password to view any comments.', 'jetpack' ); ?></p>
	</div><!-- #comments -->
	<?php
			/* Stop the rest of comments.php from being processed,
			 * but don't kill the script entirely -- we still have
			 * to fully load the template.
			 */
			return;
		endif;
	?>

	<?php // You can start editing here -- including this comment! ?>

	<?php comment_form(); ?>

	<?php if ( have_comments() ) : ?>
		<ol class="commentlist">
			<?php
				/* Loop through and list the comments. Tell wp_list_comments()
				 * to use minileven_comment() to format the comments.
				 * If you want to overload this in a child theme then you can
				 * define minileven_comment() and that will be used instead.
				 * See minileven_comment() in minileven/functions.php for more.
				 */
				wp_list_comments( array( 'callback' => 'minileven_comment' ) );
			?>
		</ol>

		<?php if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) : // are there comments to navigate through ?>
		<nav id="comment-nav-below">
			<h1 class="assistive-text"><?php _e( 'Comment navigation', 'jetpack' ); ?></h1>
			<div class="nav-previous"><?php previous_comments_link( __( '&larr; Older Comments', 'jetpack' ) ); ?></div>
			<div class="nav-next"><?php next_comments_link( __( 'Newer Comments &rarr;', 'jetpack' ) ); ?></div>
		</nav>
		<?php endif; // check for comment navigation
			endif; // check for the existence of comments
		?>
	</div><!-- #comments -->