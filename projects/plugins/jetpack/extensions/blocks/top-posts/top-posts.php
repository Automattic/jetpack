<?php
/**
 * Top Posts Block.
 *
 * @since 13.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Top_Posts;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;
use Jetpack_Top_Posts_Helper;

if ( ! class_exists( 'Jetpack_Top_Posts_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-top-posts-helper.php';
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	/*
	 * The block is available even when the module is not active,
	 * so we can display a nudge to activate the module instead of the block.
	 * However, since non-admins cannot activate modules, we do not display the empty block for them.
	 */
	if ( ! ( new Modules() )->is_active( 'stats' ) && ! current_user_can( 'jetpack_activate_modules' ) ) {
		return;
	}

	if ( ( new Host() )->is_wpcom_simple() || ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Top Posts block registration/dependency declaration.
 *
 * @param array $attributes Array containing the Top Posts block attributes.
 *
 * @return string
 */
function load_assets( $attributes ) {
	// Do not render anything when the Stats module is not active.
	if ( ! ( new Modules() )->is_active( 'stats' ) ) {
		return;
	}

	// Do not render in contexts outside the front-end (eg. emails, API).
	if ( ! jetpack_is_frontend() ) {
		return;
	}

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	/*
	 * We cannot rely on obtaining posts from the block because
	 * top posts might have changed since then. As such, we must
	 * check for updated stats.
	 */
	$period = $attributes['period'];
	$number = $attributes['postsToShow'];
	$types  = implode( ',', array_keys( array_filter( $attributes['postTypes'] ) ) );

	$data = Jetpack_Top_Posts_Helper::get_top_posts( $period, $number, $types );

	if ( ! is_array( $data ) ) {
		return;
	}

	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();

	$output = sprintf(
		'<div class="jetpack-top-posts%s%s%s"%sdata-item-count="%s"><div class="jetpack-top-posts-wrapper">',
		! empty( $attributes['className'] ) ? ' ' . esc_attr( $attributes['className'] ) : '',
		! empty( $wrapper_attributes['class'] ) ? ' ' . esc_attr( $wrapper_attributes['class'] ) : '',
		' is-' . esc_attr( $attributes['layout'] ) . '-layout',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : '',
		count( $data )
	);

	foreach ( $data as $item ) {
		$output .= '<div class="jetpack-top-posts-item">';

		if ( $attributes['displayThumbnail'] ) {
			$output .= '<a class="jetpack-top-posts-thumbnail-link" href="' . esc_url( $item['href'] ) . '">';

			if ( ! empty( $item['thumbnail'] ) ) {
				$output .= '<img class="jetpack-top-posts-thumbnail" src="' . esc_url( $item['thumbnail'] ) . '" alt="' . esc_attr( $item['title'] ) . '">';
			} else {
				$output .= '<div class="jetpack-top-posts-mock-thumbnail"></div>';
			}

			$output .= '</a>';
		}

		$output .= '<span class="jetpack-top-posts-title"><a href="' . esc_url( $item['href'] ) . '">' . esc_html( $item['title'] ) . '</a></span>';

		if ( $attributes['displayDate'] ) {
			$output .= '<span class="jetpack-top-posts-date has-small-font-size">' . esc_html( $item['date'] ) . '</span>';
		}

		if ( $attributes['displayAuthor'] ) {
			$output .= '<span class="jetpack-top-posts-author has-small-font-size">' . esc_html( $item['author'] ) . '</span>';
		}

		if ( $attributes['displayContext'] && ! empty( $item['context'] ) && is_array( $item['context'] ) ) {
			$context = reset( $item['context'] );
			$output .= '<span class="jetpack-top-posts-context has-small-font-size"><a href="' . esc_url( get_category_link( $context->term_id ) ) . '">' . esc_html( $context->name ) . '</a></span>';
		}

		$output .= '</div>';
	}

	$output .= '</div></div>';

	return $output;
}
