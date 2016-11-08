<?php

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
