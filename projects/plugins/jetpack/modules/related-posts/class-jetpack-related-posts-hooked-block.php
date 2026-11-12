<?php
/**
 * Hooks the Related Posts block after the post content in block theme single post templates.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Places `jetpack/related-posts` after `core/post-content` with the Block Hooks API,
 * where classic themes would get the module's appended markup.
 *
 * Only single posts are covered; the block stays available by hand on any post type.
 * Callbacks never resolve a template, since building one applies block hooks.
 */
class Jetpack_RelatedPosts_Hooked_Block {

	const BLOCK  = 'jetpack/related-posts';
	const ANCHOR = 'core/post-content';

	/**
	 * Hook everything up. Safe to call more than once.
	 */
	public static function init() {
		add_filter( 'hooked_block_types', array( __CLASS__, 'hook_block_types' ), 10, 4 );
		add_filter( 'hooked_block_' . self::BLOCK, array( __CLASS__, 'build_block' ), 10, 4 );
	}

	/**
	 * Add the block after `core/post-content` in the templates and patterns that show a single post.
	 *
	 * @param mixed  $hooked_block_types Block types hooked at this anchor and position.
	 * @param string $relative_position  Position relative to the anchor.
	 * @param mixed  $anchor_block_type  Anchor block type; null for freeform content.
	 * @param mixed  $context            Template, template part, pattern array or post the anchor belongs to.
	 * @return mixed
	 */
	public static function hook_block_types( $hooked_block_types, $relative_position, $anchor_block_type, $context ) {
		if (
			self::ANCHOR !== $anchor_block_type
			|| 'after' !== $relative_position
			|| ! is_array( $hooked_block_types )
			|| in_array( self::BLOCK, $hooked_block_types, true )
			|| ! wp_is_block_theme()
			|| ! self::is_enabled()
			|| ! self::is_single_post_context( $context )
			|| self::already_placed( $context )
		) {
			return $hooked_block_types;
		}

		$hooked_block_types[] = self::BLOCK;

		return $hooked_block_types;
	}

	/**
	 * Give the hooked block the module's options, so it looks like what a classic theme shows.
	 *
	 * @param mixed  $parsed_hooked_block The hooked block, or null when suppressed.
	 * @param string $hooked_block_type   Hooked block type.
	 * @param string $relative_position   Position relative to the anchor.
	 * @param mixed  $parsed_anchor_block The anchor block.
	 * @return mixed
	 */
	public static function build_block( $parsed_hooked_block, $hooked_block_type, $relative_position, $parsed_anchor_block ) {
		if (
			! is_array( $parsed_hooked_block )
			|| 'after' !== $relative_position
			|| ! is_array( $parsed_anchor_block )
			|| self::ANCHOR !== ( $parsed_anchor_block['blockName'] ?? null )
		) {
			return $parsed_hooked_block;
		}

		$options = Jetpack_RelatedPosts::init()->get_options();

		$parsed_hooked_block['attrs'] = array(
			'postLayout'        => 'list' === $options['layout'] ? 'list' : 'grid',
			'displayDate'       => (bool) $options['show_date'],
			'displayThumbnails' => (bool) $options['show_thumbnails'],
			'displayContext'    => (bool) $options['show_context'],
			'postsToShow'       => (int) $options['size'],
		);

		// The headline is an inner heading block, as the block's save function expects.
		$headline = trim( (string) $options['headline'] );
		$inner    = array();
		$html     = '<div class="wp-block-jetpack-related-posts"></div>';
		$content  = array( '<div class="wp-block-jetpack-related-posts">', null, '</div>' );

		if ( ! empty( $options['show_headline'] ) && '' !== $headline ) {
			$heading_html = '<h3 class="wp-block-heading">' . esc_html( $headline ) . '</h3>';
			$inner[]      = array(
				'blockName'    => 'core/heading',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => $heading_html,
				'innerContent' => array( $heading_html ),
			);
		} else {
			$content = array( $html );
		}

		$parsed_hooked_block['innerBlocks']  = $inner;
		$parsed_hooked_block['innerHTML']    = $html;
		$parsed_hooked_block['innerContent'] = $content;

		return $parsed_hooked_block;
	}

	/**
	 * Whether the module's "Show related content after posts" option is on.
	 *
	 * Callbacks run only once the module is loaded, so it is already active.
	 */
	private static function is_enabled() {
		return class_exists( 'Jetpack_RelatedPosts' ) && (bool) Jetpack_RelatedPosts::init()->get_option( 'enabled' );
	}

	/**
	 * Whether a context shows a single post: a template by its slug, a pattern by its template types,
	 * else by the current request.
	 *
	 * @param mixed $context Template, template part, pattern array or post.
	 */
	private static function is_single_post_context( $context ) {
		// Once the front end picks a template, the request has the last word: `single` also serves other post types.
		if ( ( is_singular() || did_action( 'template_redirect' ) ) && ! is_singular( 'post' ) ) {
			return false;
		}

		if ( $context instanceof WP_Block_Template ) {
			return 'wp_template' === $context->type && self::is_single_post_slug( (string) $context->slug );
		}

		if ( is_array( $context ) ) {
			$template_types = isset( $context['templateTypes'] ) && is_array( $context['templateTypes'] ) ? $context['templateTypes'] : array();

			foreach ( $template_types as $template_type ) {
				if ( is_string( $template_type ) && self::is_single_post_slug( $template_type ) ) {
					return true;
				}
			}

			return is_singular( 'post' );
		}

		return false;
	}

	/**
	 * Whether a template slug serves single posts: `single`, `single-post` or one post's `single-post-{slug}`.
	 *
	 * @param string $slug Template slug.
	 */
	private static function is_single_post_slug( $slug ) {
		return 'single' === $slug || 'single-post' === $slug || 0 === strpos( $slug, 'single-post-' );
	}

	/**
	 * Whether the post being viewed, the template or the pattern already holds the block.
	 *
	 * @param mixed $context Template or pattern array, its content not yet hooked.
	 */
	private static function already_placed( $context ) {
		$post = is_singular() ? get_queried_object() : null;

		if ( $post instanceof WP_Post && has_block( self::BLOCK, $post->post_content ) ) {
			return true;
		}

		if ( $context instanceof WP_Block_Template ) {
			$content = $context->content;
		} else {
			$content = $context['content'] ?? null;
			$path    = $context['filePath'] ?? null;

			// Core hands over a theme pattern before reading its file, the first time it is fetched.
			if ( null === $content && is_string( $path ) && is_readable( $path ) ) {
				$content = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- A local theme file.
			}
		}

		return is_string( $content ) && has_block( self::BLOCK, $content );
	}
}
