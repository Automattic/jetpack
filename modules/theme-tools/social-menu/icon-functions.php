<?php
/**
 * SVG icons related functions and filters
 */

if ( ! function_exists( 'jetpack_social_menu_include_svg_icons' ) ) :
/**
 * Add SVG definitions to the footer.
 */
function jetpack_social_menu_include_svg_icons() {
	// Define SVG sprite file.
	$svg_icons = dirname( __FILE__ ) . '/social-menu.svg';

	// If it exists, include it.
	if ( file_exists( $svg_icons ) ) {
		require_once( $svg_icons );
	}
}
add_action( 'wp_footer', 'jetpack_social_menu_include_svg_icons', 9999 );
endif;

if ( ! function_exists( 'jetpack_social_menu_get_svg' ) ) :
/**
 * Return SVG markup.
 *
 * @param array $args {
 *     Parameters needed to display an SVG.
 *
 *     @type string $icon  Required SVG icon filename.
 * }
 * @return string SVG markup.
 */
function jetpack_social_menu_get_svg( $args = array() ) {
	// Make sure $args are an array.
	if ( empty( $args ) ) {
		return esc_html__( 'Please define default parameters in the form of an array.', 'jetpack' );
	}

	// Define an icon.
	if ( false === array_key_exists( 'icon', $args ) ) {
		return esc_html__( 'Please define an SVG icon filename.', 'jetpack' );
	}

	// Set defaults.
	$defaults = array(
		'icon'     => '',
		'fallback' => false,
	);

	// Parse args.
	$args = wp_parse_args( $args, $defaults );

	// Set aria hidden.
	$aria_hidden = ' aria-hidden="true"';

	// Begin SVG markup.
	$svg = '<svg class="icon icon-' . esc_attr( $args['icon'] ) . '"' . $aria_hidden . ' role="img">';

	/*
	 * Display the icon.
	 *
	 * The whitespace around `<use>` is intentional - it is a work around to a keyboard navigation bug in Safari 10.
	 *
	 * See https://core.trac.wordpress.org/ticket/38387.
	 */
	$svg .= ' <use href="#icon-' . esc_html( $args['icon'] ) . '" xlink:href="#icon-' . esc_html( $args['icon'] ) . '"></use> ';

	// Add some markup to use as a fallback for browsers that do not support SVGs.
	if ( $args['fallback'] ) {
		$svg .= '<span class="svg-fallback icon-' . esc_attr( $args['icon'] ) . '"></span>';
	}

	$svg .= '</svg>';

	return $svg;
}
endif;

if ( ! function_exists( 'jetpack_social_menu_nav_menu_social_icons' ) ) :
/**
 * Display SVG icons in social links menu.
 *
 * @param  string  $item_output The menu item output.
 * @param  WP_Post $item        Menu item object.
 * @param  int     $depth       Depth of the menu.
 * @param  array   $args        wp_nav_menu() arguments.
 * @return string  $item_output The menu item output with social icon.
 */
function jetpack_social_menu_nav_menu_social_icons( $item_output, $item, $depth, $args ) {
	// Get supported social icons.
	$social_icons = jetpack_social_menu_social_links_icons();

	// Change SVG icon inside social links menu if there is supported URL.
	if ( 'jetpack-social-menu' === $args->theme_location ) {
		foreach ( $social_icons as $attr => $value ) {
			if ( false !== strpos( $item_output, $attr ) ) {
				$item_output = str_replace( $args->link_after, '</span>' . jetpack_social_menu_get_svg( array( 'icon' => esc_attr( $value ) ) ), $item_output );
			}
		}
	}

	return $item_output;
}
add_filter( 'walker_nav_menu_start_el', 'jetpack_social_menu_nav_menu_social_icons', 10, 4 );
endif;

if ( ! function_exists( 'jetpack_social_menu_social_links_icons' ) ) :
/**
 * Returns an array of supported social links (URL and icon name).
 *
 * @return array $social_links_icons
 */
function jetpack_social_menu_social_links_icons() {
	// Supported social links icons.
	$social_links_icons = array(
		'500px.com'       => '500px',
		'amazon.cn'       => 'amazon',
		'amazon.in'       => 'amazon',
		'amazon.fr'       => 'amazon',
		'amazon.de'       => 'amazon',
		'amazon.it'       => 'amazon',
		'amazon.nl'       => 'amazon',
		'amazon.es'       => 'amazon',
		'amazon.co'       => 'amazon',
		'amazon.ca'       => 'amazon',
		'amazon.com'      => 'amazon',
		'apple.com'       => 'apple',
		'itunes.com'      => 'apple',
		'bandcamp.com'    => 'bandcamp',
		'behance.net'     => 'behance',
		'codepen.io'      => 'codepen',
		'deviantart.com'  => 'deviantart',
		'digg.com'        => 'digg',
		'dribbble.com'    => 'dribbble',
		'dropbox.com'     => 'dropbox',
		'etsy.com'        => 'etsy',
		'facebook.com'    => 'facebook',
		'/feed/'          => 'feed',
		'flickr.com'      => 'flickr',
		'foursquare.com'  => 'foursquare',
		'goodreads.com'   => 'goodreads',
		'plus.google.com' => 'google-plus',
		'google.com'      => 'google',
		'github.com'      => 'github',
		'instagram.com'   => 'instagram',
		'linkedin.com'    => 'linkedin',
		'mailto:'         => 'mail',
		'meetup.com'      => 'meetup',
		'medium.com'      => 'medium',
		'pinterest.com'   => 'pinterest',
		'getpocket.com'   => 'pocket',
		'reddit.com'      => 'reddit',
		'skype.com'       => 'skype',
		'skype:'          => 'skype',
		'slideshare.net'  => 'slideshare',
		'snapchat.com'    => 'snapchat',
		'soundcloud.com'  => 'soundcloud',
		'spotify.com'     => 'spotify',
		'stumbleupon.com' => 'stumbleupon',
		'tumblr.com'      => 'tumblr',
		'twitch.tv'       => 'twitch',
		'twitter.com'     => 'twitter',
		'vimeo.com'       => 'vimeo',
		'vk.com'          => 'vk',
		'wordpress.org'   => 'wordpress',
		'wordpress.com'   => 'wordpress',
		'yelp.com'        => 'yelp',
		'youtube.com'     => 'youtube',
	);

	return $social_links_icons;
}
endif;
