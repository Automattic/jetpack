<?php
/*
Plugin Name: Jetpack Carousel
Plugin URL: http://wordpress.com/
Description: Transform your standard image galleries into an immersive full-screen experience.
Version: 0.1
Author: Automattic

Released under the GPL v.2 license.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

class Jetpack_Carousel {

	var $prebuilt_widths = array( 370, 700, 1000, 1200, 1400, 2000 );

	var $first_run = true;

	function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	function init() {
		if ( $this->maybe_disable_jp_carousel() )
			return;

		if ( ! is_admin() ) {
			// If on front-end, do the Carousel thang.
			$this->prebuilt_widths = apply_filters( 'jp_carousel_widths', $this->prebuilt_widths );
			add_filter( 'post_gallery', array( $this, 'enqueue_assets' ), 1000, 2 ); // load later than other callbacks hooked it
			add_filter( 'gallery_style', array( $this, 'add_data_to_container' ) );
			add_filter( 'wp_get_attachment_link', array( $this, 'add_data_to_images' ), 10, 2 );
		} else {
			// If in admin, register the ajax endpoints.
			add_action( 'wp_ajax_get_attachment_comments', array( $this, 'get_attachment_comments' ) );
			add_action( 'wp_ajax_nopriv_get_attachment_comments', array( $this, 'get_attachment_comments' ) );
		}
	}

	function maybe_disable_jp_carousel() {
		return apply_filters( 'jp_carousel_maybe_disable', false );
	}

	function asset_version( $version ) {
		return apply_filters( 'jp_carousel_asset_version', $version );
	}

	function enqueue_assets( $output ) {
		if ( ! empty( $output ) ) {
			// Bail because someone is overriding the [gallery] shortcode.
			remove_filter( 'gallery_style', array( $this, 'add_data_to_container' ) );
			remove_filter( 'wp_get_attachment_link', array( $this, 'add_data_to_images' ) );
			return $output;
		}

		do_action( 'jp_carousel_thumbnails_shown' );

		if ( $this->first_run ) {
			wp_enqueue_script( 'jetpack-carousel', plugins_url( 'jetpack-carousel.js', __FILE__ ), array( 'jquery' ), $this->asset_version( '20120517' ), true );

			// Note: using  home_url() instead of admin_url() for ajaxurl to be sure  to get same domain on wpcom when using mapped domains (also works on self-hosted)
			// Also: not hardcoding path since there is no guarantee site is running on site root in self-hosted context.
			$localize_strings = array(
				'widths'       => $this->prebuilt_widths,
				'is_logged_in' => is_user_logged_in(),
				'ajaxurl'      => home_url( '/wp-admin/admin-ajax.php', is_ssl() ? 'https' : 'http' ),
				'nonce'        => wp_create_nonce( 'carousel_nonce' ),
			);
			$localize_strings = apply_filters( 'jp_carousel_localize_strings', $localize_strings );
			wp_localize_script( 'jetpack-carousel', 'jetpackCarouselStrings', $localize_strings );
			wp_enqueue_style( 'jetpack-carousel', plugins_url( 'jetpack-carousel.css', __FILE__ ), array(), $this->asset_version( '20120517' ) );

			do_action( 'jp_carousel_enqueue_assets', $this->first_run, $localize_strings );

			$this->first_run = false;
		}

		return $output;
	}

	function add_data_to_images( $html, $attachment_id ) {
		if ( $this->first_run ) // not in a gallery
			return $html;

		$attachment_id = intval( $attachment_id );
		$meta          = wp_get_attachment_metadata( $attachment_id );
		$size          = isset( $meta['width'] ) ? "{$meta['width']},{$meta['height']}" : '';
		$img_meta      = esc_attr( json_encode( $meta['image_meta'] ) );

		$html = str_replace( '<img ', "<img data-attachment-id='$attachment_id' data-orig-size='$size' data-image-meta='$img_meta' ", $html );

		$html = apply_filters( 'jp_carousel_add_data_to_images', $html, $attachment_id );

		return $html;
	}

	function add_data_to_container( $html ) {
		global $current_blog, $post;

		if ( isset( $post ) ) {
			$blog_id = isset( $current_blog ) ? $current_blog->blog_id : 0;
			$extra_data = array( 'data-carousel-extra' => array( 'blog_id' => $blog_id, 'permalink' => get_permalink( $post->ID ) ) );

			$extra_data = apply_filters( 'jp_carousel_add_data_to_container', $extra_data );
			foreach ( (array) $extra_data as $data_key => $data_values ) {
				$html = str_replace( '<div ', '<div ' . esc_attr( $data_key ) . "='" . json_encode( $data_values ) . "' ", $html );
			}
		}

		return $html;
	}
	
	function get_attachment_comments() {
		header('Content-type: text/javascript');
		$attachment_id = ( isset( $_REQUEST['id'] ) ) ? (int) $_REQUEST['id'] : 0;
		$offset        = ( isset( $_REQUEST['offset'] ) ) ? (int) $_REQUEST['offset'] : 0;
		if ( ! $attachment_id ) {
			echo json_encode( 'Whoops, missing attachment ID.' );
			die();
		}
		if ( $offset < 1 )
			$offset = 0;
		$comments = get_comments( array(
			'status'  => 'approve',
			'number'  => 10,
			'post_id' => $attachment_id,
			'offset'  => $offset,
		) );
		$out      = array();
		// Can't just send the results, they contain the commenter's email address.
		foreach ( $comments as $comment ) {
			$author_markup   = '<a href="' . esc_url( $comment->comment_author_url ) . '">' . esc_html( $comment->comment_author ) . '</a>';
			$out[] = array(
				'id'              => $comment->comment_ID,
				'parent_id'       => $comment->comment_parent,
				'author_markup'   => $author_markup,
				'gravatar_markup' => get_avatar( $comment->comment_author_email, 64 ),
				'date_gmt'        => $comment->comment_date_gmt,
				'content'         => $comment->comment_content,
			);
		}
		die( json_encode( $out ) );
	}
}

new Jetpack_Carousel;
