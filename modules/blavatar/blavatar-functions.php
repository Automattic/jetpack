<?php 


if( ! function_exists( 'has_blavatar' ) ) :
function has_blavatar( $blog_id = null ) {

	if( ! is_int( $blog_id ) )
		$blog_id = get_current_blog_id();

	if( blavatar_url( $blog_id, 96, '' ) ) {
		return true;
	}

	return false;
}
endif;

if( ! function_exists( 'get_blavatar' ) ) :
function get_blavatar( $blog_id = null, $size = '96', $default = '', $alt = false ) {

	if( ! is_int( $blog_id ) )
		$blog_id = get_current_blog_id();

	$size  = esc_attr( $size );
	$class = "avatar avatar-$size";
	$alt = ( $alt ? esc_attr( $alt ) : __( 'Blog Image', 'jetpack' ) );
	$src = esc_url( blavatar_url( $blog_id, $size, $default ) );
	$avatar = "<img alt='{$alt}' src='{$src}' class='$class' height='{$size}' width='{$size}' />";

	return apply_filters( 'get_blavatar', $avatar, $blog_id, $size, $default, $alt );
}
endif; 

if( ! function_exists( 'blavatar_url' ) ) :
function blavatar_url( $blog_id = null, $size = '96', $default = false ) {
	$url = '';
	if( ! is_int( $blog_id ) )
		$blog_id = get_current_blog_id();

	if( function_exists( 'get_blog_option' ) ) {
		$blavatar_id = get_blog_option( $blog_id, 'blavatar_id' );
	} else {
		$blavatar_id = get_option( 'blavatar_id' );
	}
	
	if( ! $blavatar_id  ) {
		if( $default === false && defined( 'BLAVATAR_DEFAULT_URL' ) )
			$url =  BLAVATAR_DEFAULT_URL;
		else
			$url = $default;
	} else {

		$url_data = wp_get_attachment_image_src( $blavatar_id, array( $size, $size ) );
		$url = $url_data[0];
	}

	return $url;
}
endif; 