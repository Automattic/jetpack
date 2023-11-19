<?php
/**
 * Top Posts Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Top_Posts;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Top Posts block registration/dependency declaration.
 *
 * @param array  $attributes    Array containing the Top Posts block attributes.
 * @param string $content String containing the Top Posts block content.
 *
 * @return string
 */
function load_assets( $attributes, $content ) {
    /*
     * Enqueue necessary scripts and styles.
     */
    Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

    /*
     * We cannot rely on obtaining posts from the block because 
     * top posts might have changed since then. As such, we must
     * make another request to check for updated stats.
     */
    $request_url = sprintf(
        '/wp-json/wpcom/v2/top-posts?period=%1$s&number=%2$s&types=%3$s',
        $attributes['period'],
        $attributes['postsToShow'],
        implode( ',', array_keys( array_filter( $attributes['postTypes'] ) ) )
    );

    $request = wp_remote_get( home_url( $request_url ) );
    $data    = json_decode( wp_remote_retrieve_body( $request ), true );

    if ( is_wp_error( $request ) || ! is_array( $data ) ) {
        return;
    }

    $wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();

    $output = sprintf(
		'<div class="jetpack-top-posts%s%s%s"%s><div class="jetpack-top-posts-wrapper">',
		! empty( $attributes['className'] ) ? ' ' . esc_attr( $attributes['className'] ) : '',
		! empty( $wrapper_attributes['class'] ) ? ' ' . esc_attr( $wrapper_attributes['class'] ) : '',
		' is-' . esc_attr( $attributes['layout'] ) . '-layout',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : ''
	);

    foreach ( $data as $item ) {
        $output .= '<div class="jetpack-top-posts-item">';

        if ( $attributes['displayThumbnail'] && ! empty( $item['thumbnail'] ) ) {
            $output .= '<a class="jetpack-top-posts-thumbnail-link">';
            $output .= '<img class="jetpack-top-posts-thumbnail" src="' . esc_url( $item['thumbnail'] ) . '" alt="' . esc_attr( $item['title'] ) . '" rel="nofollow noopener noreferrer" target="_blank">';
            $output .= '</a>';
        }

        $output .= '<a class="jetpack-top-posts-title" href="' . esc_url( $item['href'] ) . '">' . esc_html( $item['title'] ) . '</a>';

		if ( $attributes['displayDate'] ) {
        	$output .= '<span class="jetpack-top-posts-date has-small-font-size">' . esc_html( $item['date'] ) . '</span>';
		}
	
		if ( $attributes['displayAuthor'] ) {
			$output .= '<span class="jetpack-top-posts-author has-small-font-size">' . esc_html( $item['author'] ) . '</span>';
		}

		if ( $attributes['displayContext'] && ! empty( $item['context'] ) && is_array( $item['context'] ) ) {
			$context = reset( $item['context'] );
        	$output .= '<a class="jetpack-top-posts-context has-small-font-size" href="' . esc_url( get_category_link( $context['term_id'] ) ) . '">' . esc_html( $context['name'] ) . '</a>';
        }

        $output .= '</div>';
    }

    $output .= '</div></div>';

    return $output;
}
