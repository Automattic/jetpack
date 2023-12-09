<?php
/**
 * Blog Stats Block.
 *
 * @since $$next_version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blog_Stats;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\Status;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg.
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		! defined( 'IS_WPCOM' )
		&& ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
		&& ! ( new Status() )->is_offline_mode() )
	) {
		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Blog Stats block registration/dependency declaration.
 *
 * @param array $attributes Array containing the Blog Stats block attributes.
 *
 * @return string
 */
function load_assets( $attributes ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$views = 0;

	if ( $attributes['statsOption'] === 'post' ) {
		$data = convert_stats_array_to_object( ( new WPCOM_Stats() )->get_post_views( get_the_ID(), array( 'fields' => 'views' ) ) );

		if ( isset( $data->views ) ) {
			$views = $data->views;
		}
	} else {
		$data = convert_stats_array_to_object( ( new WPCOM_Stats() )->get_stats( array( 'fields' => 'stats' ) ) );

		if ( isset( $data->stats->views ) ) {
			$views = $data->stats->views;
		}
	}

	/* Translators: Number of views, plural */
	$label = $attributes['label'] ? $attributes['label'] : esc_html__( 'hits', 'jetpack' );

	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();

	return sprintf(
		'<div class="jetpack-blog-stats%s%s"%s><p>%s %s</p></div>',
		! empty( $attributes['className'] ) ? ' ' . esc_attr( $attributes['className'] ) : '',
		! empty( $wrapper_attributes['class'] ) ? ' ' . esc_attr( $wrapper_attributes['class'] ) : '',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : '',
		esc_html( number_format_i18n( $views ) ),
		wp_kses_post( $label )
	);
}
