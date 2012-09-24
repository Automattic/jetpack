<?php
/**
 * The Header for our theme.
 *
 * Displays all of the <head> section and everything up till <div id="main">
 *
 * @package Minileven
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>" />
<meta name="viewport" content="width=device-width" />
<title><?php
	/*
	 * Print the <title> tag based on what is being viewed.
	 */
	global $page, $paged;

	wp_title( '|', true, 'right' );

	// Add the blog name.
	bloginfo( 'name' );

	// Add the blog description for the home/front page.
	$site_description = get_bloginfo( 'description', 'display' );
	if ( $site_description && ( is_home() || is_front_page() ) )
		echo " | $site_description";

	// Add a page number if necessary:
	if ( $paged >= 2 || $page >= 2 )
		echo ' | ' . sprintf( __( 'Page %s', 'jetpack' ), max( $paged, $page ) );

	?></title>
<link rel="profile" href="http://gmpg.org/xfn/11" />
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />
<?php wp_head(); ?>

<body <?php body_class(); ?>>
<div id="wrapper">
<div id="page" class="hfeed">
	<header id="branding" role="banner">
	<?php
		minileven_header();
		$location = minileven_get_menu_location(); // get the menu locations from the current theme in use
	?>
		<div class="menu-search">
			<nav id="access" role="navigation">
				<div class="menu-handle">
					<h3 class="assistive-text"><?php _e( 'Menu', 'jetpack' ); ?></h3>
				</div><!-- .menu-handle -->
				<?php /*  Allow screen readers / text browsers to skip the navigation menu and get right to the good stuff. */ ?>
				<div class="skip-link"><a class="assistive-text" href="#content" title="<?php esc_attr_e( 'Skip to primary content', 'jetpack' ); ?>"><?php _e( 'Skip to primary content', 'minileven' , 'jetpack'); ?></a></div>
				<?php /* Our navigation menu.  If one isn't filled out, wp_nav_menu falls back to wp_page_menu. The menu assiged to the primary position is the one used. If none is assigned, the menu with the lowest ID is used. */
					if ( false !== $location ) :
						$menu_id = array_shift( array_values( $location ) ); // acccess the ID of the menu assigned to that location. Using only the first menu ID returned in the array.
						wp_nav_menu( array( 'theme_location' => 'primary', 'menu' => $menu_id ) );
					else: // if the $location variable is false, wp_page_menu() is shown instead.
						wp_nav_menu( array( 'theme_location' => 'primary' ) );
					endif;
				?>
			</nav><!-- #access -->
			<div class="search-form">
				<?php get_search_form(); ?>
			</div><!-- .search-form-->
		</div><!-- .menu-search-->
	</header><!-- #branding -->

	<div id="main">