<?php
/**
 * Module Name: Copy Post
 * Module Description: Copy an existing post's content into a new post.
 * Jumpstart Description: Copy an existing post's content into a new post.
 * Sort Order: 15
 * First Introduced: 6.9
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: copy, duplicate
 */

if ( empty( $_GET['copy'] ) ) {
    return;
}

class Jetpack_Copy_Post_By_Param {
    private $post;

    function __construct() {
        $post = get_post( $_GET['copy'] );
        error_log($post);
        if ( ! $post || ! $this->user_can_edit_post( $post ) ) {
            return;
        }

        $this->post = $post;

        add_filter( 'default_title', array( $this, 'default_title' ) );
        add_filter( 'default_content', array( $this, 'default_content' ) );
        add_filter( 'default_excerpt', array( $this, 'default_excerpt' ) );

        do_action( 'jetpack_post_copy_post' );
    }

    function default_title() {
        return $this->post->post_title;
    }

    function default_content() {
        return $this->post->post_content;
    }

    function default_excerpt() {
        return $this->post->post_excerpt;
    }

    protected function user_can_edit_post( $post ) {
        return get_current_user_id() === (int) $post->post_author || current_user_can( 'edit_others_posts' );
    }
}

function jetpack_copy_post_by_param_init() {
    new Jetpack_Copy_Post_By_Param();
}
add_action( 'init', 'jetpack_copy_post_by_param_init' );
