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
<title><?php wp_title( '|', true, 'right' ); ?></title>
<link rel="profile" href="http://gmpg.org/xfn/11" />
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />
<?php wp_head(); ?>

<body <?php body_class(); ?>>
<div id="wrapper">
	<?php
		$location = minileven_get_menu_location(); // get the menu locations from the current theme in use
	?>
		<div class="menu-search">
			<nav id="access" class="site-navigation main-navigation" role="navigation">
				<h3 class="menu-toggle"><?php _e( 'Menu', 'jetpack' ); ?></h3>

				<?php /*  Allow screen readers / text browsers to skip the navigation menu and get right to the good stuff. */ ?>
				<div class="skip-link"><a class="assistive-text" href="#content"><?php _e( 'Skip to primary content', 'minileven' , 'jetpack'); ?></a></div>
				<?php /* Our navigation menu.  If one isn't filled out, wp_nav_menu falls back to wp_page_menu. The menu assiged to the primary position is the one used. If none is assigned, the menu with the lowest ID is used. */
					if ( false !== $location ) :
						$location_values = array_values( $location );
						$menu_id = array_shift( $location_values ); // acccess the ID of the menu assigned to that location. Using only the first menu ID returned in the array.
						wp_nav_menu( array( 'theme_location' => 'primary', 'container_class' => '', 'menu_class' => 'nav-menu', 'menu' => $menu_id ) );
					else: // if the $location variable is false, wp_page_menu() is shown instead.
						wp_nav_menu( array( 'theme_location' => 'primary', 'container_class' => '', 'menu_class' => 'nav-menu' ) );
					endif;
				?>
			</nav><!-- #access -->
			<div class="search-form">
				<?php get_search_form(); ?>
			</div><!-- .search-form-->
		</div><!-- .menu-search-->

	<?php if ( function_exists( 'minileven_header' ) )
		minileven_header();
	?>

	<div id="page" class="hfeed">
		<div id="main">
