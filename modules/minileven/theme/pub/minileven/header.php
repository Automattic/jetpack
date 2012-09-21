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
		echo ' | ' . sprintf( __( 'Page %s', 'minileven' ), max( $paged, $page ) );

	?></title>
<link rel="profile" href="http://gmpg.org/xfn/11" />
<link rel="stylesheet" type="text/css" media="all" href="<?php bloginfo( 'stylesheet_url' ); ?>" />
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />
<?php
	/* We add some JavaScript to pages with the comment form
	 * to support sites with threaded comments (when in use).
	 */
	if ( is_singular() && get_option( 'thread_comments' ) )
		wp_enqueue_script( 'comment-reply' );

	/* Always have wp_head() just before the closing </head>
	 * tag of your theme, or you will break many plugins, which
	 * generally use this hook to add elements to <head> such
	 * as styles, scripts, and meta tags.
	 */
	wp_head();
?>
</head>


<?php
	$background = minileven_get_background();

	if ( $background['color'] || $background['image'] ) {
		$style = $background['color'] ? "background-color: #$background[color];" : '';

		if ( $background['image'] ) {
			$image = " background-image: url('$background[image]');";

			if ( ! in_array( $background['repeat'], array( 'no-repeat', 'repeat-x', 'repeat-y', 'repeat' ) ) )
				$background['repeat'] = 'repeat';
			$repeat = " background-repeat: $background[repeat];";

			if ( ! in_array( $background['position'], array( 'center', 'right', 'left' ) ) )
				$background['position'] = 'left';
			$position = " background-position: top $background[position];";

			if ( ! in_array( $background['attachment'], array( 'fixed', 'scroll' ) ) )
				$background['attachment'] = 'scroll';
			$attachment = " background-attachment: $background[attachment];";

			$style .= $image . $repeat . $position . $attachment;
		}
?>
	<style type="text/css">
		body { <?php echo trim( $style ); ?> }
		#page { margin: 0.6em 0.6em 0.8em; }
		#site-generator { border: 0; }
	</style>
<?php
	}
?>

<body <?php body_class(); ?>>
<div id="wrapper">
<div id="page" class="hfeed">
	<header id="branding" role="banner">
	<?php
		$header_image = minileven_get_header_image();
		$header_text = minileven_header_text_display();

		if  ( minileven_get_header_image() )
			list( $width ) = getimagesize( $header_image );
	?>
		<?php // Display small header images floated to the left of the site title
			if ( false !== $header_image && $width < 115) : ?>
				<div id="header-logo">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
						<img src="<?php echo $header_image; ?>" alt="" />
					</a>
				</div><!-- #header-logo -->
			<?php endif; // end check for header images that are less than 115px wide ?>

			<?php if ( 'blank' != $header_text ) : ?>
				<hgroup>
					<h1 id="site-title"><span><a href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></span></h1>
					<h2 id="site-description"><?php bloginfo( 'description' ); ?></h2>
				</hgroup>
			<?php endif; ?>

			<?php // Display standard size header images below the site title
				if ( false !== $header_image && $width >= 115) : ?>
					<div id="header-img">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
							<img src="<?php echo $header_image; ?>" alt="" />
						</a>
					</div><!-- #header-img -->
			<?php endif; // end check for header images that are at least 115px wide ?>

		<?php $location = minileven_get_menu_location(); // get the menu locations from the current theme in use ?>

		<div class="menu-search">
			<nav id="access" role="navigation">
				<div class="menu-handle">
					<h3 class="assistive-text"><?php _e( 'Menu', 'minileven' ); ?></h3>
				</div><!-- .menu-handle -->
				<?php /*  Allow screen readers / text browsers to skip the navigation menu and get right to the good stuff. */ ?>
				<div class="skip-link"><a class="assistive-text" href="#content" title="<?php esc_attr_e( 'Skip to primary content', 'minileven' ); ?>"><?php _e( 'Skip to primary content', 'minileven' ); ?></a></div>
				<?php /* Our navigation menu.  If one isn't filled out, wp_nav_menu falls back to wp_page_menu. The menu assiged to the primary position is the one used. If none is assigned, the menu with the lowest ID is used. */
					if ( false !== $location ) :
						$menu_id = array_shift( array_values( $location ) ); // acccess the ID of the menu assigned to that location. Using only the first menu ID returned in the array. ?>
						<?php wp_nav_menu( array( 'theme_location' => 'primary', 'menu' => $menu_id ) ); ?>
					<?php else: // if the $location variable is false, wp_page_menu() is shown instead. ?>
						<?php wp_nav_menu( array( 'theme_location' => 'primary' ) ); ?>
					<?php endif; ?>
			</nav><!-- #access -->
			<div class="search-form">
				<?php get_search_form(); ?>
			</div><!-- .search-form-->
		</div><!-- .menu-search-->
	</header><!-- #branding -->

	<div id="main">