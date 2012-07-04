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
			add_action( 'wp_ajax_post_attachment_comment', array( $this, 'post_attachment_comment' ) );
			add_action( 'wp_ajax_nopriv_post_attachment_comment', array( $this, 'post_attachment_comment' ) );
			// Also register the Carousel-related related settings
			add_action( 'admin_init', array( $this, 'register_settings' ), 5 );
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
			if ( ! has_action( 'wp_enqueue_scripts', 'register_spin_scripts' ) ) {
				wp_enqueue_script( 'spin', plugins_url( 'spin.js', __FILE__ ), false, '1.2.4' );
				wp_enqueue_script( 'jquery.spin', plugins_url( 'jquery.spin.js', __FILE__ ) , array( 'jquery', 'spin' ) );
			}

			wp_enqueue_script( 'jetpack-carousel', plugins_url( 'jetpack-carousel.js', __FILE__ ), array( 'jquery' ), $this->asset_version( '20120629' ), true );

			// Note: using  home_url() instead of admin_url() for ajaxurl to be sure  to get same domain on wpcom when using mapped domains (also works on self-hosted)
			// Also: not hardcoding path since there is no guarantee site is running on site root in self-hosted context.
			$is_logged_in = is_user_logged_in();
			$current_user = wp_get_current_user();
			$localize_strings = array(
				'widths'               => $this->prebuilt_widths,
				'is_logged_in'         => $is_logged_in,
				'ajaxurl'              => home_url( '/wp-admin/admin-ajax.php', is_ssl() ? 'https' : 'http' ),
				'nonce'                => wp_create_nonce( 'carousel_nonce' ),
				'display_exif'         => $this->test_1or0_option( get_option( 'carousel_display_exif' ), true ),
				'display_geo'          => $this->test_1or0_option( get_option( 'carousel_display_geo' ), true ),
				'post_comment'         => __('Post Comment'),
				'loading_comments'     => __('Loading Comments...'),
				'download_original'    => __('View full size <span class="photo-size">{0}<span class="photo-size-times">&times;</span>{1}</span>'),
				'no_comment_text'      => __('Please be sure to submit some text with your comment.'),
				'no_comment_email'     => __('Please provide an email address to comment.'),
				'no_comment_author'    => __('Please provide your name to comment.'),
				'comment_post_error'   => __('Sorry, but there was an error posting your comment. Please try again later.'),
				'comment_approved'     => __( 'Your comment was approved.' ),
				'comment_unapproved'   => __( 'Your comment is in moderation.' ),
				'camera'               => __('Camera'),
				'aperture'             => __('Aperture'),
				'shutter_speed'        => __('Shutter Speed'),
				'focal_length'         => __('Focal Length'),
			);

			if ( ! isset( $localize_strings['jetpack_comments_iframe_src'] ) || empty( $localize_strings['jetpack_comments_iframe_src'] ) ) {
				// We're not using Jetpack comments after all, so fallback to standard local comments.

				if ( $is_logged_in ) {
					$localize_strings['local_comments_commenting_as'] = '<p id="jp-carousel-commenting-as">' . sprintf( __( 'Commenting as %s' ), $current_user->data->display_name ) . '</p>';
				} else {
					$localize_strings['local_comments_commenting_as'] = ''
						. '<fieldset><label for="email">' . __( 'Email (Required)' ) . '</label> '
						. '<input type="text" name="email" class="jp-carousel-comment-form-field jp-carousel-comment-form-text-field" id="jp-carousel-comment-form-email-field" /></fieldset>'
						. '<fieldset><label for="author">' . __( 'Name (Required)' ) . '</label> '
						. '<input type="text" name="author" class="jp-carousel-comment-form-field jp-carousel-comment-form-text-field" id="jp-carousel-comment-form-author-field" /></fieldset>'
						. '<fieldset><label for="url">' . __( 'Website' ) . '</label> '
						. '<input type="text" name="url" class="jp-carousel-comment-form-field jp-carousel-comment-form-text-field" id="jp-carousel-comment-form-url-field" /></fieldset>';
				}
			}

			$localize_strings = apply_filters( 'jp_carousel_localize_strings', $localize_strings );
			wp_localize_script( 'jetpack-carousel', 'jetpackCarouselStrings', $localize_strings );
			wp_enqueue_style( 'jetpack-carousel', plugins_url( 'jetpack-carousel.css', __FILE__ ), array(), $this->asset_version( '20120629' ) );

			do_action( 'jp_carousel_enqueue_assets', $this->first_run, $localize_strings );

			$this->first_run = false;
		}

		return $output;
	}

	function add_data_to_images( $html, $attachment_id ) {
		if ( $this->first_run ) // not in a gallery
			return $html;

		$attachment_id   = intval( $attachment_id );
		$orig_file       = wp_get_attachment_url( $attachment_id );
		$meta            = wp_get_attachment_metadata( $attachment_id );
		$size            = isset( $meta['width'] ) ? intval( $meta['width'] ) . ',' . intval( $meta['height'] ) : '';
		$img_meta        = $meta['image_meta'];
		$comments_opened = intval( comments_open( $attachment_id ) );

		$medium_img_info = wp_get_attachment_image_src( $attachment_id, 'medium' );
		$medium_size     = isset( $medium_img_info[1] ) ? intval( $medium_img_info['1'] ) . ',' . intval( $medium_img_info[2] ) : '';

		$large_img_info = wp_get_attachment_image_src( $attachment_id, 'large' );
		$large_size     = isset( $large_img_info[1] ) ? intval( $large_img_info['1'] ) . ',' . intval( $large_img_info[2] ) : '';

		$attachment      = get_post( $attachment_id );
		$attachment_desc = wpautop( $attachment->post_content );

		// Not yet providing geo-data, need to "fuzzify" for privacy
		if ( ! empty( $img_meta ) ) {
			foreach ( $img_meta as $k => $v ) {
				if ( 'latitude' == $k || 'longitude' == $k )
					unset( $img_meta[$k] );
			}
		}

		$img_meta = json_encode( $img_meta );

		$html = str_replace(
			'<img ',
			sprintf(
				'<img data-attachment-id="%1$d" data-orig-file="%2$s" data-orig-size="%3$s" data-comments-opened="%4$s" data-image-meta="%5$s" data-image-description="%6$s" data-medium-size="%7$s" data-large-size="%8$s"',
				$attachment_id,
				esc_attr( $orig_file ),
				$size,
				$comments_opened,
				esc_attr( $img_meta ),
				esc_attr( $attachment_desc ),
				$medium_size,
				$large_size
			),
			$html
		);

		$html = apply_filters( 'jp_carousel_add_data_to_images', $html, $attachment_id );

		return $html;
	}

	function add_data_to_container( $html ) {
		global $post;

		if ( isset( $post ) ) {
			$blog_id = (int) get_current_blog_id();
			$extra_data = array( 'data-carousel-extra' => array( 'blog_id' => $blog_id, 'permalink' => get_permalink( $post->ID ) ) );

			$extra_data = apply_filters( 'jp_carousel_add_data_to_container', $extra_data );
			foreach ( (array) $extra_data as $data_key => $data_values ) {
				$html = str_replace( '<div ', '<div ' . esc_attr( $data_key ) . "='" . json_encode( $data_values ) . "' ", $html );
			}
		}

		return $html;
	}
	
	function get_attachment_comments() {
		if ( ! headers_sent() )
			header('Content-type: text/javascript');
		
		$attachment_id = ( isset( $_REQUEST['id'] ) ) ? (int) $_REQUEST['id'] : 0;
		$offset        = ( isset( $_REQUEST['offset'] ) ) ? (int) $_REQUEST['offset'] : 0;
		
		if ( ! $attachment_id ) {
			echo json_encode( __( 'Missing attachment ID.' ) );
			die();
		}
		
		if ( $offset < 1 )
			$offset = 0;
		
		$comments = get_comments( array(
			'status'  => 'approve',
			'order'   => ( 'asc' == get_option('comment_order') ) ? 'ASC' : 'DESC',
			'number'  => 10,
			'offset'  => $offset,
			'post_id' => $attachment_id,
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
				'content'         => wpautop($comment->comment_content),
			);
		}
		
		die( json_encode( $out ) );
	}

	function post_attachment_comment() {
		if ( ! headers_sent() )
			header('Content-type: text/javascript');
		
		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce($_POST['nonce'], 'carousel_nonce') )
			die( json_encode( array( 'error' => __( 'Nonce verification failed.' ) ) ) );
		
		$_blog_id = (int) $_POST['blog_id'];
		$_post_id = (int) $_POST['id'];
		$comment = $_POST['comment'];
		
		if ( empty( $_blog_id ) )
			die( json_encode( array( 'error' => __( 'Missing target blog ID.' ) ) ) );
		
		if ( empty( $_post_id ) )
			die( json_encode( array( 'error' => __( 'Missing target post ID.' ) ) ) );
		
		if ( empty( $comment ) )
			die( json_encode( array( 'error' => __( 'No comment text was submitted.' ) ) ) );

		// Used in context like NewDash
		$switched = false;
		if ( $_blog_id != get_current_blog_id() ) {
			switch_to_blog( $_blog_id );
			$switched = true;
		}

		if ( ! comments_open( $_post_id ) )
			die( json_encode( array( 'error' => __( 'Comments on this post are closed.' ) ) ) );
		
		if ( is_user_logged_in() ) {
			$user         = wp_get_current_user();
			$user_id      = $user->ID;
			$display_name = $user->display_name;
			$email        = $user->user_email;
			$url          = $user->user_url;

			if ( empty( $user_id ) )
				die( json_encode( array( 'error' => __( 'Sorry, but we could not authenticate your request.' ) ) ) );
		} else {
			$user_id      = 0;
			$display_name = $_POST['author'];
			$email        = $_POST['email'];
			$url          = $_POST['url'];

			if ( empty( $display_name ) )
				die( json_encode( array( 'error' => __( 'Please provide your name.' ) ) ) );

			if ( empty( $email ) )
				die( json_encode( array( 'error' => __( 'Please provide an email address.' ) ) ) );

			if ( ! is_email( $email ) )
				die( json_encode( array( 'error' => __( 'Please provide a valid email address.' ) ) ) );
		}

		$comment_data =  array(
			'comment_content' => $comment,
			'comment_post_ID' => $_post_id,
			'comment_author' => $display_name,
			'comment_author_email' => $email,
			'comment_author_url' => $url,
			'comment_approved' => 0,
		);

		if ( ! empty( $user_id ) )
			$comment_data['user_id'] = $user_id;

		// Note: wp_new_comment() sanitizes and validates the values (too).
		$comment_id = wp_new_comment( $comment_data );
		bump_stats_extras( 'carousel', 'comment_submit' );
		$comment_status = wp_get_comment_status( $comment_id );

		if ( true == $switched )
			restore_current_blog();

		die( json_encode( array( 'comment_id' => $comment_id, 'comment_status' => $comment_status ) ) );
	}
	
	function register_settings() {
		add_settings_section('carousel_section', __('Image Galleries'), array( $this, 'carousel_section_callback' ), 'media');
		
		add_settings_field('carousel_display_exif', __('Metadata'), array( $this, 'carousel_display_exif_callback' ), 'media', 'carousel_section' );
		register_setting( 'media', 'carousel_display_exif', array( $this, 'carousel_display_exif_sanitize' ) );

		// No geo setting yet, need to "fuzzify" data first, for privacy
		// add_settings_field('carousel_display_geo', __('Geolocation'), array( $this, 'carousel_display_geo_callback' ), 'media', 'carousel_section' );
		// register_setting( 'media', 'carousel_display_geo', array( $this, 'carousel_display_geo_sanitize' ) );
	}

	// Fulfill the settings section callback requirement by returning nothing
	function carousel_section_callback() {
		return;
	}

	function test_1or0_option( $value, $default_to_1 = true ) {
		if ( true == $default_to_1 ) {
			// Binary false (===) of $value means it has not yet been set, in which case we do want to default sites to 1
			if ( false === $value )
				$value = 1;
		}
		return ( 1 == $value ) ? 1 : 0;
	}
	
	function sanitize_1or0_option( $value ) {
		return ( 1 == $value ) ? 1 : 0;
	}

	function settings_checkbox($name, $label_text, $extra_text = '', $default_to_checked = true) {
		$option = $this->test_1or0_option( get_option( $name ), $default_to_checked );
		echo '<fieldset>';
		echo '<input type="checkbox" name="'.esc_attr($name).'" id="'.esc_attr($name).'" value="1" ';
		echo checked( '1', $option );
		echo '/> <label for="'.esc_attr($name).'">'.$label_text.'</label>';
		if ( ! empty( $extra_text ) )
			echo '<p class="description">'.$extra_text.'</p>';
		echo '</fieldset>';
	}

	function carousel_display_exif_callback() {
		$this->settings_checkbox( 'carousel_display_exif', __( 'Show photo metadata in carousel, when available.' ) );
	}

	function carousel_display_exif_sanitize( $value ) {
		return $this->sanitize_1or0_option( $value );
	}

	function carousel_display_geo_callback() {
		$this->settings_checkbox( 'carousel_display_geo', __( 'Show map of photo location in carousel, when available.' ) );
	}

	function carousel_display_geo_sanitize( $value ) {
		return $this->sanitize_1or0_option( $value );
	} 
}

new Jetpack_Carousel;
