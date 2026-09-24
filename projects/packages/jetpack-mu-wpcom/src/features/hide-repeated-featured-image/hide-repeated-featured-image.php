<?php
/**
 * Hide the featured image on a single post or page when the content opens with the same photo.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Whether the post's content opens with its featured image.
 *
 * Text before the photo means the featured image works as a header, so both stay.
 *
 * @param int $post_id Post ID.
 * @return bool
 */
function wpcom_post_opens_with_featured_image( int $post_id ): bool {
	$thumbnail_id = (int) get_post_thumbnail_id( $post_id );
	if ( ! $thumbnail_id ) {
		return false;
	}

	$processor = new WP_HTML_Tag_Processor( (string) get_post_field( 'post_content', $post_id, 'raw' ) );

	while ( $processor->next_token() ) {
		$token = $processor->get_token_name();

		if ( '#comment' === $token ) {
			// Self-closing block comments are dynamic blocks such as a paywall, which render content the raw markup lacks.
			$comment = trim( $processor->get_modifiable_text() );
			if ( 'nextpage' === $comment || str_ends_with( $comment, '/' ) ) {
				return false;
			}
			continue;
		}

		if ( '#text' === $token ) {
			// Classic posts wrap a captioned image in [caption], which readers never see.
			$text = (string) preg_replace( '/\[\/?caption[^\]]*\]/', '', $processor->get_modifiable_text() );
			if ( '' !== trim( str_replace( "\u{00A0}", ' ', $text ) ) ) {
				return false;
			}
			continue;
		}

		if ( $processor->is_tag_closer() ) {
			continue;
		}

		if ( 'IMG' === $token ) {
			return wpcom_featured_image_tag_is_attachment( $processor, $thumbnail_id );
		}

		if ( in_array( $token, array( 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'EMBED' ), true ) ) {
			return false;
		}
	}

	return false;
}

/**
 * Whether the image the processor is on shows the given attachment.
 *
 * Imported posts often lack the wp-image-{id} class, so the file path is the fallback.
 *
 * @param WP_HTML_Tag_Processor $processor     Processor positioned on an IMG tag.
 * @param int                   $attachment_id Attachment ID.
 * @return bool
 */
function wpcom_featured_image_tag_is_attachment( WP_HTML_Tag_Processor $processor, int $attachment_id ): bool {
	$class = $processor->get_attribute( 'class' );
	if ( is_string( $class ) && preg_match( '/(?:^|\s)wp-image-' . $attachment_id . '(?:\s|$)/', $class ) ) {
		return true;
	}

	$src            = $processor->get_attribute( 'src' );
	$attachment_url = wp_get_attachment_url( $attachment_id );
	if ( ! is_string( $src ) || '' === $src || ! $attachment_url ) {
		return false;
	}

	$src_key = wpcom_featured_image_path_key( $src );

	return '' !== $src_key && wpcom_featured_image_path_key( $attachment_url ) === $src_key;
}

/**
 * The last three path segments of an image URL, without a size, -scaled or -rotated suffix.
 *
 * That ignores the host, so CDN and custom-domain copies of the same upload match.
 *
 * @param string $url Image URL.
 * @return string Empty when the URL has no path.
 */
function wpcom_featured_image_path_key( string $url ): string {
	$path = wp_parse_url( $url, PHP_URL_PATH );
	if ( ! is_string( $path ) || '' === $path ) {
		return '';
	}

	$path = (string) preg_replace( '/-(?:\d+x\d+|scaled|rotated)(\.[^.\/]+)$/i', '$1', $path );

	return implode( '/', array_slice( explode( '/', trim( $path, '/' ) ), -3 ) );
}

/**
 * Whether the featured image of this post would repeat on the single view being served.
 *
 * @param int $post_id Post whose featured image is rendering.
 * @return bool
 */
function wpcom_featured_image_repeats_on_single_view( int $post_id ): bool {
	return is_singular()
		&& get_queried_object_id() === $post_id
		&& ! post_password_required( $post_id )
		&& wpcom_post_opens_with_featured_image( $post_id );
}

/**
 * Block themes: drop the Post Featured Image block for the post being viewed.
 *
 * Filtering the block rather than post_thumbnail_html leaves Cover blocks that use the featured image alone.
 *
 * @param string        $block_content Rendered block.
 * @param array         $parsed_block  Parsed block.
 * @param WP_Block|null $block         Block instance.
 * @return string
 */
function wpcom_hide_repeated_featured_image_block( $block_content, $parsed_block, $block = null ) {
	if ( ! $block instanceof WP_Block || isset( $block->context['query'] ) ) {
		return $block_content;
	}

	$post_id = (int) ( $block->context['postId'] ?? 0 );

	return $post_id && wpcom_featured_image_repeats_on_single_view( $post_id ) ? '' : $block_content;
}
add_filter( 'render_block_core/post-featured-image', 'wpcom_hide_repeated_featured_image_block', 10, 3 );

/**
 * Classic themes: drop the thumbnail the main loop prints for the post being viewed.
 *
 * Themes print header banners before the loop starts, so the loop check leaves them alone.
 *
 * @param string $html    Thumbnail markup.
 * @param int    $post_id Post ID.
 * @return string
 */
function wpcom_hide_repeated_post_thumbnail_html( $html, $post_id ) {
	if ( '' === $html || wp_is_block_theme() || ! in_the_loop() || ! is_main_query() ) {
		return $html;
	}

	return wpcom_featured_image_repeats_on_single_view( (int) $post_id ) ? '' : $html;
}
add_filter( 'post_thumbnail_html', 'wpcom_hide_repeated_post_thumbnail_html', 10, 2 );
