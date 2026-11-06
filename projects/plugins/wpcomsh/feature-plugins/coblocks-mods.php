<?php
/**
 * Customizations for CoBlocks
 *
 * CoBlocks is automatically installed as part of the WordPress.com on Atomic migration process.
 * We need to adjust some CoBlocks behaviors to provide tailored WordPress.com experience.
 *
 * @package coblocks
 */

/**
 * Makes coblock modifications once all plugins have been loaded.
 */
function wpcomsh_coblocks_plugins_loaded() {
	if ( defined( 'COBLOCKS_VERSION' ) ) {
		add_filter( 'render_block', 'wpcomsh_coblocks_font_preset_variable', 10, 2 );
	}

	// Disable CoBlocks block-patterns.
	// See https://github.com/godaddy-wordpress/coblocks/pull/1659
	if (
		class_exists( 'CoBlocks_Block_Patterns' )
		&& defined( 'CoBlocks_Block_Patterns::POST_TYPE' )
	) {
		$instance = CoBlocks_Block_Patterns::register();

		remove_action( 'admin_enqueue_scripts', array( $instance, 'conditional_load_patterns' ) );

		if ( is_wp_version_compatible( '5.5' ) ) {
			remove_action( 'init', array( $instance, 'register_post_type' ) );
			remove_action( 'init', array( $instance, 'register_type_taxonomy' ) );
			remove_action( 'init', array( $instance, 'register_category_taxonomy' ) );
			remove_action( 'init', array( $instance, 'load_block_patterns' ) );
			remove_action( 'rest_insert_' . CoBlocks_Block_Patterns::POST_TYPE, array( $instance, 'add_taxonomies_on_insert_post' ), 10 );

			remove_filter( 'coblocks_layout_selector_categories', array( $instance, 'load_categories' ) );
			remove_filter( 'coblocks_layout_selector_layouts', array( $instance, 'load_layouts' ) );
		}
	}
}
add_action( 'plugins_loaded', 'wpcomsh_coblocks_plugins_loaded' );

/**
 * Disable Coblocks' OpenTable block
 * Jetpack already ships with a similar block.
 */
function wpcomsh_coblocks_there_can_be_only_one_opentable_block() {
	wp_add_inline_script(
		'coblocks-editor',
		<<<'SCRIPT'
		document.addEventListener( 'DOMContentLoaded', function() {
			if ( wp.blocks.getBlockType( 'jetpack/opentable' ) && wp.blocks.getBlockType( 'coblocks/opentable' ) ) {
				wp.blocks.unregisterBlockType( 'coblocks/opentable' );
			}
		} );
		SCRIPT
	);
}
// Use later priority to give coblocks plenty of time to enqueue its scripts.
add_action( 'enqueue_block_editor_assets', 'wpcomsh_coblocks_there_can_be_only_one_opentable_block', 99 );

/**
 * CoBlocks 3.x saves a font preset's slug as the wrapper's inline font-family; point it at the preset's variable.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block.
 * @return string
 */
function wpcomsh_coblocks_font_preset_variable( $block_content, $block ) {
	$slug = $block['attrs']['fontFamily'] ?? null;
	if ( ! is_string( $slug ) || '' === $slug ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $tags->next_tag() || ! $tags->has_class( 'has-custom-font' ) ) {
		return $block_content;
	}

	$style = $tags->get_attribute( 'style' );
	if ( ! is_string( $style ) ) {
		return $block_content;
	}

	// The fallback keeps CoBlocks 2.x real font names (e.g. Raleway) rendering when no preset matches.
	$value = 'var(--wp--preset--font-family--' . _wp_to_kebab_case( $slug ) . ', ' . $slug . ')';
	$fixed = preg_replace_callback(
		'/(^|;)\s*font-family:\s*' . preg_quote( $slug, '/' ) . '\s*(?=;|$)/',
		static function ( $m ) use ( $value ) {
			return $m[1] . 'font-family:' . $value;
		},
		$style,
		1
	);
	if ( ! is_string( $fixed ) || $fixed === $style ) {
		return $block_content;
	}

	$tags->set_attribute( 'style', $fixed );
	return $tags->get_updated_html();
}
