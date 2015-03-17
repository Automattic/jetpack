<?php


if( ! function_exists( 'jetpack_has_site_icon' ) ) :
function jetpack_has_site_icon( $blog_id = null ) {

	if( ! is_int( $blog_id ) )
		$blog_id = get_current_blog_id();

	if( jetpack_site_icon_url( $blog_id, 512, '' ) ) {
		return true;
	}

	return false;
}
endif;

if( ! function_exists( 'jetpack_get_site_icon' ) ) :
function jetpack_get_site_icon( $blog_id = null, $size = '512', $default = '', $alt = false ) {

	if( ! is_int( $blog_id ) )
		$blog_id = get_current_blog_id();

	$size  = esc_attr( $size );
	$class = "avatar avatar-$size";
	$alt = ( $alt ? esc_attr( $alt ) : __( 'Site Icon', 'jetpack' ) );
	$src = esc_url( jetpack_site_icon_url( $blog_id, $size, $default ) );
	$avatar = "<img alt='{$alt}' src='{$src}' class='$class' height='{$size}' width='{$size}' />";
	/**
	 * Filters the display options for the Site Icon.
	 *
	 * @since 3.2.0
	 *
	 * @param string $avatar The Site Icon in an html image tag.
	 * @param int    $blog_id The local site Blog ID.
	 * @param string $size The size of the Site Icon, default is 512.
	 * @param string $default The default URL for the Site Icon.
	 * @param string $alt The alt tag for the avatar.
	 */
	return apply_filters( 'jetpack-get_site_icon', $avatar, $blog_id, $size, $default, $alt );
}
endif;

if( ! function_exists( 'jetpack_site_icon_url' ) ) :
function jetpack_site_icon_url( $blog_id = null, $size = '512', $default = false ) {
	$url = '';
	if( ! is_int( $blog_id ) )
		$blog_id = get_current_blog_id();

	if( function_exists( 'get_blog_option' ) ) {
		$site_icon_id = get_blog_option( $blog_id, 'jetpack_site_icon_id' );
	} else {
		$site_icon_id = Jetpack_Options::get_option( 'site_icon_id' );
	}

	if( ! $site_icon_id  ) {
		if( $default === false && defined( 'SITE_ICON_DEFAULT_URL' ) )
			$url =  SITE_ICON_DEFAULT_URL;
		else
			$url = $default;
	} else {
		if( $size >= 512 ) {
			$size_data = 'full';
		} else {
			$size_data = array( $size, $size );
		}
		$url_data = wp_get_attachment_image_src( $site_icon_id, $size_data );
		$url = $url_data[0];
	}

	return $url;
}
endif;
