<?php
/**
 * Module Name: Copy Post
 * Module Description: Copy an existing post's content into a new post.
 * Jumpstart Description: Copy an existing post's content into a new post.
 * Sort Order: 15
 * First Introduced: 6.9
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: copy, duplicate
 */

class Jetpack_Copy_Post_By_Param {
    function __construct() {
        // Add row actions to post/page/CPT listing screens.
        if ( 'edit.php' === $GLOBALS[ 'pagenow' ] ) {
            add_filter( 'post_row_actions', array( $this, 'add_row_action' ), 10, 2 );
            add_filter( 'page_row_actions', array( $this, 'add_row_action' ), 10, 2 );
            return;
        }

        // Process any `?copy` param if on a create new post/page/CPT screen.
        if ( ! empty( $_GET[ 'copy' ] ) && 'post-new.php' === $GLOBALS[ 'pagenow' ] ) {
            add_action( 'wp_insert_post', array( $this, 'update_post_data' ), 10, 3 );
        }
    }

    protected function user_can_edit_post( $post ) {
        return get_current_user_id() === (int) $post->post_author || current_user_can( 'edit_others_posts' );
    }

    function update_post_data( $target_post_id, $post, $update ) {
        if ( $update ) {
            return;
        }

        $source_post = get_post( $_GET['copy'] );
        if ( ! $source_post || ! $this->user_can_edit_post( $source_post ) ) {
            return;
        }

        $update_content = $this->update_content_and_taxonomies( $source_post, $target_post_id );
        $update_featured_image = $this->update_featured_image( $source_post, $target_post_id );
        $update_post_format = $this->update_post_format( $source_post, $target_post_id );

        // Required to satify get_default_post_to_edit(), which has these filters after post creation.
        add_filter( 'default_title', array( $this, 'filter_title' ), 10, 2 );
        add_filter( 'default_content', array( $this, 'filter_content' ), 10, 2 );
        add_filter( 'default_excerpt', array( $this, 'filter_excerpt' ), 10, 2 );

        do_action( 'jetpack_copy_post', $source_post, $target_post_id, $update_content, $update_featured_image, $update_post_format );
    }

    protected function update_content_and_taxonomies( $source_post, $target_post_id ) {
        $data = apply_filters( 'jetpack_copy_post_data', array(
            'ID' => $target_post_id,
            'post_title' => $source_post->post_title,
            'post_content' => $source_post->post_content,
            'post_excerpt' => $source_post->post_excerpt,
            'post_category' => $source_post->post_category,
            'tags_input' => $source_post->tags_input,
        ) );
        return wp_update_post( $data );
    }

    protected function update_featured_image( $source_post, $target_post_id ) {
        $featured_image_id = get_post_thumbnail_id( $source_post );
        return update_post_meta( $target_post_id, '_thumbnail_id', $featured_image_id );
    }

    protected function update_post_format( $source_post, $target_post_id ) {
        $post_format = get_post_format( $source_post );
        return set_post_format( $target_post_id, $post_format );
    }

    function filter_title( $post_title, $post ) {
        return $post->post_title;
    }

    function filter_content( $post_content, $post ) {
        return $post->post_content;
    }

    function filter_excerpt( $post_excerpt, $post ) {
        return $post->post_excerpt;
    }

    function add_row_action( $actions, $post ) {
        $edit_url = add_query_arg( array(
            'post_type' => $post->post_type,
            'copy' => $post->ID,
            '_wpnonce' => wp_create_nonce( 'jetpack-copy-post' ),
        ), admin_url( 'post-new.php' ) );
        $edit_action = array(
            'copy' => sprintf(
                '<a href="%s" aria-label="%s">%s</a>',
                esc_url( $edit_url ),
                esc_attr( __( 'Copy this post.' ) ),
                __( 'Copy' )
            ),
        );

        // Insert the Copy action before the Trash action.
        $edit_offset = array_search( 'trash', array_keys( $actions ), true );
        $actions = array_merge(
            array_slice( $actions, 0, $edit_offset ),
            $edit_action,
            array_slice( $actions, $edit_offset )
        );

        return $actions;
    }
}

function jetpack_copy_post_by_param_init() {
    new Jetpack_Copy_Post_By_Param();
}
add_action( 'admin_init', 'jetpack_copy_post_by_param_init' );
