<?php

/* Twitter Cards
 *
 * Hooks onto the Open Graph protocol and extends it by adding only the tags
 * we need for twitter cards.
 *
 * @see /wp-content/blog-plugins/open-graph.php
 * @see https://dev.twitter.com/docs/cards
 */
function wpcom_twitter_cards_tags( $og_tags ) {
	global $post, $wpdb;

	$og_tags['twitter:site'] = '@wordpressdotcom';

	if ( ! is_singular() || ! empty( $og_tags['twitter:card'] ) )
		return $og_tags;

	$img_count = 0;
	foreach ( $og_tags as $key => $value ) {
		if ( 'og:image' != $key || ! is_array( $value ) || empty( $value[0] ) )
			continue;

		$img_count = 0;
		foreach ( (array) $value as $counter => $image ) {
			$og_tags['twitter:image' . $counter] = $image;
			$img_count++;
			if ( $img_count >= 4 )
				break; // Only 4 images allowed
		}
	}

	// Figure out what kind of card this is, based on the number of images found
	if ( 0 == $img_count ) {
		// No images = summary
		$card = 'summary';
	} else if ( $img_count <= 3 ) {
		// < 4 images = photo
		$card = 'photo';
		$og_tags['twitter:image'] = $og_tags['twitter:image0']; // Rename back to photo format (from gallery)
		unset( $og_tags['twitter:image0'] );
		for ( $i = 1; $i < 4; $i++ ) {
			unset( $og_tags['twitter:image' . $i] ); // Remove >0 image references
		}
	} else if ( $img_count >= 4 ) {
		// >= 4 images = gallery
		$card = 'gallery';
	}
	$og_tags['twitter:card'] = $card;

	// If we have information on the author/creator, then include that as well
	if ( ! empty( $post ) && ! empty( $post->post_author ) ) {
		$handle = apply_filters( 'jetpack_sharing_twitter_via', '', $post->ID );
		if ( !empty( $handle ) )
			$og_tags['twitter:creator'] = '@' . $handle;
	}

	return $og_tags;
}

add_filter( 'jetpack_open_graph_tags', 'wpcom_twitter_cards_tags' );

function wpcom_twitter_cards_output( $og_tag ) {
	return ( false !== strpos( $og_tag, 'twitter:' ) ) ? preg_replace( '/property="([^"]+)"/', 'name="\1"', $og_tag ) : $og_tag;
}

add_filter( 'jetpack_open_graph_output', 'wpcom_twitter_cards_output' );
