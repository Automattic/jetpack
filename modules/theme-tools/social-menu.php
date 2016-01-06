<?php
/**
 * Social Menu.
 *
 * This feature will only be activated for themes that declare their support.
 * This can be done by adding code similar to the following during the
 * 'after_setup_theme' action:
 *
 * add_theme_support( 'jetpack-social-menu' );
 */

/**
 * Activate the Social Menu plugin.
 *
 * @uses current_theme_supports()
 */
function jetpack_social_menu_init() {
	// Only load our code if our theme declares support
	if ( ! current_theme_supports( 'jetpack-social-menu' ) ) {
		return;
	}

	/*
	 * Social Menu description.
	 *
	 * Rename the social menu description.
	 *
	 * @module theme-tools
	 *
	 * @since 3.9.0
	 *
	 * @param string $social_menu_description Social Menu description
	 */
	$social_menu_description = apply_filters( 'jetpack_social_menu_description', __( 'Social Menu', 'jetpack' ) );

	// Register a new menu location
	register_nav_menus( array(
		'jetpack-social-menu' => esc_html( $social_menu_description ),
	) );

	// Enqueue CSS
	add_action( 'wp_enqueue_scripts', 'jetpack_social_menu_style' );
}
add_action( 'after_setup_theme', 'jetpack_social_menu_init', 99 );

/* Function to enqueue CSS */
function jetpack_social_menu_style() {
	if ( has_nav_menu( 'jetpack-social-menu' ) ) {
		wp_enqueue_style( 'jetpack-social-menu', plugins_url( 'social-menu/social-menu.css', __FILE__ ), array( 'genericons' ), '1.0' );
	}
}

/* Create the function */
function jetpack_social_menu() {
	if ( has_nav_menu( 'jetpack-social-menu' ) ) : ?>
		<nav class="jetpack-social-navigation" role="navigation">
			<?php
				wp_nav_menu( array(
					'theme_location'  => 'jetpack-social-menu',
					'link_before'     => '<span class="screen-reader-text">',
					'link_after'      => '</span>',
					'depth'           => 1,
				) );
			?>
		</nav><!-- .jetpack-social-navigation -->
	<?php endif;
}
