<?php
/**
 * Posts list block file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\A8C_Posts_List;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/utils.php';

/**
 * Excerpt more string.
 *
 * @return string More string.
 */
function custom_excerpt_read_more() {
	return sprintf(
		'&hellip; <a href="%1$s" title="%2$s" class="a8c-posts-list-item__read-more">%3$s</a>',
		esc_url( get_the_permalink() ),
		sprintf(
			/* translators: %s: Name of current post */
			esc_attr__( 'Continue reading %s', 'jetpack-mu-wpcom' ),
			the_title_attribute( array( 'echo' => false ) )
		),
		esc_html__( 'Read more', 'jetpack-mu-wpcom' )
	);
}

/**
 * Renders posts list.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block content.
 * @return string
 */
function render_a8c_post_list_block( $attributes, $content ) {
	static $rendering_block = false;

	$posts_list = new \WP_Query(
		array(
			'post_type'        => 'post',
			'posts_per_page'   => $attributes['postsPerPage'],
			'post_status'      => 'publish',
			'suppress_filters' => false,
		)
	);

	add_filter( 'excerpt_more', __NAMESPACE__ . '\custom_excerpt_read_more' );

	// Prevent situations when the block attempts rendering another a8c/posts-list block.
	if ( true !== $rendering_block ) {
		$rendering_block = true;

		$content = render_template(
			'posts-list',
			array(
				'posts_list' => $posts_list,
			)
		);

		$rendering_block = false;
	}

	remove_filter( 'excerpt_more', __NAMESPACE__ . '\custom_excerpt_read_more' );

	// Reset the custom query.
	wp_reset_postdata();

	return $content;
}

/**
 * Register block.
 */
function register_blocks() {
	register_block_type(
		'a8c/posts-list',
		array(
			'attributes'      => array(
				'postsPerPage' => array(
					'type'    => 'number',
					'default' => 10,
				),
			),
			'render_callback' => __NAMESPACE__ . '\render_a8c_post_list_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_blocks', 100 );

/**
 * Enqueue block styles.
 */
function enqueue_styles() {
	if ( ! has_block( 'a8c/posts-list' ) ) {
		return;
	}

	$ext      = is_rtl()
		? 'rtl.css'
		: 'css';
	$css_file = "build/a8c-posts-list/a8c-posts-list.$ext";
	wp_enqueue_style(
		'posts-list-block-style',
		plugins_url( $css_file, Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . $css_file )
	);
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_scripts', 100 );

/**
 * Enqueue block scripts.
 */
function enqueue_scripts() {
	if ( ! has_block( 'a8c/posts-list' ) ) {
		return;
	}

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/a8c-posts-list/a8c-posts-list.asset.php';
	$js_file    = 'build/a8c-posts-list/a8c-posts-list.js';
	wp_enqueue_script(
		'a8c-posts-list-script',
		plugins_url( $js_file, Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . $js_file ),
		true
	);

	wp_set_script_translations( 'a8c-posts-list-script', 'jetpack-mu-wpcom' );
}
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\enqueue_styles', 100 );
