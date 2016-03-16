<?php


/**
 * Base class for the Site Abstraction Layer (SAL)
 **/
abstract class SAL_Site {
	public $blog_id;

	public function __construct( $blog_id ) {
		$this->blog_id = $blog_id;
	}

	abstract public function has_videopress();

	abstract public function upgraded_filetypes_enabled();

	abstract public function is_mapped_domain();

	abstract public function is_redirect();

	abstract public function featured_images_enabled();

	abstract public function has_wordads();

	abstract public function get_frame_nonce();

	abstract public function allowed_file_types();

	abstract public function get_post_formats();

	abstract public function is_private();

	abstract public function is_following();

	abstract public function get_subscribers_count();

	abstract public function get_locale();

	abstract public function is_jetpack();

	abstract public function get_jetpack_modules();

	abstract public function is_vip();

	abstract public function is_multisite();

	abstract public function is_single_user_site();

	abstract public function get_plan();

	abstract public function get_ak_vp_bundle_enabled();

	abstract public function before_render();

	abstract public function after_render( &$response );

	abstract public function after_render_options( &$options );

	function user_can_manage() {
		current_user_can( 'manage_options' ); // remove this attribute in favor of 'capabilities'
	}

	function get_registered_date() {
		if ( function_exists( 'get_blog_details' ) ) {
			$blog_details = get_blog_details();
			if ( ! empty( $blog_details->registered ) ) {
				return $this->format_date( $blog_details->registered );
			}
		}

		return '0000-00-00T00:00:00+00:00';
	}

	function get_capabilities() {
		return array(
			'edit_pages'          => current_user_can( 'edit_pages' ),
			'edit_posts'          => current_user_can( 'edit_posts' ),
			'edit_others_posts'   => current_user_can( 'edit_others_posts' ),
			'edit_others_pages'   => current_user_can( 'edit_others_pages' ),
			'delete_posts'        => current_user_can( 'delete_posts' ),
			'delete_others_posts' => current_user_can( 'delete_others_posts' ),
			'edit_theme_options'  => current_user_can( 'edit_theme_options' ),
			'edit_users'          => current_user_can( 'edit_users' ),
			'list_users'          => current_user_can( 'list_users' ),
			'manage_categories'   => current_user_can( 'manage_categories' ),
			'manage_options'      => current_user_can( 'manage_options' ),
			'promote_users'       => current_user_can( 'promote_users' ),
			'publish_posts'       => current_user_can( 'publish_posts' ),
			'upload_files'        => current_user_can( 'upload_files' ),
			'view_stats'          => stats_is_blog_user( $this->blog_id )
		);
	}

	function is_visible() {
		if ( is_user_logged_in() ) {
			$current_user = wp_get_current_user();
			$visible      = (array) get_user_meta( $current_user->ID, 'blog_visibility', true );

			$is_visible = true;
			if ( isset( $visible[ $this->blog_id ] ) ) {
				$is_visible = (bool) $visible[ $this->blog_id ];
			}

			// null and true are visible
			return $is_visible;
		}

		return null;
	}

	function get_logo() {

		// Set an empty response array.
		$logo_setting = array(
			'id'    => (int) 0,
			'sizes' => array(),
			'url'   => '',
		);

		// Get current site logo values.
		$logo = get_option( 'site_logo' );

		// Update the response array if there's a site logo currenty active.
		if ( $logo && 0 != $logo['id'] ) {
			$logo_setting['id']  = $logo['id'];
			$logo_setting['url'] = $logo['url'];

			foreach ( $logo['sizes'] as $size => $properties ) {
				$logo_setting['sizes'][ $size ] = $properties;
			}
		}

		return $logo_setting;
	}

	/**
	 * Returns ISO 8601 formatted datetime: 2011-12-08T01:15:36-08:00
	 *
	 * @param $date_gmt (string) GMT datetime string.
	 * @param $date (string) Optional.  Used to calculate the offset from GMT.
	 *
	 * @return string
	 */
	function format_date( $date_gmt, $date = null ) {
		$timestamp_gmt = strtotime( "$date_gmt+0000" );

		if ( null === $date ) {
			$timestamp = $timestamp_gmt;
			$hours     = $minutes = $west = 0;
		} else {
			$date_time = date_create( "$date+0000" );
			if ( $date_time ) {
				$timestamp = date_format( $date_time, 'U' );
			} else {
				$timestamp = 0;
			}

			// "0000-00-00 00:00:00" == -62169984000
			if ( - 62169984000 == $timestamp_gmt ) {
				// WordPress sets post_date=now, post_date_gmt="0000-00-00 00:00:00" for all drafts
				// WordPress sets post_modified=now, post_modified_gmt="0000-00-00 00:00:00" for new drafts

				// Try to guess the correct offset from the blog's options.
				$timezone_string = get_option( 'timezone_string' );

				if ( $timezone_string && $date_time ) {
					$timezone = timezone_open( $timezone_string );
					if ( $timezone ) {
						$offset = $timezone->getOffset( $date_time );
					}
				} else {
					$offset = 3600 * get_option( 'gmt_offset' );
				}
			} else {
				$offset = $timestamp - $timestamp_gmt;
			}

			$west   = $offset < 0;
			$offset = abs( $offset );
			$hours  = (int) floor( $offset / 3600 );
			$offset -= $hours * 3600;
			$minutes = (int) floor( $offset / 60 );
		}

		return (string) gmdate( 'Y-m-d\\TH:i:s', $timestamp ) . sprintf( '%s%02d:%02d', $west ? '-' : '+', $hours, $minutes );
	}
}
