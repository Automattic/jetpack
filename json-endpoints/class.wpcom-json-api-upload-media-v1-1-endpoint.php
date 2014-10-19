<?php
class WPCOM_JSON_API_Upload_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Matt & Mike J requested that we allow video uploads from the API for mobile apps, even without the VideoPress upgrade..
	 * https://videop2.wordpress.com/2014/08/21/videopress-iteration/#comment-3377
	 */
	function allow_video_uploads( $mimes ) {
		// if we are on Jetpack, bail - Videos are already allowed
		if ( !defined( 'IS_WPCOM' ) || !IS_WPCOM ) {
			return $mimes;
		}

		// extra check that this filter is only ever applied during REST API requests
		if ( ! defined( 'REST_API_REQUEST' ) || ! REST_API_REQUEST ) {
			return $mimes;
		}

		// bail early if they already have the upgrade..
		if ( get_option( 'video_upgrade' ) == '1' ) {
			return $mimes;
		}

		// lets whitelist to only specific clients right now
		$clients_allowed_video_uploads = array();
		$clients_allowed_video_uploads = apply_filters( 'rest_api_clients_allowed_video_uploads', $clients_allowed_video_uploads );
		if ( !in_array( $this->api->token_details['client_id'], $clients_allowed_video_uploads ) ) {
			return $mimes;
		}

		$mime_list = wp_get_mime_types();

		$site_exts = explode( ' ', get_site_option( 'upload_filetypes' ) );
		$video_exts = explode( ' ', get_site_option( 'video_upload_filetypes', false, false ) );
		$video_exts = apply_filters( 'video_upload_filetypes', $video_exts );
		$video_mimes = array();

		if ( !empty( $video_exts ) ) {
			foreach ( $video_exts as $ext ) {
				foreach ( $mime_list as $ext_pattern => $mime ) {
					if ( $ext != '' && strpos( $ext_pattern, $ext ) !== false )
						$video_mimes[$ext_pattern] = $mime;
				}
			}

			$mimes = array_merge( $mimes, $video_mimes );
		}

		return $mimes;
	}

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
		}

		add_filter( 'upload_mimes', array( $this, 'allow_video_uploads' ) );

		$input = $this->input( true );

		$has_media      = isset( $input['media'] ) && $input['media'] ? count( $input['media'] ) : false;
		$has_media_urls = isset( $input['media_urls'] ) && $input['media_urls'] ? count( $input['media_urls'] ) : false;

		$media_ids = $files = $errors = array();

		if ( $has_media ) {
			$this->api->trap_wp_die( 'upload_error' );
			foreach ( $input['media'] as $index => $media_item ) {
				$_FILES['.api.media.item.'] = $media_item;
				// check for WP_Error if we ever actually need $media_id
				$media_id = media_handle_upload( '.api.media.item.', 0 );
				if ( is_wp_error( $media_id ) ) {
					$errors[ $index ]['file']   = $media_item['name'];
					$errors[ $index ]['error']   = $media_id->get_error_code();
					$errors[ $index ]['message'] = $media_id->get_error_message();
				} else {
					$media_ids[ $index ] = $media_id;
				}
				$files[] = $media_item;
			}
			$this->api->trap_wp_die( null );

			unset( $_FILES['.api.media.item.'] );
		}

		if ( $has_media_urls ) {
			foreach ( $input['media_urls'] as $index => $url ) {
				$id = $this->handle_media_sideload( $url );
				if ( is_wp_error( $media_id ) ) {
					$errors[ $index ] = array(
						'file'    => $url,
						'error'   => $media_id->get_error_code(),
						'message' => $media_id->get_error_message(),
					);
				} else {
					if ( ! empty( $id ) )
						$media_ids[ $index ] = $id;
				}
			}
		}

		// do we have info about these files? lets update that too
		$has_attrs  = isset( $input['attrs'] ) && $input['attrs'] ? count( $input['attrs'] ) : false;
		if ( $has_attrs ) {
			foreach ( $input['attrs'] as $key => $attrs ) {
				$media_id = $media_ids[$key];
				$insert = array();

				if ( ! empty( $attrs['title'] ) ) {
					$insert['post_title'] = $attrs['title'];
				}

				if ( ! empty( $attrs['caption'] ) )
					$insert['post_excerpt'] = $attrs['caption'];

				if ( ! empty( $attrs['description'] ) )
					$insert['post_content'] = $attrs['description'];

				if ( ! empty( $attrs['description'] ) )
					$insert['post_parent'] = $attrs['post_ID'];

				$insert['ID'] = $media_id;
				wp_update_post( (object) $insert );
			}
		}

		$results = array();
		if ( count( $media_ids ) <= 0 ) {
			$this->api->output_early( 400, array( 'errors' => $errors ) );
		} else {
			foreach ( $media_ids as $media_id ) {
				$result = $this->get_media_item_v1_1( $media_id );
				if ( is_wp_error( $result ) ) {
					$errors[] =  array( 'file' => $meida_id, 'error' => $result->get_error_code(), 'message' =>  $media_id->get_error_message() );
				} else {
					$results[] = $result;
				}
			}
			if ( count( $errors ) > 0 ) {
				return array( 'media' => $results, 'errors' => $errors );
			} else {
				return array( 'media' => $results );
			}
		}

	}
}
