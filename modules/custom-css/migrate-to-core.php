<?php

class Jetpack_Custom_CSS_Data_Migration {
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'register_legacy_post_type' ) );
	}

	public static function do_migration() {
        if ( ! post_type_exists( 'safecss' ) ) {
            self::register_legacy_post_type();
        }

        $revisions = self::get_all_revisions();
        if ( empty( $revisions ) || ! is_array( $revisions ) ) {
            do_action( 'jetpack-custom_css-4.7_migration_finished', 0 );
            return null;
        }

        $revisions = array_reverse( $revisions );
        $themes = self::get_themes();

        foreach ( $revisions as $post_id => $post ) {
            // Get the stylesheet.  If null, the theme is no longer available.  Skip.
            $stylesheet = isset( $themes[ $post->post_excerpt ] ) ? $themes[ $post->post_excerpt ] : null;
            if ( empty( $stylesheet ) ) {
                continue;
            }

            $css = $post->post_content;
            $pre = $post->post_content_filtered;
            list( $preprocessor, $replace, $content_width ) = self::get_options( $post->ID );
            $mod_gmt = $post->post_modified_gmt;
            $author = $post->post_author;

            // Format here into calls to wp_insert_post() or wp_update_post()
        }
    }

	public static function register_legacy_post_type() {
		// Register safecss as a custom post_type
		// Explicit capability definitions are largely unnecessary because the posts are manipulated in code via an options page, managing CSS revisions does check the capabilities, so let's ensure that the proper caps are checked.
		register_post_type( 'safecss', array(
			'label'        => 'Custom CSS',
			'supports'     => array( 'revisions' ),
			'can_export'   => false,
			'rewrite'      => false,
			'capabilities' => array(
				'edit_post'          => 'edit_theme_options',
				'read_post'          => 'read',
				'delete_post'        => 'edit_theme_options',
				'edit_posts'         => 'edit_theme_options',
				'edit_others_posts'  => 'edit_theme_options',
				'publish_posts'      => 'edit_theme_options',
				'read_private_posts' => 'read',
			),
		) );
	}

	public static function get_post() {
		/**
		 * Filter the ID of the post where Custom CSS is stored, before the ID is retrieved.
		 *
		 * If the callback function returns a non-null value, then post_id() will immediately
		 * return that value, instead of retrieving the normal post ID.
		 *
		 * @module custom-css
		 *
		 * @since 3.8.1
		 *
		 * @param null null The ID to return instead of the normal ID.
		 */
		$custom_css_post_id = apply_filters( 'jetpack_custom_css_pre_post_id', null );
		if ( ! is_null( $custom_css_post_id ) ) {
			return get_post( $custom_css_post_id );
		}

		$custom_css_post_id = wp_cache_get( 'custom_css_post_id' );

		if ( false === $custom_css_post_id ) {
			$custom_css_posts = get_posts( array(
				'posts_per_page' => 1,
				'post_type'      => 'safecss',
				'post_status'    => 'publish',
				'orderby'        => 'date',
				'order'          => 'DESC',
			) );

			if ( count( $custom_css_posts ) > 0 ) {
				$custom_css_post_id = $custom_css_posts[0]->ID;
			} else {
				$custom_css_post_id = 0;
			}

			// Save post_id=0 to note that no safecss post exists.
			wp_cache_set( 'custom_css_post_id', $custom_css_post_id );
		}

		if ( ! $custom_css_post_id ) {
			return false;
		}

		return get_post( $custom_css_post_id );
	}

	public static function get_all_revisions() {
		$post = self::get_post();
		$revisions = wp_get_post_revisions( $post->ID, array(
			'posts_per_page' => -1,
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );

		return $revisions;
	}

	public static function get_options( $post_id = null ) {
		if ( empty( $post_id ) ) {
			$post = self::get_post();
			$post_id = $post->ID;
		}

		$meta = get_post_meta( $post_id );

		return array(
			'preprocessor'  => isset( $meta['custom_css_preprocessor'][0] ) ? $meta['custom_css_preprocessor'][0] : '',
			'replace'       => isset( $meta['custom_css_add'][0] )          ? $meta['custom_css_add'][0]          : '',
			'content_width' => isset( $meta['content_width'][0] )           ? $meta['content_width'][0]           : '',
		);
	}

	public static function get_themes() {
        $themes = wp_get_themes( array( 'errors' => null ) );
        $all = array();
        foreach ( $themes as $theme ) {
            $all[ $theme->name ] = $theme->stylesheet;
        }
        return $all;
    }
}

Jetpack_Custom_CSS_Data_Migration::add_hooks();
