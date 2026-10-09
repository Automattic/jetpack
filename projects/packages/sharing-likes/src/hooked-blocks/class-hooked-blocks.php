<?php
/**
 * Hooks the Sharing Buttons and Like blocks into single post and page templates.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Hooked_Blocks;

use Automattic\Jetpack\Sharing_Likes\Settings\Environment;

/**
 * Places `jetpack/sharing-buttons` and `jetpack/like` before or after `core/post-content`
 * with the Block Hooks API, where `Template_Placements` asks for them.
 *
 * Callbacks read options and site facts each time: WordPress.com REST requests switch blogs after `init`.
 *
 * @since $$next-version$$
 */
final class Hooked_Blocks {

	public const SHARING_BLOCK = 'jetpack/sharing-buttons';
	public const LIKE_BLOCK    = 'jetpack/like';

	private const ANCHOR = 'core/post-content';

	/**
	 * Block Hooks position for each placement.
	 */
	private const POSITIONS = array(
		'before' => Template_Placements::BEFORE_CONTENT,
		'after'  => Template_Placements::AFTER_CONTENT,
	);

	/**
	 * Hook everything up. Callers make sure it runs once.
	 */
	public static function init(): void {
		// Ahead of Newsletter's Subscribe block at 10, whichever registers first.
		add_filter( 'hooked_block_types', array( self::class, 'hook_block_types' ), 5, 4 );
		add_filter( 'hooked_block_' . self::SHARING_BLOCK, array( self::class, 'build_sharing_buttons' ), 10, 4 );
		add_filter( 'hooked_block_' . self::LIKE_BLOCK, array( self::class, 'build_like' ), 10, 4 );
	}

	/**
	 * Add the blocks around `core/post-content` in the templates and patterns that show one post or page.
	 *
	 * @param mixed  $hooked_block_types Block types hooked at this anchor and position.
	 * @param string $relative_position  Position relative to the anchor.
	 * @param mixed  $anchor_block_type  Anchor block type; null for freeform content.
	 * @param mixed  $context            Template, template part, pattern array or post the anchor belongs to.
	 * @return mixed
	 */
	public static function hook_block_types( $hooked_block_types, $relative_position, $anchor_block_type, $context ) {
		if ( self::ANCHOR !== $anchor_block_type || ! is_array( $hooked_block_types ) || ! isset( self::POSITIONS[ $relative_position ] ) ) {
			return $hooked_block_types;
		}

		$placement = self::POSITIONS[ $relative_position ];
		$wanted    = array();

		if ( in_array( $placement, Template_Placements::get( Template_Placements::FEATURE_SHARING ), true ) ) {
			$wanted[] = self::SHARING_BLOCK;
		}
		if ( in_array( $placement, Template_Placements::get( Template_Placements::FEATURE_LIKES ), true ) ) {
			$wanted[] = self::LIKE_BLOCK;
		}

		if ( ! $wanted || ! self::is_single_post_or_page_context( $context ) || ! self::blocks_can_load() ) {
			return $hooked_block_types;
		}

		foreach ( $wanted as $block ) {
			if ( self::legacy_buttons_absent( $block ) && ! in_array( $block, $hooked_block_types, true ) ) {
				$hooked_block_types[] = $block;
			}
		}

		return $hooked_block_types;
	}

	/**
	 * Give the hooked Sharing Buttons block its buttons, in a group laid out like the post content.
	 *
	 * @param mixed  $parsed_hooked_block The hooked block, or null when suppressed.
	 * @param string $hooked_block_type   Hooked block type.
	 * @param string $relative_position   Position relative to the anchor.
	 * @param mixed  $parsed_anchor_block The anchor block.
	 * @return mixed
	 */
	public static function build_sharing_buttons( $parsed_hooked_block, $hooked_block_type, $relative_position, $parsed_anchor_block ) {
		if ( ! is_array( $parsed_hooked_block ) || ! self::is_content_placement( $relative_position, $parsed_anchor_block ) ) {
			return $parsed_hooked_block;
		}

		return self::wrap_in_group( Sharing_Buttons_Markup::fill( $parsed_hooked_block ), $parsed_anchor_block );
	}

	/**
	 * Put the hooked Like block in a group laid out like the post content.
	 *
	 * @param mixed  $parsed_hooked_block The hooked block, or null when suppressed.
	 * @param string $hooked_block_type   Hooked block type.
	 * @param string $relative_position   Position relative to the anchor.
	 * @param mixed  $parsed_anchor_block The anchor block.
	 * @return mixed
	 */
	public static function build_like( $parsed_hooked_block, $hooked_block_type, $relative_position, $parsed_anchor_block ) {
		if ( ! is_array( $parsed_hooked_block ) || ! self::is_content_placement( $relative_position, $parsed_anchor_block ) ) {
			return $parsed_hooked_block;
		}

		return self::wrap_in_group( $parsed_hooked_block, $parsed_anchor_block );
	}

	/**
	 * Whether a context shows a single post or page.
	 *
	 * Templates are recognised by slug, or by the post types a theme's custom template declares.
	 * Patterns declare their template types, if at all, so the rest fall back to the current request,
	 * which never holds in the Site Editor's REST requests. Template parts and posts get nothing.
	 *
	 * @param mixed $context Template, template part, pattern array or post.
	 */
	private static function is_single_post_or_page_context( $context ): bool {
		if ( $context instanceof \WP_Block_Template ) {
			if ( 'wp_template' !== $context->type ) {
				return false;
			}

			$slug = (string) $context->slug;

			if (
				in_array( $slug, array( 'single', 'page', 'singular' ), true )
				|| str_starts_with( $slug, 'single-post' )
				|| str_starts_with( $slug, 'page-' )
			) {
				return true;
			}

			return is_array( $context->post_types ) && array_intersect( array( 'post', 'page' ), $context->post_types );
		}

		if ( is_array( $context ) ) {
			$template_types = isset( $context['templateTypes'] ) && is_array( $context['templateTypes'] ) ? $context['templateTypes'] : array();

			return array_intersect( array( 'single', 'page', 'singular' ), $template_types ) || is_singular( array( 'post', 'page' ) );
		}

		return false;
	}

	/**
	 * Whether Jetpack's blocks load here, so the lazy loader registers the hooked ones as they render.
	 *
	 * Asks for the conditions rather than the block registry: both blocks are only registered
	 * on first render on the front end, after core has built the template.
	 */
	private static function blocks_can_load(): bool {
		return Environment::is_block_theme() && Environment::jetpack_blocks_load();
	}

	/**
	 * Whether the legacy feature shows no buttons, so visitors never get both.
	 *
	 * Never call anything that resolves a template from here: building one applies block hooks.
	 *
	 * @param string $block Block type.
	 */
	private static function legacy_buttons_absent( string $block ): bool {
		if ( self::SHARING_BLOCK === $block ) {
			return ! Environment::sharing_module_running() || Environment::legacy_sharing_switched_off();
		}

		return Environment::likes_supported()
			&& ( ! Environment::likes_module_running() || Environment::legacy_likes_switched_off() );
	}

	/**
	 * Whether a hooked block sits right before or after the post content, where this class places it.
	 *
	 * @param mixed $relative_position   Position relative to the anchor.
	 * @param mixed $parsed_anchor_block The anchor block.
	 */
	private static function is_content_placement( $relative_position, $parsed_anchor_block ): bool {
		return is_array( $parsed_anchor_block )
			&& self::ANCHOR === ( $parsed_anchor_block['blockName'] ?? null )
			&& isset( self::POSITIONS[ $relative_position ] );
	}

	/**
	 * Wrap a block in a `core/group` with the anchor's layout, so it lines up with the post content.
	 *
	 * @param array $block               The hooked block.
	 * @param array $parsed_anchor_block The anchor block.
	 * @return array
	 */
	private static function wrap_in_group( array $block, array $parsed_anchor_block ): array {
		$attrs  = array();
		$layout = $parsed_anchor_block['attrs']['layout'] ?? null;

		if ( is_array( $layout ) && $layout ) {
			$attrs['layout'] = $layout;
		}

		return array(
			'blockName'    => 'core/group',
			'attrs'        => $attrs,
			'innerBlocks'  => array( $block ),
			'innerHTML'    => '<div class="wp-block-group"></div>',
			'innerContent' => array( '<div class="wp-block-group">', null, '</div>' ),
		);
	}
}
