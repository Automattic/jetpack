<?php
/**
 * Minileven functions and definitions
 *
 * Sets up the theme and provides some helper functions. Some helper functions
 * are used in the theme as custom template tags. Others are attached to action and
 * filter hooks in WordPress to change core functionality.
 *
 * The first function, minileven_setup(), sets up the theme by registering support
 * for various features in WordPress, such as post thumbnails, navigation menus, and the like.
 *
 * When using a child theme (see http://codex.wordpress.org/Theme_Development and
 * http://codex.wordpress.org/Child_Themes), you can override certain functions
 * (those wrapped in a function_exists() call) by defining them first in your child theme's
 * functions.php file. The child theme's functions.php file is included before the parent
 * theme's file, so the child theme functions would be used.
 *
 * Functions that are not pluggable (not wrapped in function_exists()) are instead attached
 * to a filter or action hook. The hook can be removed by using remove_action() or
 * remove_filter() and you can attach your own function to the hook.
 *
 * We can remove the parent theme's hook only after it is attached, which means we need to
 * wait until setting up the child theme:
 *
 * <code>
 * add_action( 'after_setup_theme', 'my_child_theme_setup' );
 * function my_child_theme_setup() {
 *     // We are providing our own filter for excerpt_length (or using the unfiltered value)
 *     remove_filter( 'excerpt_length', 'minileven_excerpt_length' );
 *     ...
 * }
 * </code>
 *
 * For more information on hooks, actions, and filters, see http://codex.wordpress.org/Plugin_API.
 *
 * @package Minileven
 */

/**
 * Set the content width based on the theme's design and stylesheet.
 */
if ( ! isset( $content_width ) )
	$content_width = 584;

/**
 * Tell WordPress to run minileven_setup() when the 'after_setup_theme' hook is run.
 */
add_action( 'after_setup_theme', 'minileven_setup' );

if ( ! function_exists( 'minileven_setup' ) ):
/**
 * Sets up theme defaults and registers support for various WordPress features.
 */
function minileven_setup() {
	global $wp_version;

	/* Make Minileven available for translation.
	 * Translations can be added to the /languages/ directory.
	 * If you're building a theme based on Minileven, use a find and replace
	 * to change 'minileven' to the name of your theme in all the template files.
	 */
	load_theme_textdomain( 'minileven', TEMPLATEPATH . '/languages' );

	// Add default posts and comments RSS feed links to <head>.
	add_theme_support( 'automatic-feed-links' );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menu( 'primary', __( 'Primary Menu', 'minileven' ) );

	// Add support for a variety of post formats
	add_theme_support( 'post-formats', array( 'gallery', 'image' ) );

	// Add support for custom backgrounds
	if ( version_compare( $wp_version, '3.4', '>=' ) )
		add_theme_support( 'custom-background' );
	else
		add_custom_background();

	// Add support for post thumbnails
	add_theme_support( 'post-thumbnails' );
}
endif; // minileven_setup

/**
 * Sets the post excerpt length to 40 words.
 *
 * To override this length in a child theme, remove the filter and add your own
 * function tied to the excerpt_length filter hook.
 */
function minileven_excerpt_length( $length ) {
	return 40;
}
add_filter( 'excerpt_length', 'minileven_excerpt_length' );

/**
 * Returns a "Continue Reading" link for excerpts
 */
function minileven_continue_reading_link() {
	return ' <a href="'. esc_url( get_permalink() ) . '">' . __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'minileven' ) . '</a>';
}

/**
 * Replaces "[...]" (appended to automatically generated excerpts) with an ellipsis and minileven_continue_reading_link().
 *
 * To override this in a child theme, remove the filter and add your own
 * function tied to the excerpt_more filter hook.
 */
function minileven_auto_excerpt_more( $more ) {
	return ' &hellip;' . minileven_continue_reading_link();
}
add_filter( 'excerpt_more', 'minileven_auto_excerpt_more' );

/**
 * Adds a pretty "Continue Reading" link to custom post excerpts.
 *
 * To override this link in a child theme, remove the filter and add your own
 * function tied to the get_the_excerpt filter hook.
 */
function minileven_custom_excerpt_more( $output ) {
	if ( has_excerpt() && ! is_attachment() ) {
		$output .= minileven_continue_reading_link();
	}
	return $output;
}
add_filter( 'get_the_excerpt', 'minileven_custom_excerpt_more' );

/**
 * Get our wp_nav_menu() fallback, wp_page_menu(), to show a home link.
 */
function minileven_page_menu_args( $args ) {
	$args['show_home'] = true;
	return $args;
}
add_filter( 'wp_page_menu_args', 'minileven_page_menu_args' );

/**
 * Register our sidebars and widgetized areas.
 * @since Minileven 1.0
 */
function minileven_widgets_init() {

	register_sidebar( array(
		'name' => __( 'Main Sidebar', 'minileven' ),
		'id' => 'sidebar-1',
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => "</aside>",
		'before_title' => '<h3 class="widget-title">',
		'after_title' => '</h3>',
	) );
}
add_action( 'widgets_init', 'minileven_widgets_init' );

/**
 * Display navigation to next/previous pages when applicable
 */
function minileven_content_nav( $nav_id ) {
	global $wp_query;

	if ( $wp_query->max_num_pages > 1 ) : ?>
		<nav id="<?php echo $nav_id; ?>">
			<h3 class="assistive-text"><?php _e( 'Post navigation', 'minileven' ); ?></h3>
			<div class="nav-previous"><?php next_posts_link( __( '<span class="meta-nav">&laquo;</span> Older', 'minileven' ) ); ?></div>
			<div class="nav-next"><?php previous_posts_link( __( 'Newer <span class="meta-nav">&raquo;</span>', 'minileven' ) ); ?></div>
		</nav><!-- #nav-above -->
	<?php endif;
}

if ( ! function_exists( 'minileven_comment' ) ) :
/**
 * Template for comments and pingbacks.
 *
 * To override this walker in a child theme without modifying the comments template
 * simply create your own minileven_comment(), and that function will be used instead.
 *
 * Used as a callback by wp_list_comments() for displaying the comments.
 *
 * @since Minileven 1.0
 */
function minileven_comment( $comment, $args, $depth ) {
	$GLOBALS['comment'] = $comment;
	switch ( $comment->comment_type ) :
		case 'pingback' :
		case 'trackback' :
	?>
	<li class="post pingback">
		<p><?php _e( 'Pingback:', 'minileven' ); ?> <?php comment_author_link(); ?></p>
	<?php
			break;
		default :
	?>
	<li <?php comment_class(); ?> id="li-comment-<?php comment_ID(); ?>">
		<article id="comment-<?php comment_ID(); ?>" class="comment">
			<footer class="comment-meta">
				<div class="comment-author vcard">
					<?php
						$avatar_size = 32;
						if ( '0' != $comment->comment_parent )
							$avatar_size = 24;

						echo get_avatar( $comment, $avatar_size );

						/* translators: 1: comment author, 2: date and time */
						printf( __( '%1$s on %2$s', 'minileven' ),
							sprintf( '<span class="fn">%s</span>', get_comment_author_link() ),
							sprintf( '<a href="%1$s"><time pubdate datetime="%2$s">%3$s</time></a>',
								esc_url( get_comment_link( $comment->comment_ID ) ),
								get_comment_time( 'c' ),
								/* translators: 1: date, 2: time */
								sprintf( __( '%1$s at %2$s', 'minileven' ), get_comment_date(), get_comment_time() )
							)
						);
					?>

					<?php edit_comment_link( __( 'Edit', 'minileven' ), '<span class="edit-link">', '</span>' ); ?>
				</div><!-- .comment-author .vcard -->

				<?php if ( $comment->comment_approved == '0' ) : ?>
					<em class="comment-awaiting-moderation"><?php _e( 'Your comment is awaiting moderation.', 'minileven' ); ?></em>
					<br />
				<?php endif; ?>

			</footer>

			<div class="comment-content"><?php comment_text(); ?></div>

			<div class="reply">
				<?php comment_reply_link( array_merge( $args, array( 'reply_text' => __( 'Reply <span>&darr;</span>', 'minileven' ), 'depth' => $depth, 'max_depth' => $args['max_depth'] ) ) ); ?>
			</div><!-- .reply -->
		</article><!-- #comment-## -->

	<?php
			break;
	endswitch;
}
endif; // ends check for minileven_comment()

if ( ! function_exists( 'minileven_posted_on' ) ) :
/**
 * Prints HTML with meta information for the current post-date/time and author.
 * Create your own minileven_posted_on to override in a child theme
 *
 * @since Minileven 1.0
 */
function minileven_posted_on() {
	printf( __( '<span class="entry-date"><a href="%1$s" title="%2$s" rel="bookmark"><time datetime="%3$s" pubdate>%4$s</time></a></span>', 'minileven' ),
		esc_url( get_permalink() ),
		esc_attr( get_the_time() ),
		esc_attr( get_the_date( 'c' ) ),
		esc_html( get_the_date() )
	);
}
endif;

function minileven_posts_per_page() {
		return 5;
}
add_filter('pre_option_posts_per_page', 'minileven_posts_per_page');

// WPCOM functions

/* This function determines the actual theme the user is using. */
function minileven_actual_current_theme() {
	if ( function_exists( 'jetpack_mobile_template' ) )
		remove_action( 'option_template', 'jetpack_mobile_template' );

	$template = get_option( 'template' );

	if ( function_exists( 'jetpack_mobile_template' ) )
		add_action( 'option_template', 'jetpack_mobile_template' );

	return $template;
}

/* This function grabs the custom header from the current theme so that Minileven can display it. */
function minileven_get_header_image() {
	$theme_slug = minileven_actual_current_theme();
	$mods = get_option( "theme_mods_{$theme_slug}" );

	if ( isset( $mods['header_image'] ) && 'remove-header' != $mods['header_image'] && 'random-default-image' != $mods['header_image'] && 'random-uploaded-image' != $mods['header_image'] )
		return $mods['header_image'];

	return false;
}

/* This function determines whether or not the user is displaying the header on the current theme */
function minileven_header_text_display() {
	$theme_slug = minileven_actual_current_theme();
	$mods = get_option( "theme_mods_{$theme_slug}" );

	if ( isset( $mods['header_textcolor'] ) )
		return $mods['header_textcolor'];

	return false;
}


/* This function grabs the location of the custom menus from the current theme. If no menu is set in a location
*  it will return a boolean "false". This function helps Minileven know which custom menu to display. */
function minileven_get_menu_location() {
	$theme_slug = minileven_actual_current_theme();
	$mods = get_option( "theme_mods_{$theme_slug}" );

	if ( isset( $mods['nav_menu_locations'] ) && ! empty( $mods['nav_menu_locations'] ) )
		return $mods['nav_menu_locations'];

	return false;
}

/* This function grabs the custom background image from the user's current theme so that Minileven can display it. */
function minileven_get_background() {
	$theme_slug = minileven_actual_current_theme();
	$mods = get_option( "theme_mods_$theme_slug" );

	if ( ! empty( $mods ) ) {
		return array(
			'color' => isset( $mods['background_color'] ) ? $mods['background_color'] : null,
			'image' => isset( $mods['background_image'] ) ? $mods['background_image'] : null,
			'repeat' => isset( $mods['background_repeat'] ) ? $mods['background_repeat'] : null,
			'position' => isset( $mods['background_position_x'] ) ? $mods['background_position_x'] : null,
			'attachment' => isset( $mods['attachment'] ) ? $mods['attachment'] : null,
		);
	}

	return false;
}

/**
 * Enqueue the small menu js file
 */
function minileven_scripts() {
	wp_enqueue_script( 'small-menu', get_template_directory_uri() . '/js/small-menu.js', array( 'jquery' ), '20120615', true );
}
add_action( 'wp_enqueue_scripts', 'minileven_scripts' );