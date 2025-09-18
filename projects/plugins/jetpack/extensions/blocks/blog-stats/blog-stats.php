<?php
/**
 * Blog Stats Block.
 *
 * @since 13.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blog_Stats;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Request;
use Jetpack_Blog_Stats_Helper;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_Blog_Stats_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-blog-stats-helper.php';
}

/**
 * Registers the block for use in Gutenberg.
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

	// For outside the front-end, such as within emails or the API.
	if ( ! Request::is_frontend() ) {
		return;
	}

	// For when Stats has been disabled subsequent to inserting the block.
	if ( ! ( new Modules() )->is_active( 'stats' ) ) {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return sprintf(
				'<p>%s</p>',
				wp_kses(
					sprintf(
						/* translators: placeholder %s is a link to enable Jetpack Stats.. */
						__( 'Please <a href="%s">enable Jetpack Stats</a> to use this block.', 'jetpack' ),
						esc_url( admin_url( 'admin.php?page=jetpack_modules&module_tag=Jetpack%20Stats' ) )
					),
					array( 'a' => array( 'href' => array() ) )
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

	$stats = Jetpack_Blog_Stats_Helper::get_stats( $attributes );

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
