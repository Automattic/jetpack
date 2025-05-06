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
class Search_Highlighter {
	/**
	 * Stores highlighted content from search results.
	 *
	 * @var array
	 */
	private $highlighted_content = array();

	/**
	 * Stores the search term used in the query.
	 *
	 * @var string
	 */
	private $search_term;

	/**
	 * Stores the corrected search term if provided by the API.
	 *
	 * @var string
	 */
	private $corrected_search_term;

	/**
	 * Stores the list of post IDs that are actual search results.
	 *
	 * @var array
	 */
	private $search_result_ids = array();

	/**
	 * Constructor
	 *
	 * @param string $search_term           The original search term.
	 * @param string $corrected_search_term The corrected search term (if any).
	 * @param array  $search_result_ids     Array of post IDs from search results.
	 * @param array  $results               Optional. The search result data from the API to process immediately.
	 */
	public function __construct( $search_term = '', $corrected_search_term = '', $search_result_ids = array(), $results = null ) {
		$this->search_term           = $search_term;
		$this->corrected_search_term = $corrected_search_term;
		$this->search_result_ids     = $search_result_ids;
		$this->highlighted_content   = array();

		// Process results immediately if provided
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
		add_filter( 'comment_text', array( $this, 'filter_highlighted_comment' ), 10, 2 );
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
	 * Update search terms and result IDs.
	 *
	 * @param string $search_term The original search term.
	 * @param string $corrected_search_term The corrected search term (if any).
	 * @param array  $search_result_ids Array of post IDs from search results.
	 */
	public function update_search_data( $search_term, $corrected_search_term = '', $search_result_ids = array() ) {
		$this->search_term           = $search_term;
		$this->corrected_search_term = $corrected_search_term;
		$this->search_result_ids     = $search_result_ids;
	}

	/**
	 * Filter the post title to show highlighted version.
	 *
	 * @param string $title The post title.
	 * @param int    $post_id The post ID.
	 * @return string The filtered title.
	 */
	public function filter_highlighted_title( $title, $post_id ) {
		// Only process if this is one of our search results
		if ( ! $this->is_search_result( $post_id ) ) {
			return $title;
		}

		// Check if we have a highlighted title from the API
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
		// Get current post ID
		$post_id = get_the_ID();

		// Only process if this is one of our search results
		if ( ! $this->is_search_result( $post_id ) ) {
			return $content;
		}

		if ( ! empty( $this->highlighted_content[ $post_id ]['content'] ) ) {
			return $this->highlighted_content[ $post_id ]['content'];
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
		// Only process if this is one of our search results and we're in a search context
		if ( ! is_search() || ! in_the_loop() ) {
			return $comment_text;
		}

		$post_id = get_the_ID();

		// Check if this post is a search result and we have highlighted comments for it
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

		// Check for data in various highlight field formats.
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
		// Try all possible field variants in order of likelihood
		foreach ( $result['highlight'] as $key => $value ) {
			// Check if this key is for our requested field (exact match or with suffix)
			if ( $key === $field || strpos( $key, $field . '.' ) === 0 ) {
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
	private function is_search_result( $post_id ) {
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
}
