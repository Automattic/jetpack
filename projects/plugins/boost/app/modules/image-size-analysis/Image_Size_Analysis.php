<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Image_Analysis_Fix;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Image_Analysis_Start;

class Image_Size_Analysis implements Pluggable, Has_Endpoints, Is_Always_On {

	public function register_post_type() {
		// create a WordPress post_type called jb_image_fix

		$labels = array(
			'name'               => _x( 'Image Fixes', 'post type general name', 'jetpack-boost' ),
			'singular_name'      => _x( 'Image Fix', 'post type singular name', 'jetpack-boost' ),
			'menu_name'          => _x( 'Image Fixes', 'admin menu', 'jetpack-boost' ),
			'name_admin_bar'     => _x( 'Image Fix', 'add new on admin bar', 'jetpack-boost' ),
			'add_new'            => _x( 'Add New', 'image_fix', 'jetpack-boost' ),
			'add_new_item'       => __( 'Add New Image Fix', 'jetpack-boost' ),
			'new_item'           => __( 'New Image Fix', 'jetpack-boost' ),
			'edit_item'          => __( 'Edit Image Fix', 'jetpack-boost' ),
			'view_item'          => __( 'View Image Fix', 'jetpack-boost' ),
			'all_items'          => __( 'All Image Fixes', 'jetpack-boost' ),
			'search_items'       => __( 'Search Image Fixes', 'jetpack-boost' ),
			'parent_item_colon'  => __( 'Parent Image Fixes:', 'jetpack-boost' ),
			'not_found'          => __( 'No image fixes found.', 'jetpack-boost' ),
			'not_found_in_trash' => __( 'No image fixes found in Trash.', 'jetpack-boost' ),
		);

		$args = array(
			'label'               => __( 'Image Fixes', 'jetpack-boost' ),
			'description'         => __( 'Image Fixes', 'jetpack-boost' ),
			'labels'              => $labels,
			'supports'            => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
			'hierarchical'        => false,
			'public'              => false,
			'show_ui'             => false,
			'show_in_menu'        => false,
			'menu_position'       => 5,
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => true,
			'capability_type'     => 'page',
		);

		register_post_type( 'jb_image_fixes', $args );
	}

	private function get_fixes( $post_id ) {
		static $fixes = array();

		if ( isset( $fixes[ $post_id ] ) ) {
			return $fixes[ $post_id ];
		}

		$args      = array(
			'post_type'      => 'jb_image_fixes',
			'post_parent'    => $post_id,
			'posts_per_page' => -1,
		);
		$fix_posts = get_posts( $args );
		if ( is_array( $fix_posts ) && ! empty( $fix_posts ) ) {
			foreach ( $fix_posts as $fix_post ) {
				$fixes[ $post_id ][ $fix_post->post_title ] = json_decode( $fix_post->post_content, true );
			}
			return $fixes[ $post_id ];
		}

		return false;
	}

	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function fix_image( $sources, $size_array, $image_src, $image_meta, $attachment_id ) {
		global $post;

		$fixes = $this->get_fixes( $post->ID );

		// remove XxY dimension from $image_src as that's what's recorded by Image_Size_Analysis.
		$cleaned_up_image_src = preg_replace( '/-\d+x\d+\.jpg/', '.jpg', $image_src );
		if ( isset( $fixes[ $cleaned_up_image_src ] ) ) {

			$fix = $fixes[ $cleaned_up_image_src ];
			if ( isset( $fix['image_width'] ) ) {

				$sources [ $fix['image_width'] ] = array(
					'url'        => \Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url( $image_src, array( 'w' => $fix['image_width'] ) ),
					'descriptor' => 'w',
					'value'      => $fix['image_width'],
				);
			}
		}

		return $sources;
	}

	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function fix_sizes( $sizes, $size, $image_src, $image_meta, $attachment_id ) {
		global $post;
		$fixes                = $this->get_fixes( $post->ID );
		$cleaned_up_image_src = preg_replace( '/-\d+x\d+\.jpg/', '.jpg', $image_src );

		if ( isset( $fixes[ $cleaned_up_image_src ] ) ) {
			$fix = $fixes[ $cleaned_up_image_src ];
			if ( isset( $fix['image_width'] ) ) {
				$sizes = sprintf( '(max-width: %1$dpx) 100vw, %1$dpx', $fix['image_width'] );
			}
		}

		return $sizes;
	}

	public function fix_content( $content ) {
		global $post;
		$fixes = $this->get_fixes( $post->ID );
		if ( ! $fixes ) {
			return $content;
		}

		$tag_processor = new \WP_HTML_Tag_Processor( $content );

		while ( $tag_processor->next_tag( array( 'tag_name' => 'img' ) ) ) {
			$src                  = $tag_processor->get_attribute( 'src' );
			$srcset               = $tag_processor->get_attribute( 'srcset' );
			$cleaned_up_image_src = preg_replace( '/-\d+x\d+\.jpg/', '.jpg', $src );
			if ( ! isset( $fixes[ $cleaned_up_image_src ] ) ) {
				continue;
			}

			if ( empty( $srcset ) && isset( $fixes[ $cleaned_up_image_src ]['image_width'] ) ) {
				$tag_processor->set_attribute( 'srcset', \Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url( $src, array( 'w' => $fixes[ $cleaned_up_image_src ]['image_width'] ) ) );
			}

			if ( isset( $fixes[ $cleaned_up_image_src ]['image_width'] ) ) {
				$tag_processor->set_attribute( 'sizes', sprintf( '(max-width: %1$dpx) 100vw, %1$dpx', $fixes[ $cleaned_up_image_src ]['image_width'] ) );
			}
		}

		return $tag_processor->get_updated_html();
	}

	public function setup() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_filter( 'the_content', array( $this, 'fix_content' ) );
		add_filter( 'wp_calculate_image_srcset', array( $this, 'fix_image' ), 10, 5 );
		add_filter( 'wp_calculate_image_sizes', array( $this, 'fix_sizes' ), 10, 5 );
	}

	public static function is_available() {
		return Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS );
	}

	public static function get_slug() {
		return 'image_size_analysis';
	}

	public function get_endpoints() {
		return array(
			new Image_Analysis_Start(),
			new Image_Analysis_Fix(),
		);
	}
}
