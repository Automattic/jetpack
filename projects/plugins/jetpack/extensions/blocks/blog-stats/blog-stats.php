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
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg.
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		( new Host() )->is_wpcom_simple()
		|| (
			( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
			&& ! ( new Status() )->is_offline_mode()
		)
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
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	// For when Stats has been disabled subsequent to inserting the block.
	if ( ! \Jetpack::is_module_active( 'stats' ) ) {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return sprintf(
				'<p>%s</p>',
				sprintf(
					/* translators: placeholder is a link that says "Stats module". */
					esc_html__( 'Please enable the %s in Jetpack to use this block.', 'jetpack' ),
					'<a href="' .
						esc_url( admin_url( 'admin.php?page=jetpack_modules&module_tag=Jetpack%20Stats' ) ) .
						'">' .
						esc_html__( 'Stats module', 'jetpack' ) .
					'</a>'
				)
			);
		}

		return;
	}

	// For when there's no post ID - eg. search pages.
	if ( $attributes['statsOption'] === 'post' && ! get_the_ID() ) {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return sprintf(
				'<p>%s</p>',
				esc_html( __( 'There are no stats to display for this post.', 'jetpack' ) )
			);
		}

		return;
	}

	$stats       = 0;
	$wpcom_stats = new WPCOM_Stats();

	if ( $attributes['statsOption'] === 'post' ) {
		// Cache in post meta to prevent wp_options blowing up when retrieving views
		// for multiple posts simultaneously (eg. when inserted into template).
		$cache_in_meta = true;
		$data          = $wpcom_stats->convert_stats_array_to_object(
			$wpcom_stats->get_post_views(
				get_the_ID(),
				array( 'fields' => 'views' ),
				$cache_in_meta
			)
		);

		if ( isset( $data->views ) ) {
			$stats = $data->views;
		}
	} else {
		$data = $wpcom_stats->convert_stats_array_to_object(
			$wpcom_stats->get_stats( array( 'fields' => 'stats' ) )
		);

		if ( $attributes['statsData'] === 'views' && isset( $data->stats->views ) ) {
			$stats = $data->stats->views;
		}

		if ( $attributes['statsData'] === 'visitors' && isset( $data->stats->visitors ) ) {
			$stats = $data->stats->visitors;
		}
	}

	$fallback_label = $attributes['statsData'] === 'visitors' ? esc_html(
		/* Translators: Number of visitors */
		_n( 'visitor', 'visitors', $stats, 'jetpack' )
	) : esc_html(
		/* Translators: Number of views */
		_n( 'hit', 'hits', $stats, 'jetpack' )
	);

	$label = empty( $attributes['label'] ) ? $fallback_label : $attributes['label'];

	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();

	return sprintf(
		'<div class="jetpack-blog-stats%s%s"%s><p>%s %s</p></div>',
		! empty( $attributes['className'] ) ? ' ' . esc_attr( $attributes['className'] ) : '',
		! empty( $wrapper_attributes['class'] ) ? ' ' . esc_attr( $wrapper_attributes['class'] ) : '',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : '',
		esc_html( number_format_i18n( $stats ) ),
		wp_kses_post( $label )
	);
}
