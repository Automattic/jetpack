<?php
/**
 * Search Highlighter: Handles highlighting of search terms in content
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Search Highlighter class
 */
class Inline_Search_Highlighter {
	/**
	 * Stores highlighted content from search results.
	 *
	 * @var array
	 */
	private $highlighted_content = array();

	/**
	 * Stores the list of post IDs that are actual search results.
	 *
	 * @var array
	 */
	private $search_result_ids = array();

	/**
	 * Constructor
	 *
	 * @param array $search_result_ids Array of post IDs from search results.
	 * @param array $results          Optional. The search result data from the API to process immediately.
	 */
	public function __construct( $search_result_ids = array(), $results = null ) {
		$this->search_result_ids   = $search_result_ids;
		$this->highlighted_content = array();

		// Process API results immediately if provided
		if ( $results !== null ) {
			$this->process_results( $results );
		}
	}

	/**
	 * Set up the WordPress filters for highlighting.
	 */
	public function setup() {
		add_filter( 'the_title', array( $this, 'filter_highlighted_title' ), 10, 2 );
		add_filter( 'the_content', array( $this, 'filter_highlighted_content' ), 10, 1 );
		add_filter( 'the_excerpt', array( $this, 'filter_highlighted_content' ), 10, 1 );
		add_filter( 'comment_text', array( $this, 'filter_highlighted_comment' ), 10, 2 );
		add_filter( 'render_block_core/post-excerpt', array( $this, 'filter_render_excerpt_block' ), 10, 3 );
		add_filter( 'render_block_core/post-content', array( $this, 'filter_render_content_block' ), 10, 3 );
	}

	/**
	 * Process highlighting data for search results.
	 *
	 * @param array $results The search result data from the API.
	 */
	public function process_results( $results ) {
		$this->highlighted_content = array();

		if ( empty( $results ) || ! is_array( $results ) ) {
			return;
		}

		foreach ( $results as $result ) {
			$post_id = (int) ( $result['fields']['post_id'] ?? 0 );
			$this->process_result_highlighting( $result, $post_id );
		}
	}

	/**
	 * Update search result IDs.
	 *
	 * @param array $search_result_ids Array of post IDs from search results.
	 */
	public function update_search_data( $search_result_ids = array() ) {
		$this->search_result_ids = $search_result_ids;
	}

	/**
	 * Filter the post title to show highlighted version.
	 *
	 * @param string $title The post title.
	 * @param int    $post_id The post ID.
	 * @return string The filtered title.
	 */
	public function filter_highlighted_title( $title, $post_id ) {
		if ( ! $this->is_search_result( $post_id ) ) {
			return $title;
		}

		if ( ! empty( $this->highlighted_content[ $post_id ]['title'] ) ) {
			return $this->highlighted_content[ $post_id ]['title'];
		}

		return $title;
	}

	/**
	 * Filter the post content to show highlighted version.
	 *
	 * @param string $content The post content.
	 * @return string The filtered content.
	 */
	public function filter_highlighted_content( $content ) {
		$post_id = get_the_ID();

		if ( ! $this->is_search_result( $post_id ) ) {
			return $content;
		}

		if ( ! empty( $this->highlighted_content[ $post_id ]['content'] ) ) {
			// Apply wpautop to maintain paragraph formatting.
			return wpautop( $this->highlighted_content[ $post_id ]['content'] );
		}

		return $content;
	}

	/**
	 * Filter comment text to show highlighted version.
	 *
	 * @param string $comment_text The comment text.
	 * @return string The filtered comment text.
	 */
	public function filter_highlighted_comment( $comment_text ) {
		if ( ! is_search() || ! in_the_loop() ) {
			return $comment_text;
		}

		$post_id = get_the_ID();

		if ( ! $this->is_search_result( $post_id ) || empty( $this->highlighted_content[ $post_id ]['comments'] ) ) {
			return $comment_text;
		}

		return $this->highlighted_content[ $post_id ]['comments'];
	}

	/**
	 * Process highlighting data for a single search result.
	 *
	 * @param array $result  The search result data from the API.
	 * @param int   $post_id The post ID for this result.
	 */
	private function process_result_highlighting( $result, $post_id ) {
		if ( empty( $result['highlight'] ) ) {
			return;
		}

		$title    = $this->extract_highlight_field( $result, 'title' );
		$content  = $this->extract_highlight_field( $result, 'content' );
		$comments = $this->extract_highlight_field( $result, 'comments' );

		$this->highlighted_content[ $post_id ] = array(
			'title'    => $title,
			'content'  => $content,
			'comments' => $comments,
		);
	}

	/**
	 * Extract a highlight field from the search result, handling different field formats.
	 *
	 * @param array  $result The search result data from the API.
	 * @param string $field  The field name to extract.
	 * @return string The extracted highlighted field.
	 */
	private function extract_highlight_field( $result, $field ) {
		// Try exact match first
		if ( isset( $result['highlight'][ $field ] ) && is_array( $result['highlight'][ $field ] ) && ! empty( $result['highlight'][ $field ] ) ) {
			return $result['highlight'][ $field ][0];
		}

		// Try field variants with suffixes (e.g., 'title.default')
		foreach ( $result['highlight'] as $key => $value ) {
			if ( strpos( $key, $field . '.' ) === 0 ) {
				if ( is_array( $value ) && ! empty( $value ) ) {
					return $value[0];
				}
			}
		}

		return '';
	}

	/**
	 * Check if the current post is a search result from our API
	 *
	 * @param int $post_id The post ID to check.
	 * @return bool Whether the post is a search result.
	 */
	public function is_search_result( $post_id ) {
		return is_search() && in_the_loop() && ! empty( $this->search_result_ids ) && in_array( $post_id, $this->search_result_ids, true );
	}

	/**
	 * Get the highlighted content for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return array|null The highlighted content array or null if not found.
	 */
	public function get_highlighted_content( $post_id ) {
		return $this->highlighted_content[ $post_id ] ?? null;
	}

	/**
	 * Filter for rendering post excerpts with highlights when available
	 *
	 * @since $$next-version$$
	 * @param string $block_content The block content.
	 * @param array  $block The block data.
	 * @param object $instance The block instance.
	 * @return string The filtered block content.
	 */
	public function filter_render_excerpt_block( $block_content, $block, $instance ) {
		if ( ! isset( $instance->context['postId'] ) || ! $this->is_search_result( $instance->context['postId'] ) ) {
			return $block_content;
		}

		$highlighted_content = $this->get_highlighted_content( $instance->context['postId'] );

		// If we don't have any highlighted content or comments, return the original block content
		if ( empty( $highlighted_content['content'] ) && empty( $highlighted_content['comments'] ) ) {
			return $block_content;
		}

		// Start with the content highlights if available
		if ( ! empty( $highlighted_content['content'] ) ) {
			$block_content = wpautop( $highlighted_content['content'] );
		}

		// Append comment highlights if available
		if ( ! empty( $highlighted_content['comments'] ) ) {
			$block_content .= ' ... ' . $highlighted_content['comments'];
		}

		// Handle more text display if needed
		$more_text = ! empty( $block['attrs']['moreText'] ) ? '<a class="wp-block-post-excerpt__more-text">' . $block['attrs']['moreText'] . '</a>' : '';

		$classes = array();
		if ( isset( $block['attrs']['textAlign'] ) ) {
			$classes[] = 'has-text-align-' . $block['attrs']['textAlign'];
		}

		if ( isset( $block['attrs']['style']['elements']['link']['color']['text'] ) ) {
			$classes[] = 'has-link-color';
		}

		$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

		// Determine if we should show more text on new line based on block attributes
		$show_more_on_new_line = ! isset( $block['attrs']['showMoreOnNewLine'] ) || $block['attrs']['showMoreOnNewLine'];

		if ( $show_more_on_new_line && ! empty( $more_text ) ) {
			$block_content .= '</p><p class="wp-block-post-excerpt__more-text">' . $more_text . '</p>';
		} elseif ( ! empty( $more_text ) ) {
			$block_content .= " $more_text</p>";
		}

		return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $block_content );
	}

	/**
	 * Filter for rendering post content with highlights when available
	 *
	 * @since $$next-version$$
	 * @param string $block_content The block content.
	 * @param array  $block The block data.
	 * @param object $instance The block instance.
	 * @return string The filtered block content.
	 */
	public function filter_render_content_block( $block_content, $block, $instance ) {
		static $seen_ids = array();

		if ( ! isset( $instance->context['postId'] ) ) {
			return $block_content;
		}

		$post_id = $instance->context['postId'];

		// Prevent infinite recursion
		if ( isset( $seen_ids[ $post_id ] ) ) {
			$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;
			return $is_debug ? __( '[block rendering halted]', 'jetpack-search-pkg' ) : '';
		}

		$seen_ids[ $post_id ] = true;

		// Only apply highlighting for search results
		if ( ! $this->is_search_result( $post_id ) ) {
			unset( $seen_ids[ $post_id ] );
			return $block_content;
		}

		$highlighted_content = $this->get_highlighted_content( $post_id );

		// If we don't have any highlighted content, return the original block content
		if ( empty( $highlighted_content['content'] ) ) {
			unset( $seen_ids[ $post_id ] );
			return $block_content;
		}

		// Get the highlighted content and apply formatting
		$content = $highlighted_content['content'];

		// Apply content filters like the core function does
		$content = apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', $content ) );
		unset( $seen_ids[ $post_id ] );

		if ( empty( $content ) ) {
			return '';
		}

		// Create wrapper classes
		$classes = array( 'entry-content' );
		if ( isset( $block['attrs']['textAlign'] ) ) {
			$classes[] = 'has-text-align-' . $block['attrs']['textAlign'];
		}

		if ( isset( $block['attrs']['style']['elements']['link']['color']['text'] ) ) {
			$classes[] = 'has-link-color';
		}

		$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

		return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $content );
	}
}
