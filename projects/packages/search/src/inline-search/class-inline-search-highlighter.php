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
	private $highlighted_content;

	/**
	 * Stores the list of post IDs that are actual search results.
	 *
	 * @var array
	 */
	private $search_result_ids;

	/**
	 * Constructor
	 *
	 * @param array      $search_result_ids     Array of post IDs from search results.
	 * @param array|null $results          Optional. The search result data from the API to process immediately.
	 */
	public function __construct( array $search_result_ids = array(), ?array $results = null ) {
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
	public function setup(): void {
		add_filter( 'the_title', array( $this, 'filter_highlighted_title' ), 10, 2 );
		add_filter( 'the_excerpt', array( $this, 'filter_highlighted_excerpt' ) );
		add_filter( 'render_block_core/post-excerpt', array( $this, 'filter_render_highlighted_block' ), 10, 3 );
	}

	/**
	 * Process highlighting data for search results.
	 *
	 * @param array $results The search result data from the API.
	 */
	public function process_results( array $results ): void {
		$this->highlighted_content = array();

		if ( empty( $results ) ) {
			return;
		}

		foreach ( $results as $result ) {
			$post_id = (int) ( $result['fields']['post_id'] ?? 0 );
			$this->process_result_highlighting( $result, $post_id );
		}
	}

	/**
	 * Filter the post title to show highlighted version.
	 *
	 * @param string   $title   The post title.
	 * @param int|null $post_id Optional. The post ID. Default null.
	 *
	 * @return string The filtered title.
	 */
	public function filter_highlighted_title( string $title, ?int $post_id = null ): string {
		// o2 is currently rendering <mark> tags in post titles, so we need to return the original.
		$body_class = get_body_class();
		if ( is_array( $body_class ) && in_array( 'o2', $body_class, true ) ) {
			return $title;
		}

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
	 *
	 * @return string The filtered content.
	 */
	public function filter_highlighted_excerpt( string $content ): string {
		$post_id = get_the_ID();

		if ( ! $this->is_search_result( $post_id ) ) {
			return $content;
		}

		// Skip highlighting if we're in a block theme context in favour of filter_render_highlighted_block().
		if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
			return $content;
		}

		if ( ! empty( $this->highlighted_content[ $post_id ]['content'] ) ) {
			return wpautop( $this->highlighted_content[ $post_id ]['content'] );
		}

		return $content;
	}

	/**
	 * Process highlighting data for a single search result.
	 *
	 * @param array $result  The search result data from the API.
	 * @param int   $post_id The post ID for this result.
	 */
	private function process_result_highlighting( array $result, int $post_id ): void {
		if ( empty( $result['highlight'] ) ) {
			return;
		}

		$title   = $this->extract_highlight_field( $result, 'title' );
		$content = $this->extract_highlight_field( $result, 'content' );

		$this->highlighted_content[ $post_id ] = array(
			'title'   => $title,
			'content' => $content,
		);
	}

	/**
	 * Extract a highlight field from the search result, handling different field formats.
	 *
	 * @param array  $result The search result data from the API.
	 * @param string $field  The field name to extract.
	 *
	 * @return string The extracted highlighted field.
	 */
	private function extract_highlight_field( array $result, string $field ): string {
		if ( isset( $result['highlight'][ $field ] ) && is_array( $result['highlight'][ $field ] ) ) {
			return $result['highlight'][ $field ][0];
		}

		// Try field variants with suffixes (e.g., 'title.default') if no direct match found.
		foreach ( $result['highlight'] as $key => $value ) {
			if ( str_starts_with( $key, $field . '.' ) ) {
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
	 * @param int|null $post_id The post ID to check.
	 *
	 * @return bool Whether the post is a search result.
	 */
	public function is_search_result( ?int $post_id ): bool {
		// o2 is initially returning null due to mishandling of the_title() filter.
		if ( null === $post_id ) {
			return false;
		}

		return is_search() && in_the_loop() && ! empty( $this->search_result_ids ) && in_array( $post_id, $this->search_result_ids, true );
	}

	/**
	 * Filter for rendering highlighted content when highlighting is returned from the API.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block The block data.
	 * @param object $instance The block instance.
	 *
	 * @return string The filtered block content.
	 * @since 0.50.0
	 */
	public function filter_render_highlighted_block( string $block_content, array $block, object $instance ): string {
		if ( ! isset( $instance->context['postId'] ) || ! $this->is_search_result( $instance->context['postId'] ) ) {
			return $block_content;
		}

		$highlighted_content = $this->highlighted_content[ $instance->context['postId'] ] ?? null;

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
}
