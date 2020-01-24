<?php
/**
 * OpenTable Block.
 *
 * @since 8.2
 *
 * @package Jetpack
 */

namespace Jetpack\OpenTable_Block;

const FEATURE_NAME = 'opentable';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Check if the block should be available on the site.
 *
 * @return bool
 */
function is_available() {
	if (
		defined( 'IS_WPCOM' )
		&& IS_WPCOM
		&& function_exists( 'has_any_blog_stickers' )
	) {
		if ( has_any_blog_stickers(
			array( 'premium-plan', 'business-plan', 'ecommerce-plan' ),
			get_current_blog_id()
		) ) {
			return true;
		}
		return false;
	}

	return true;
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( is_available() ) {
		jetpack_register_block(
			BLOCK_NAME,
			array( 'render_callback' => 'Jetpack\OpenTable_Block\load_assets' )
		);
	}
}
add_action( 'init', 'Jetpack\OpenTable_Block\register_block' );

/**
 * Set the availability of the block as the editor
 * is loaded.
 */
function set_availability() {
	if ( is_available() ) {
		\Jetpack_Gutenberg::set_extension_available( BLOCK_NAME );
	} else {
		\Jetpack_Gutenberg::set_extension_unavailable(
			BLOCK_NAME,
			'missing_plan',
			array(
				'required_feature' => 'opentable',
				'required_plan'    => 'premium-plan',
			)
		);
	}
}
add_action( 'jetpack_register_gutenberg_extensions', 'Jetpack\OpenTable_Block\set_availability' );

/**
 * Adds an inline script which updates the block editor settings to
 * add the site locale. This feels sligktly better than calling back
 * to the API before registering the block. It also seemed better than
 * creating a global
 */
function add_language_setting() {
	wp_add_inline_script( 'jetpack-blocks-editor', sprintf( "wp.data.dispatch( 'core/block-editor' ).updateSettings( { siteLocale: '%s' } )", str_replace( '_', '-', get_locale() ) ), 'before' );
}
add_action( 'enqueue_block_assets', 'Jetpack\OpenTable_Block\add_language_setting' );

/**
 * OpenTable block registration/dependency declaration.
 *
 * @param array $attributes    Array containing the OpenTable block attributes.
 *
 * @return string
 */
function load_assets( $attributes ) {
	\Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$classes = \Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes );
	$content = '<div class="' . esc_attr( $classes ) . '">';
	// The OpenTable script uses multiple `rid` paramters,
	// so we can't use WordPress to output it, as WordPress attempts to validate it and removes them.
	// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
	$content .= '<script type="text/javascript" src="' . esc_url( build_embed_url( $attributes ) ) . '"></script>';
	$content .= '</div>';
	return $content;
}

/**
 * Get the a block attribute
 *
 * @param array  $attributes Array of block attributes.
 * @param string $attribute_name The attribute to get.
 *
 * @return string The filtered attribute
 */
function get_attribute( $attributes, $attribute_name ) {
	if ( isset( $attributes[ $attribute_name ] ) ) {
		if ( in_array( $attribute_name, array( 'iframe', 'newtab' ), true ) ) {
			return $attributes[ $attribute_name ] ? 'true' : 'false';
		}
		return $attributes[ $attribute_name ];
	}

	$default_attributes = array(
		'style'  => 'standard',
		'iframe' => 'true',
		'domain' => 'com',
		'lang'   => 'en-US',
		'newtab' => 'false',
	);

	return isset( $default_attributes[ $attribute_name ] ) ? $default_attributes[ $attribute_name ] : null;
}

/**
 * Get the block type attribute
 *
 * @param array $attributes Array of block attributes.
 *
 * @return string The filtered attribute
 */
function get_type_attribute( $attributes ) {
	if ( ! empty( $attributes['rid'] ) && count( $attributes['rid'] ) > 1 ) {
		return 'multi';
	}

	if ( empty( $attributes['style'] ) || 'button' !== $attributes['style'] ) {
		return 'standard';
	}

	return 'button';
}

/**
 * Get the block theme attribute
 *
 * OpenTable has a confusing mix of themes and types for the widget. A type
 * can have a theme, but the button style can not have a theme. The other two
 * types (multi and standard) can have one of the three themes.
 *
 * We have combined these into a `style` attribute as really there are 4 styles
 * standard, wide, tall, and button. Multi can be determined by the number of
 * restaurant IDs we have.
 *
 * This function along with `jetpack_opentable_block_get_type_attribute`, translates
 * the style attribute to a type and theme.
 *
 * Type        Theme      Style
 * ==========|==========|==========
 * Multi     |          |
 * Standard  | Standard | Standard
 *           | Wide     | Wide
 *           | Tall     | Tall
 * Button    | Standard | Button
 *
 * @param array $attributes Array of block attributes.
 *
 * @return string The filtered attribute
 */
function get_theme_attribute( $attributes ) {
	$valid_themes = array( 'standard', 'wide', 'tall' );

	if ( empty( $attributes['style'] )
		|| ! in_array( $attributes['style'], $valid_themes, true )
		|| 'button' === $attributes['style'] ) {
		return 'standard';
	}

	return $attributes['style'];
}

/**
 * Build an embed URL from an array of block attributes.
 *
 * @param array $attributes Array of block attributess.
 *
 * @return string Embed URL
 */
function build_embed_url( $attributes ) {
	$url = add_query_arg(
		array(
			'type'   => get_type_attribute( $attributes ),
			'theme'  => get_theme_attribute( $attributes ),
			'iframe' => get_attribute( $attributes, 'iframe' ),
			'domain' => get_attribute( $attributes, 'domain' ),
			'lang'   => get_attribute( $attributes, 'lang' ),
			'newtab' => get_attribute( $attributes, 'newtab' ),
		),
		'//www.opentable.com/widget/reservation/loader'
	);

	if ( ! empty( $attributes['rid'] ) ) {
		foreach ( $attributes['rid'] as $rid ) {
			$url .= '&rid=' . $rid;
		}
	}

	/**
	 * Filter the OpenTable URL used to embed a widget.
	 *
	 * @since 8.2.0
	 *
	 * @param string $url        OpenTable embed URL.
	 * @param array  $attributes Array of block attributes.
	 */
	return apply_filters( 'jetpack_opentable_block_url', $url, $attributes );
}
