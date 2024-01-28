<?php
/**
 * Verbum Gutenberg Editor
 *
 * @package automattic/jetpack-mu-plugins
 */

declare( strict_types = 1 );

/**
 * Verbum_Gutenberg_Editor is responsible for loading the Gutenberg editor for comments.
 *
 * This loads the isolated editor, and sets up the editor to be used for Verbum_Comments.
 *
 * @see https://github.com/Automattic/isolated-block-editor
 */
class Verbum_Gutenberg_Editor {
	/**
	 * Class constructor
	 */
	public function __construct() {
		define( 'VERBUM_USING_GUTENBERG', true );

		// Override the placeholder text
		add_filter(
			'write_your_story',
			function () {
				return __( 'Write a comment...', 'jetpack-mu-wpcom' );
			},
			9999
		);
		add_filter( 'init', array( $this, 'remove_strict_kses_filters' ) );
		add_filter( 'comment_text', array( $this, 'render_verbum_blocks' ) );
		add_filter( 'pre_comment_content', array( $this, 'remove_blocks' ) );
		add_filter( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Default KSES filters on wpcom only allow HTML for admins and people who can post "posts" to the blog they're commenting on.
	 * See: wp-includes/kses.php (this one adds the restrictions).
	 * See: wp-content/mu-plugins/misc.php (this one removes it, but only has_cap('publish_posts')).
	 */
	public function remove_strict_kses_filters() {
		// Allow HTML when blocks are enabled.
		remove_filter( 'pre_comment_content', 'wp_filter_kses' );
		add_filter( 'pre_comment_content', 'wp_filter_post_kses' );
	}

	/**
	 * Enqueue the assets for the Gutenberg editor
	 */
	public function enqueue_assets() {
		$vbe_cache_buster = filemtime( ABSPATH . '/widgets.wp.com/verbum-block-editor/build_meta.json' );

		wp_enqueue_style(
			'verbum-gutenberg-css',
			'https://widgets.wp.com/verbum-block-editor/block-editor.css',
			array(),
			$vbe_cache_buster
		);
	}

	/**
	 * Render blocks in the comment content
	 * Filters blocks that aren't allowed
	 *
	 * @param string $comment_content - Text of the comment.
	 * @return string
	 */
	public function render_verbum_blocks( $comment_content ) {
		if ( ! has_blocks( $comment_content ) ) {
			return $comment_content;
		}

		$blocks          = parse_blocks( $comment_content );
		$comment_content = '';

		$allowed_blocks = self::get_allowed_blocks();
		foreach ( $blocks as $block ) {
			if ( in_array( $block['blockName'], $allowed_blocks, true ) ) {
				$comment_content .= render_block( $block );
			}
		}

		return $comment_content;
	}

	/**
	 * Remove blocks that aren't allowed
	 *
	 * @param string $content - Text of the comment.
	 * @return string
	 */
	public function remove_blocks( $content ) {
		if ( ! has_blocks( $content ) ) {
			return $content;
		}

		$allowed_blocks = self::get_allowed_blocks();
		// The block attributes come slashed and `parse_blocks` won't be able to parse them.
		$content = wp_unslash( $content );
		$blocks  = parse_blocks( $content );
		$output  = '';

		foreach ( $blocks as $block ) {
			if ( in_array( $block['blockName'], $allowed_blocks, true ) ) {
				$output .= serialize_block( $block );
			}
		}

		return ltrim( $output );
	}

	/**
	 * Get a list of allowed blocks by looking at the allowed comment tags
	 *
	 * @return string[]
	 */
	public static function get_allowed_blocks() {
		global $allowedtags;

		$allowed_blocks = array( 'core/paragraph', 'core/list', 'core/code', 'core/list-item', 'core/quote', 'core/image', 'core/embed' );
		$convert        = array(
			'blockquote' => 'core/quote',
			'h1'         => 'core/heading',
			'h2'         => 'core/heading',
			'h3'         => 'core/heading',
			'img'        => 'core/image',
			'ul'         => 'core/list',
			'ol'         => 'core/list',
			'pre'        => 'core/code',
		);

		foreach ( array_keys( $allowedtags ) as $tag ) {
			if ( isset( $convert[ $tag ] ) ) {
				$allowed_blocks[] = $convert[ $tag ];
			}
		}

		return $allowed_blocks;
	}
}
