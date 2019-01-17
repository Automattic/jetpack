<?php
/**
 * Module Name: Copy Post
 * Module Description: Copy an existing post's content into a new post.
 * Jumpstart Description: Copy an existing post's content into a new post.
 * Sort Order: 15
 * First Introduced: 7.0
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: copy, duplicate
 */

/**
 * Copy Post class.
 */
class Jetpack_Copy_Post {
	/**
	 * Jetpack_Copy_Post_By_Param constructor.
	 * Add row actions to post/page/CPT listing screens.
	 * Process any `?copy` param if on a create new post/page/CPT screen.
	 *
	 * @return void
	 */
	protected function __construct() {
		if ( 'edit.php' === $GLOBALS['pagenow'] ) {
			add_filter( 'post_row_actions', array( $this, 'add_row_action' ), 10, 2 );
			add_filter( 'page_row_actions', array( $this, 'add_row_action' ), 10, 2 );
			return;
		}

		if ( ! empty( $_GET['jetpack-copy'] ) && 'post-new.php' === $GLOBALS['pagenow'] ) {
			add_action( 'wp_insert_post', array( $this, 'update_post_data' ), 10, 3 );
		}
	}

	/**
	 * Update the new (target) post data with the source post data.
	 *
	 * @param int     $target_post_id Target post ID.
	 * @param WP_Post $post           Target post object (not used).
	 * @param bool    $update         Whether this is an existing post being updated or not.
	 * @return void
	 */
	public function update_post_data( $target_post_id, $post, $update ) {
		// This avoids infinite loops of trying to update our updated post.
		if ( ! wp_verify_nonce( $_GET['_wpnonce'], 'jetpack-copy-post' ) || $update ) {
			return;
		}

		$source_post = get_post( $_GET['jetpack-copy'] );
		if ( ! $source_post || ! $this->user_can_edit_post( $source_post ) ) {
			return;
		}

		$update_content        = $this->update_content_and_taxonomies( $source_post, $target_post_id );
		$update_featured_image = $this->update_featured_image( $source_post, $target_post_id );
		$update_post_format    = $this->update_post_format( $source_post, $target_post_id );

		// Required to satify get_default_post_to_edit(), which has these filters after post creation.
		add_filter( 'default_title', array( $this, 'filter_title' ), 10, 2 );
		add_filter( 'default_content', array( $this, 'filter_content' ), 10, 2 );
		add_filter( 'default_excerpt', array( $this, 'filter_excerpt' ), 10, 2 );

		do_action( 'jetpack_copy_post', $source_post, $target_post_id, $update_content, $update_featured_image, $update_post_format );
	}

	/**
	 * Determine if the current user has access to the source post.
	 *
	 * @param WP_Post $post Source post object (the post being copied).
	 * @return bool         True if current user is the post author, or has permissions for `edit_others_posts`; false otherwise.
	 */
	protected function user_can_edit_post( $post ) {
		return get_current_user_id() === (int) $post->post_author || current_user_can( 'edit_others_posts' );
	}

	/**
	 * Update the target post's title, content, excerpt, categories, and tags.
	 *
	 * @param WP_Post $source_post Post object to be copied.
	 * @param int     $target_post_id Target post ID.
	 * @return int    0 on failure, or the updated post ID on success.
	 */
	protected function update_content_and_taxonomies( $source_post, $target_post_id ) {
		$data = array(
			'ID'            => $target_post_id,
			'post_title'    => $source_post->post_title,
			'post_content'  => $source_post->post_content,
			'post_excerpt'  => $source_post->post_excerpt,
			'post_category' => $source_post->post_category,
			'tags_input'    => $source_post->tags_input,
		);
		$data = apply_filters( 'jetpack_copy_post_data', $data, $source_post, $target_post_id );
		return wp_update_post( $data );
	}

	/**
	 * Update the target post's featured image.
	 *
	 * @param WP_Post $source_post Post object to be copied.
	 * @param int     $target_post_id Target post ID.
	 * @return int|bool Meta ID if the key didn't exist, true on successful update, false on failure.
	 */
	protected function update_featured_image( $source_post, $target_post_id ) {
		$featured_image_id = get_post_thumbnail_id( $source_post );
		return update_post_meta( $target_post_id, '_thumbnail_id', $featured_image_id );
	}

	/**
	 * Update the target post's post format.
	 *
	 * @param WP_Post $source_post Post object to be copied.
	 * @param int     $target_post_id Target post ID.
	 * @return array|WP_Error|false WP_Error on error, array of affected term IDs on success.
	 */
	protected function update_post_format( $source_post, $target_post_id ) {
		$post_format = get_post_format( $source_post );
		return set_post_format( $target_post_id, $post_format );
	}

	/**
	 * Update the target post's title.
	 *
	 * @param string  $post_title Post title determined by `get_default_post_to_edit()`.
	 * @param WP_Post $post       Post object of newly-inserted post.
	 * @return string             Updated post title from source post.
	 */
	public function filter_title( $post_title, $post ) {
		return $post->post_title;
	}

	/**
	 * Update the target post's content (`post_content`).
	 *
	 * @param string  $post_content Post content determined by `get_default_post_to_edit()`.
	 * @param WP_Post $post         Post object of newly-inserted post.
	 * @return string               Updated post content from source post.
	 */
	public function filter_content( $post_content, $post ) {
		return $post->post_content;
	}

	/**
	 * Update the target post's excerpt.
	 *
	 * @param string  $post_excerpt Post excerpt determined by `get_default_post_to_edit()`.
	 * @param WP_Post $post         Post object of newly-inserted post.
	 * @return string               Updated post excerpt from source post.
	 */
	public function filter_excerpt( $post_excerpt, $post ) {
		return $post->post_excerpt;
	}

	/**
	 * Add a "Copy" row action to posts/pages/CPTs on list views.
	 *
	 * @param array   $actions Existing actions.
	 * @param WP_Post $post    Post object of current post in list.
	 * @return array           Array of updated row actions.
	 */
	public function add_row_action( $actions, $post ) {
		$edit_url    = add_query_arg(
			array(
				'post_type'    => $post->post_type,
				'jetpack-copy' => $post->ID,
				'_wpnonce'     => wp_create_nonce( 'jetpack-copy-post' ),
			),
			admin_url( 'post-new.php' )
		);
		$edit_action = array(
			'jetpack-copy' => sprintf(
				'<a href="%s" aria-label="%s">%s</a>',
				esc_url( $edit_url ),
				esc_attr__( 'Copy this post.', 'jetpack' ),
				esc_html__( 'Copy', 'jetpack' )
			),
		);

		// Insert the Copy action before the Trash action.
		$edit_offset = array_search( 'trash', array_keys( $actions ), true );
		$actions     = array_merge(
			array_slice( $actions, 0, $edit_offset ),
			$edit_action,
			array_slice( $actions, $edit_offset )
		);

		return $actions;
	}
}

/**
 * Instantiate an instance of Jetpack_Copy_Post on the `admin_init` hook.
 */
function jetpack_copy_post_init() {
	new Jetpack_Copy_Post();
}
add_action( 'admin_init', 'jetpack_copy_post_init' );
