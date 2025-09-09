<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Helpers;

use WP_Post;
use WP_Query;

/**
 * Helper class for post querying operations
 *
 * Provides reusable post query functionality that can be used by multiple abilities.
 * Handles security features like confidential post exclusion automatically.
 */
class PostQueryHelper {

	/**
	 * Execute a post query with the given parameters
	 *
	 * @param array $input Query parameters.
	 * @return array Query results with posts and metadata.
	 */
	public static function query_posts( array $input ): array {
		// Set up query arguments.
		$args = self::build_query_args( $input );

		// Execute the query.
		$query = new WP_Query( $args );
		$posts = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$posts[] = self::format_post_data( get_the_ID(), false );
			}
		}

		// Reset post data.
		wp_reset_postdata();

		return array(
			'posts'        => $posts,
			'found_posts'  => $query->found_posts,
			'max_pages'    => $query->max_num_pages,
			'current_page' => intval( $args['paged'] ),
		);
	}

	/**
	 * Build WP_Query arguments from input parameters
	 *
	 * @param array $input Input parameters.
	 * @return array WP_Query arguments.
	 */
	private static function build_query_args( array $input ): array {
		$args = array(
			'post_type'      => $input['post_type'] ?? 'post',
			'posts_per_page' => min( $input['posts_per_page'] ?? 10, 50 ),
			'paged'          => $input['paged'] ?? 1,
			'order'          => $input['order'] ?? 'DESC',
			'orderby'        => $input['orderby'] ?? 'date',
			'post_status'    => $input['post_status'] ?? 'publish',
		);

		// Add search query if provided.
		if ( ! empty( $input['search'] ) ) {
			$args['s'] = sanitize_text_field( $input['search'] );
		}

		// Add category filter.
		if ( ! empty( $input['category'] ) ) {
			if ( is_numeric( $input['category'] ) ) {
				$args['cat'] = intval( $input['category'] );
			} else {
				$args['category_name'] = sanitize_text_field( $input['category'] );
			}
		}

		// Add tag filter.
		if ( ! empty( $input['tag'] ) ) {
			if ( is_numeric( $input['tag'] ) ) {
				$args['tag_id'] = intval( $input['tag'] );
			} else {
				$args['tag'] = sanitize_text_field( $input['tag'] );
			}
		}

		// Add author filter.
		if ( ! empty( $input['author'] ) ) {
			$args['author'] = intval( $input['author'] );
		}

		// Add meta query handling.
		$args['meta_query'] = self::build_meta_query( $input );

		// Special handling for relevance ordering with search.
		if ( ! empty( $input['search'] ) && 'relevance' === $args['orderby'] ) {
			$args['orderby'] = 'relevance';
		}

		return $args;
	}

	/**
	 * Build meta query array including confidential post exclusion
	 *
	 * @param array $input Input parameters.
	 * @return array Meta query array.
	 */
	private static function build_meta_query( array $input ): array {
		// Set up meta query to exclude confidential posts.
		// Include posts that either don't have p2_confidential meta field OR it's not set to '1'.
		$confidential_meta_query = array(
			'relation' => 'OR',
			0          => array(
				'key'     => 'p2_confidential',
				'compare' => 'NOT EXISTS',
			),
			1          => array(
				'key'     => 'p2_confidential',
				'value'   => '1',
				'compare' => '!=',
			),
		);

		// Add user-provided meta query if meta_key and meta_value are provided.
		if ( ! empty( $input['meta_key'] ) && ! empty( $input['meta_value'] ) ) {
			return array(
				'relation' => 'AND',
				0          => $confidential_meta_query,
				1          => array(
					'key'   => sanitize_text_field( $input['meta_key'] ),
					'value' => sanitize_text_field( $input['meta_value'] ),
				),
			);
		}

		return $confidential_meta_query;
	}

	/**
	 * Format post data into consistent structure
	 *
	 * @param int  $post_id         Post ID.
	 * @param bool $include_comments Whether to include comments.
	 * @return array Formatted post data.
	 */
	private static function format_post_data( int $post_id, bool $include_comments = false ): array {
		$author_id = get_the_author_meta( 'ID' );

		$post_data = array(
			'ID'            => $post_id,
			'post_title'    => get_the_title(),
			'post_content'  => self::clean_content_for_llm( get_the_content() ),
			'post_excerpt'  => self::clean_content_for_llm( get_the_excerpt() ),
			'post_status'   => get_post_status(),
			'post_type'     => get_post_type(),
			'post_date'     => get_the_date( 'c' ),
			'post_modified' => get_the_modified_date( 'c' ),
			'permalink'     => get_permalink(),
			'author'        => array(
				'ID'           => $author_id,
				'display_name' => get_the_author_meta( 'display_name', (int) $author_id ),
			),
			'categories'    => wp_get_post_categories( $post_id, array( 'fields' => 'names' ) ),
			'tags'          => wp_get_post_tags( $post_id, array( 'fields' => 'names' ) ),
		);

		if ( $include_comments ) {
			$post_data['comments'] = self::get_post_comments( $post_id );
		}

		return $post_data;
	}

	/**
	 * Get comments for a post
	 *
	 * @param int $post_id Post ID.
	 * @return array Formatted comments data.
	 */
	private static function get_post_comments( int $post_id ): array {
		$comments = get_comments(
			array(
				'post_id' => $post_id,
				'status'  => 'approve',
				'orderby' => 'comment_date',
				'order'   => 'ASC',
			)
		);

		$formatted_comments = array();
		foreach ( $comments as $comment ) {
			$formatted_comments[] = array(
				'comment_ID'           => (int) $comment->comment_ID,
				'comment_content'      => self::clean_content_for_llm( $comment->comment_content ),
				'comment_author'       => $comment->comment_author,
				'comment_author_email' => $comment->comment_author_email,
				'comment_date'         => $comment->comment_date,
				'comment_approved'     => $comment->comment_approved,
				'comment_parent'       => (int) $comment->comment_parent,
			);
		}

		return $formatted_comments;
	}

	/**
	 * Clean content for LLM consumption by removing unnecessary elements
	 *
	 * @param string $content Raw content.
	 * @return string Cleaned content.
	 */
	private static function clean_content_for_llm( string $content ): string {
		// Target elements that should be preserved (from Post_Elements_Ids class).
		$allowed_tags = array( 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'section', 'article', 'blockquote', 'ul', 'ol', 'li' );

		// Build allowed tags string for strip_tags.
		$allowed_tags_string = '<' . implode( '><', $allowed_tags ) . '>';
		return strip_tags( $content, $allowed_tags_string );
	}

	/**
	 * Get a single post by ID or URL
	 *
	 * @param array $input Query parameters containing post_id or post_url.
	 * @return array|null Single post data or null if not found.
	 */
	public static function get_single_post( array $input ): ?array {
		$target_post = null;

		if ( ! empty( $input['post_id'] ) ) {
			$target_post = get_post( intval( $input['post_id'] ) );
		} elseif ( ! empty( $input['post_url'] ) ) {
			$post_id = url_to_postid( esc_url_raw( $input['post_url'] ) );
			if ( $post_id ) {
				$target_post = get_post( $post_id );
			}
		}

		if ( ! $target_post || is_wp_error( $target_post ) ) {
			return null;
		}

		// Check if post is confidential.
		$is_confidential = get_post_meta( $target_post->ID, 'p2_confidential', true );
		if ( '1' === $is_confidential ) {
			return null;
		}

		// Format post data directly without setting up global post data.
		return self::format_single_post_data( $target_post, $input['include_comments'] ?? false );
	}

	/**
	 * Format single post data directly from post object
	 *
	 * @param WP_Post $post            Post object.
	 * @param bool    $include_comments Whether to include comments.
	 * @return array Formatted post data.
	 */
	private static function format_single_post_data( WP_Post $post, bool $include_comments = false ): array {
		$author_id = $post->post_author;

		$post_data = array(
			'ID'            => $post->ID,
			'post_title'    => $post->post_title,
			'post_content'  => self::clean_content_for_llm( $post->post_content ),
			'post_excerpt'  => self::clean_content_for_llm( $post->post_excerpt ),
			'post_status'   => $post->post_status,
			'post_type'     => $post->post_type,
			'post_date'     => mysql2date( 'c', $post->post_date ),
			'post_modified' => mysql2date( 'c', $post->post_modified ),
			'permalink'     => get_permalink( $post->ID ),
			'author'        => array(
				'ID'           => (int) $author_id,
				'display_name' => get_the_author_meta( 'display_name', (int) $author_id ),
			),
			'categories'    => wp_get_post_categories( $post->ID, array( 'fields' => 'names' ) ),
			'tags'          => wp_get_post_tags( $post->ID, array( 'fields' => 'names' ) ),
		);

		if ( $include_comments ) {
			$post_data['comments'] = self::get_post_comments( $post->ID );
		}

		return $post_data;
	}

	/**
	 * Get current site information
	 *
	 * @return array Site information.
	 */
	public static function get_current_site_info(): array {
		$current_blog_id = get_current_blog_id();

		return array(
			'blog_id'   => $current_blog_id,
			'site_name' => get_bloginfo( 'name' ),
			'site_url'  => get_bloginfo( 'url' ),
		);
	}
}
