<?php
/**
 * Hooks the Sharing Buttons and Like blocks into single post and page templates.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Hooked_Blocks;

use Automattic\Jetpack\Sharing_Likes\Block_Names;
use Automattic\Jetpack\Sharing_Likes\Settings\Environment;

/**
 * Places `jetpack/sharing-buttons` and `jetpack/like` before or after `core/post-content`
 * with the Block Hooks API, where `Template_Placements` asks for them.
 *
 * Callbacks read options and site facts each time, since WordPress.com REST requests switch blogs
 * after `init`, and never resolve a template, since building one applies block hooks.
 *
 * @since $$next-version$$
 */
final class Hooked_Blocks {

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
		add_filter( 'hooked_block_' . Block_Names::SHARING_BUTTONS, array( self::class, 'build_sharing_buttons' ), 10, 4 );
		add_filter( 'hooked_block_' . Block_Names::LIKE, array( self::class, 'build_like' ), 10, 4 );
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
			$wanted[] = Block_Names::SHARING_BUTTONS;
		}
		if ( in_array( $placement, Template_Placements::get( Template_Placements::FEATURE_LIKES ), true ) ) {
			$wanted[] = Block_Names::LIKE;
		}

		if ( ! $wanted || ! self::is_single_view_context( $context, self::post_types() ) || ! self::blocks_can_load() ) {
			return $hooked_block_types;
		}

		foreach ( $wanted as $block ) {
			if (
				self::legacy_buttons_absent( $block )
				&& ! self::already_placed( $block, $context )
				&& ! in_array( $block, $hooked_block_types, true )
			) {
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
	 * Post types whose single views get the blocks.
	 *
	 * @return string[]
	 */
	private static function post_types(): array {
		/**
		 * Filters the post types whose single views get the Sharing Buttons and Like blocks the template placements add.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $post_types Post type names. Default posts and pages.
		 */
		$post_types = apply_filters( 'jetpack_sharing_likes_template_placement_post_types', array( 'post', 'page' ) );

		return is_array( $post_types ) ? array_values( array_unique( array_filter( $post_types, 'is_string' ) ) ) : array( 'post', 'page' );
	}

	/**
	 * Whether a context shows a single view of one of the post types: a template or pattern by the
	 * template types it serves, else by the current request, which never holds in the Site Editor's REST requests.
	 *
	 * @param mixed    $context    Template, template part, pattern array or post.
	 * @param string[] $post_types Post types that get the blocks.
	 */
	private static function is_single_view_context( $context, array $post_types ): bool {
		if ( ! $post_types ) {
			return false;
		}

		// `single`, `singular` and custom templates also serve other post types, so a request for one of those has the last word.
		if ( is_singular() && ! is_singular( $post_types ) ) {
			return false;
		}

		if ( $context instanceof \WP_Block_Template ) {
			if ( 'wp_template' !== $context->type ) {
				return false;
			}

			if ( self::is_single_view_slug( (string) $context->slug, $post_types ) ) {
				return true;
			}

			if ( is_array( $context->post_types ) && $context->post_types ) {
				return (bool) array_intersect( $post_types, $context->post_types );
			}

			// A custom template that declares no post types can be assigned to any post.
			return $context->is_custom && is_singular( $post_types );
		}

		if ( is_array( $context ) ) {
			$template_types = isset( $context['templateTypes'] ) && is_array( $context['templateTypes'] ) ? $context['templateTypes'] : array();

			foreach ( $template_types as $template_type ) {
				if ( is_string( $template_type ) && self::is_single_view_slug( $template_type, $post_types ) ) {
					return true;
				}
			}

			return is_singular( $post_types );
		}

		return false;
	}

	/**
	 * Whether a template slug or type serves single views of one of the post types.
	 *
	 * @param string   $slug       Template slug.
	 * @param string[] $post_types Post types that get the blocks.
	 */
	private static function is_single_view_slug( string $slug, array $post_types ): bool {
		if ( 'singular' === $slug ) {
			return true;
		}

		if ( in_array( 'page', $post_types, true ) && ( 'page' === $slug || str_starts_with( $slug, 'page-' ) ) ) {
			return true;
		}

		// Pages have templates of their own; `single` serves every other post type without one.
		$single_types = array_diff( $post_types, array( 'page' ) );

		if ( 'single' === $slug ) {
			return (bool) $single_types;
		}

		foreach ( $single_types as $post_type ) {
			if ( 'single-' . $post_type === $slug ) {
				return true;
			}

			// `single-{type}-{slug}` is one post's template, unless it belongs to a post type named `{type}-…`.
			if ( str_starts_with( $slug, 'single-' . $post_type . '-' ) && ! post_type_exists( substr( $slug, strlen( 'single-' ) ) ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether the post being viewed, the template or the pattern already holds the block, as when the owner added it by hand.
	 *
	 * @param string $block   Block type.
	 * @param mixed  $context Template or pattern array, its content not yet hooked.
	 */
	private static function already_placed( string $block, $context ): bool {
		$post = is_singular() ? get_queried_object() : null;

		if ( $post instanceof \WP_Post && has_block( $block, $post->post_content ) ) {
			return true;
		}

		if ( $context instanceof \WP_Block_Template ) {
			$content = $context->content;
		} else {
			$content = $context['content'] ?? null;
			$path    = $context['filePath'] ?? null;

			// Core hands over a theme pattern before reading its file, the first time it is fetched.
			if ( null === $content && is_string( $path ) && is_readable( $path ) ) {
				$content = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- A local theme file.
			}
		}

		return is_string( $content ) && has_block( $block, $content );
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
	 * @param string $block Block type.
	 */
	private static function legacy_buttons_absent( string $block ): bool {
		if ( Block_Names::SHARING_BUTTONS === $block ) {
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
