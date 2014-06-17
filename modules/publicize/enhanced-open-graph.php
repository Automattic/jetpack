<?php
if ( ! class_exists( 'Jetpack_Media_Summary' ) && defined('IS_WPCOM') && IS_WPCOM )
	include WP_CONTENT_DIR . '/lib/class.wpcom-media-summary.php';

/**
 * Better OG Image Tags for Image Post Formats
 */
function enhanced_og_image( $tags ) {
	if ( !is_singular() || post_password_required() )
		return $tags;

	global $post;

	// Always favor featured images.
	if ( enhanced_og_has_featured_image( $post->ID ) )
		return $tags;

	$summary = Jetpack_Media_Summary::get( $post->ID );

	if ( 'image' != $summary['type'] )
		return $tags;

	$tags['og:image'] = $summary['image'];
	$tags['og:image:secure_url'] = $summary['secure']['image'];

	return $tags;
}
add_filter( 'jetpack_open_graph_tags', 'enhanced_og_image' );

/**
 * Better OG Image Tags for Gallery Post Formats
 */
function enhanced_og_gallery( $tags ) {
	if ( !is_singular() || post_password_required() )
		return $tags;

	global $post;

	// Always favor featured images.
	if ( enhanced_og_has_featured_image( $post->ID ) )
		return $tags;

	$summary = Jetpack_Media_Summary::get( $post->ID );

	if ( 'gallery' != $summary['type'] )
		return $tags;

	if( ! isset( $summary['images'] ) || ! is_array( $summary['images'] ) || empty( $summary['images'] ) )
		return $tags;

	$images = $secures = array();
	foreach ( $summary['images'] as $i => $image ) {
		$images[] = $image['url'];
		$secures[] = $summary['secure']['images'][$i]['url'];
	}

	$tags['og:image'] = $images;
	$tags['og:image:secure_url'] = $secures;

	return $tags;
}
add_filter( 'jetpack_open_graph_tags', 'enhanced_og_gallery' );

/**
 * Allows VideoPress, YouTube, and Vimeo videos to play inline on Facebook
 */
function enhanced_og_video( $tags ) {
	if ( !is_singular() || post_password_required() )
		return $tags;

	global $post;

	// Always favor featured images.
	if ( enhanced_og_has_featured_image( $post->ID ) )
		return $tags;

	$summary = Jetpack_Media_Summary::get( $post->ID );

	if ( 'video' != $summary['type'] ) {
		if ( $summary['count']['video'] > 0 && $summary['count']['image'] < 1 ) {
			$tags['og:image']            = $summary['image'];
			$tags['og:image:secure_url'] = $summary['secure']['image'];
		}
		return $tags;
	}

	$tags['og:image']            = $summary['image'];
	$tags['og:image:secure_url'] = $summary['secure']['image'];
	$tags['og:video:type']       = 'application/x-shockwave-flash';

	$video_url        = $summary['video'];
	$secure_video_url = $summary['secure']['video'];

	if ( preg_match( '/((youtube|vimeo)\.com|youtu.be)/', $video_url ) ) {
		if ( strstr( $video_url, 'youtube' ) ) {
			$id = get_youtube_id( $video_url );
			$video_url = 'http://www.youtube.com/v/' . $id . '?version=3&autohide=1';
			$secure_video_url = 'https://www.youtube.com/v/' . $id . '?version=3&autohide=1';
		} else if ( strstr( $video_url, 'vimeo' ) ) {
			preg_match( '|vimeo\.com/(\d+)/?$|i', $video_url, $match );
			$id = (int) $match[1];
			$video_url = 'http://vimeo.com/moogaloop.swf?clip_id=' . $id;
			$secure_video_url = 'https://vimeo.com/moogaloop.swf?clip_id=' . $id;
		}
	}

	$tags['og:video']            = $video_url;
	$tags['og:video:secure_url'] = $secure_video_url;

	if ( empty( $post->post_title ) )
		$tags['og:title'] = sprintf( __( 'Video on %s', 'jetpack' ), get_option( 'blogname' ) );

	return $tags;
}
add_filter( 'jetpack_open_graph_tags', 'enhanced_og_video' );

function enhanced_og_has_featured_image( $post_id ) {
	$featured = Jetpack_PostImages::from_thumbnail( $post_id, 200, 200 );
	if ( !empty( $featured ) && count( $featured ) > 0 )
		return true;
	return false;
}
