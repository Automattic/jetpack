<?php
/**
 * Block Editor - Featured image duplicate notice.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Featured_Image_Duplicate;

use Jetpack_Gutenberg;
use WP_Block;
use WP_Block_Supports;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const FEATURE_NAME       = 'featured-image-duplicate';
const HIDE_META_KEY      = '_jetpack_hide_featured_image';
const DISMISSED_META_KEY = '_jetpack_featured_image_duplicate_dismissed';
const POST_TYPES         = array( 'post', 'page' );

/**
 * Make the editor plugin available.
 *
 * @return void
 */
function register_plugin() {
	Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

/**
 * Only users who can edit the post may change its meta.
 *
 * @param bool   $allowed   Whether the user can edit the meta.
 * @param string $meta_key  Meta key.
 * @param int    $object_id Post ID.
 * @return bool
 */
function can_edit_post_meta( $allowed, $meta_key, $object_id ) {
	return current_user_can( 'edit_post', (int) $object_id );
}

/**
 * Register the hide and dismiss meta for posts and pages.
 *
 * @return void
 */
function register_meta_keys() {
	foreach ( POST_TYPES as $post_type ) {
		register_post_meta(
			$post_type,
			HIDE_META_KEY,
			array(
				'type'          => 'boolean',
				'description'   => __( 'Whether to hide the featured image on this post’s own page.', 'jetpack' ),
				'single'        => true,
				'default'       => false,
				'show_in_rest'  => true,
				'auth_callback' => __NAMESPACE__ . '\can_edit_post_meta',
			)
		);
		register_post_meta(
			$post_type,
			DISMISSED_META_KEY,
			array(
				'type'              => 'integer',
				'description'       => __( 'Featured image ID whose duplicate notice was dismissed.', 'jetpack' ),
				'single'            => true,
				'default'           => 0,
				'show_in_rest'      => true,
				'sanitize_callback' => 'absint',
				'auth_callback'     => __NAMESPACE__ . '\can_edit_post_meta',
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_meta_keys' );

/**
 * Whether the classic theme declares Content Options featured image support for this post type.
 *
 * @param string $post_type Post type.
 * @return bool
 */
function classic_theme_supports_hiding( $post_type ) {
	$options = get_theme_support( 'jetpack-content-options' );
	return ! empty( $options[0]['featured-images'][ $post_type ] );
}

/**
 * Template slugs WordPress tries for this post, most specific first.
 *
 * @param WP_Post $post Post.
 * @return string[]
 */
function get_template_hierarchy_for_post( WP_Post $post ) {
	if ( 'page' === $post->post_type ) {
		$hierarchy = array( "page-{$post->post_name}", "page-{$post->ID}", 'page', 'singular', 'index' );
	} else {
		$hierarchy = array( "single-{$post->post_type}-{$post->post_name}", "single-{$post->post_type}", 'single', 'singular', 'index' );
	}

	$custom = get_page_template_slug( $post );
	if ( $custom ) {
		array_unshift( $hierarchy, $custom );
	}

	return $hierarchy;
}

/**
 * Whether the blocks render the current post's featured image.
 *
 * Follows patterns and template parts; skips Query Loops, which show other posts.
 *
 * @param array $blocks Parsed blocks.
 * @param int   $depth  Recursion depth.
 * @return bool
 */
function blocks_contain_featured_image( array $blocks, $depth = 0 ) {
	if ( $depth > 10 ) {
		return false;
	}

	foreach ( resolve_pattern_blocks( $blocks ) as $block ) {
		$name  = $block['blockName'] ?? '';
		$inner = $block['innerBlocks'] ?? array();

		if ( 'core/post-featured-image' === $name ) {
			return true;
		}

		if ( 'core/query' === $name ) {
			continue;
		}

		if ( 'core/template-part' === $name && ! empty( $block['attrs']['slug'] ) ) {
			$part  = get_block_template( ( $block['attrs']['theme'] ?? get_stylesheet() ) . '//' . $block['attrs']['slug'], 'wp_template_part' );
			$inner = $part ? parse_blocks( $part->content ) : array();
		}

		if ( $inner && blocks_contain_featured_image( $inner, $depth + 1 ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Whether hiding the featured image on this post's own page is known to work on the active theme.
 *
 * @param WP_Post|int $post Post or post ID.
 * @return bool
 */
function is_hide_supported( $post ) {
	$post = get_post( $post );
	if ( ! $post instanceof WP_Post || ! in_array( $post->post_type, POST_TYPES, true ) ) {
		return false;
	}

	if ( ! wp_is_block_theme() ) {
		return classic_theme_supports_hiding( $post->post_type );
	}

	// Block themes: check the template hierarchy for a Featured Image block.
	$hierarchy = get_template_hierarchy_for_post( $post );
	$contents  = wp_list_pluck( get_block_templates( array( 'slug__in' => $hierarchy ), 'wp_template' ), 'content', 'slug' );

	// Only the first match in the hierarchy is the template WordPress renders.
	foreach ( $hierarchy as $slug ) {
		if ( isset( $contents[ $slug ] ) ) {
			return blocks_contain_featured_image( parse_blocks( $contents[ $slug ] ) );
		}
	}

	return false;
}

/**
 * Tell the editor whether hiding works for the post being edited.
 *
 * @param array $flags Editor feature flags.
 * @return array
 */
function add_editor_feature_flag( $flags ) {
	$flags['featured-image-hide'] = is_hide_supported( get_post() );
	return $flags;
}
add_filter( 'jetpack_block_editor_feature_flags', __NAMESPACE__ . '\add_editor_feature_flag' );

/**
 * Whether we're on this post's own page and the writer chose to hide its featured image there.
 *
 * @param int $post_id Post ID.
 * @return bool
 */
function should_hide_for_post( $post_id ) {
	return ! is_admin()
		&& is_singular( POST_TYPES )
		&& get_queried_object_id() === $post_id
		&& (bool) get_post_meta( $post_id, HIDE_META_KEY, true );
}

/**
 * Classic themes: no featured image inside the loop on the post's own page.
 *
 * Outside the loop (Open Graph, schema) and inside blocks (Latest Posts) it's still returned.
 *
 * @param mixed  $value     Short-circuit value.
 * @param int    $object_id Post ID.
 * @param string $meta_key  Meta key.
 * @return mixed
 */
function filter_thumbnail_id( $value, $object_id, $meta_key ) {
	if (
		'_thumbnail_id' !== $meta_key
		|| get_queried_object_id() !== (int) $object_id
		|| ! in_the_loop()
		|| null !== WP_Block_Supports::$block_to_render
	) {
		return $value;
	}

	return false;
}

/**
 * Only filter thumbnail reads on pages that hide the featured image.
 *
 * @return void
 */
function maybe_filter_thumbnail_id() {
	if ( should_hide_for_post( get_queried_object_id() ) ) {
		// Late, since core overrides the thumbnail ID in _wp_preview_post_thumbnail_filter.
		add_filter( 'get_post_metadata', __NAMESPACE__ . '\filter_thumbnail_id', PHP_INT_MAX, 3 );
	}
}
add_action( 'template_redirect', __NAMESPACE__ . '\maybe_filter_thumbnail_id' );

/**
 * Block themes: skip the template's Featured Image block on the post's own page.
 *
 * @param string   $block_content Rendered block.
 * @param array    $block         Parsed block.
 * @param WP_Block $instance      Block instance.
 * @return string
 */
function hide_featured_image_block( $block_content, $block, $instance ) {
	$context = $instance->context; // Set from the template and parent blocks.

	// Inside a Query Loop it's a list of posts, not this post's header.
	if ( array_key_exists( 'queryId', $context ) || empty( $context['postId'] ) ) {
		return $block_content;
	}

	return should_hide_for_post( (int) $context['postId'] ) ? '' : $block_content;
}
add_filter( 'render_block_core/post-featured-image', __NAMESPACE__ . '\hide_featured_image_block', 10, 3 );
