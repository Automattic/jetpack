<?php
/**
 * The Data class.
 * This class provides methods for data VideoPress access and manipulation.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WP_REST_Request;
/**
 * The Data class.
 */
class Data {

	/**
	 * Gets the Jetpack blog ID
	 *
	 * @return int The blog ID
	 */
	public static function get_blog_id() {
		return VideoPressToken::blog_id();
	}

	/**
	 * Gets the video data
	 *
	 * @param boolean $is_videopress - True when getting VideoPress data.
	 * @return array
	 */
	public static function get_video_data( $is_videopress = true ) {
		$video_data = array(
			'videos'     => array(),
			'total'      => 0,
			'totalPages' => 0,
			'query'      => array(
				'order'        => 'desc',
				'orderBy'      => 'date',
				'itemsPerPage' => 6,
				'page'         => 1,
			),
		);

		$args = array(
			'order'      => $video_data['query']['order'],
			'orderby'    => $video_data['query']['orderBy'],
			'per_page'   => $video_data['query']['itemsPerPage'],
			'page'       => $video_data['query']['page'],
			'media_type' => 'video',
		);

		if ( $is_videopress ) {
			$args['mime_type'] = 'video/videopress';
		} else {
			$args['no_videopress'] = true;
		}

		// Do an internal request for the media list
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_query_params( $args );
		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			// @todo: error handling
			return $video_data;
		}

		// load the real values
		$video_data['videos'] = $response->get_data();
		$headers              = $response->get_headers();

		if ( isset( $headers['X-WP-Total'] ) ) {
			$video_data['total'] = $headers['X-WP-Total'];
		}

		if ( isset( $headers['X-WP-TotalPages'] ) ) {
			$video_data['totalPages'] = $headers['X-WP-TotalPages'];
		}

		return $video_data;
	}

	/**
	 * Gets the user data
	 *
	 * @return array
	 */
	public static function get_user_data() {
		$user_data = array(
			'items'      => array(),
			'pagination' => array(
				'total'      => 0,
				'totalPages' => 1,
			),
			'query'      => array(
				'order'   => 'asc',
				'orderBy' => 'name',
			),
			'_meta'      => array(
				'relyOnInitialState' => true,
			),
		);

		$args = array(
			'order'   => $user_data['query']['order'],
			'orderby' => $user_data['query']['orderBy'],
		);

		// Do an internal request for the user list
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_query_params( $args );
		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			// @todo: error handling
			return $user_data;
		}

		// load the real values
		$user_data['items'] = $response->get_data();
		$headers            = $response->get_headers();

		if ( isset( $headers['X-WP-Total'] ) ) {
			$user_data['pagination']['total'] = $headers['X-WP-Total'];
		}

		if ( isset( $headers['X-WP-TotalPages'] ) ) {
			$user_data['pagination']['totalPages'] = $headers['X-WP-TotalPages'];
		}

		return $user_data;
	}

	/**
	 * Gets the VideoPress used storage space in bytes
	 *
	 * @return int the used storage space
	 */
	public static function get_storage_used() {
		$site_data = Site::get_site_info();
		if ( is_wp_error( $site_data ) ) {
			return 0;
		}

		if ( isset( $site_data['options'] ) && isset( $site_data['options']['videopress_storage_used'] ) ) {
			return intval( round( $site_data['options']['videopress_storage_used'] * 1024 * 1024 ) );
		} else {
			return 0;
		}
	}

	/**
	 * Return all the initial state that depends on a valid site connection
	 *
	 * @return array
	 */
	public static function get_connected_initial_state() {
		return array(
			'videos' => array(
				'storageUsed' => self::get_storage_used(),
			),
		);
	}

	/**
	 * Checks if the site has as connected owner
	 */
	public static function has_connected_owner() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}

		if ( ( new Connection_Manager() )->has_connected_owner() ) {
			return true;
		}

		return false;
	}

	/**
	 * Return the initial state of the VideoPress app,
	 * used to render initially the app in the frontend.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$videopress_data   = self::get_video_data();
		$local_videos_data = self::get_video_data( false );

		// Tweak local videos data.
		$local_videos = array_map(
			function ( $video ) {
				$id                 = $video['id'];
				$media_details      = $video['media_details'];
				$jetpack_videopress = $video['jetpack_videopress'];

				// Check if video is already uploaded to VideoPress.
				$uploader                  = new Uploader( $id );
				$is_uploaded_to_videopress = $uploader->is_uploaded();

				$upload_date = $video['date'];
				$url         = $video['source_url'];

				$title       = $jetpack_videopress['title'];
				$description = $jetpack_videopress['description'];
				$caption     = $jetpack_videopress['caption'];

				$width    = $media_details['width'];
				$height   = $media_details['height'];
				$duration = $media_details['length'];

				return array(
					'id'                     => $id,
					'title'                  => $title,
					'description'            => $description,
					'caption'                => $caption,
					'width'                  => $width,
					'height'                 => $height,
					'url'                    => $url,
					'uploadDate'             => $upload_date,
					'duration'               => $duration,
					'isUploadedToVideoPress' => $is_uploaded_to_videopress,
				);
			},
			$local_videos_data['videos']
		);

		// Tweak VideoPress videos data.
		$videos = array_map(
			function ( $video ) {
				$id                 = $video['id'];
				$guid               = $video['jetpack_videopress_guid'];
				$media_details      = $video['media_details'];
				$jetpack_videopress = $video['jetpack_videopress'];

				$videopress_media_details = $media_details['videopress'];
				$width                    = $media_details['width'];
				$height                   = $media_details['height'];

				$title           = $jetpack_videopress['title'];
				$description     = $jetpack_videopress['description'];
				$caption         = $jetpack_videopress['caption'];
				$rating          = $jetpack_videopress['rating'];
				$allow_download  = $jetpack_videopress['allow_download'];
				$privacy_setting = $jetpack_videopress['privacy_setting'];

				$original      = $videopress_media_details['original'];
				$poster        = $privacy_setting !== 1 ? $videopress_media_details['poster'] : null;
				$upload_date   = $videopress_media_details['upload_date'];
				$duration      = $videopress_media_details['duration'];
				$is_private    = $videopress_media_details['is_private'];
				$file_url_base = $videopress_media_details['file_url_base'];
				$finished      = $videopress_media_details['finished'];
				$files         = $videopress_media_details['files'];

				if ( isset( $files['dvd']['original_img'] ) && $privacy_setting !== 1 ) {
					$thumbnail = $file_url_base['https'] . $files['dvd']['original_img'];
				} else {
					$thumbnail = null;
				}

				return array(
					'id'             => $id,
					'guid'           => $guid,
					'title'          => $title,
					'description'    => $description,
					'caption'        => $caption,
					'url'            => $original,
					'uploadDate'     => $upload_date,
					'duration'       => $duration,
					'isPrivate'      => $is_private,
					'posterImage'    => $poster,
					'allowDownload'  => $allow_download,
					'rating'         => $rating,
					'privacySetting' => $privacy_setting,
					'poster'         => array(
						'src'    => $poster,
						'width'  => $width,
						'height' => $height,
					),
					'thumbnail'      => $thumbnail,
					'finished'       => $finished,
				);
			},
			$videopress_data['videos']
		);

		$initial_state = array(
			'users'       => self::get_user_data(),
			'videos'      => array(
				'uploadedVideoCount'           => $videopress_data['total'],
				'items'                        => $videos,
				'isFetching'                   => false,
				'isFetchingUploadedVideoCount' => false,
				'pagination'                   => array(
					'totalPages' => $videopress_data['totalPages'],
					'total'      => $videopress_data['total'],
				),
				'query'                        => $videopress_data['query'],
				'_meta'                        => array(
					'relyOnInitialState' => true,
				),
			),

			'localVideos' => array(
				'uploadedVideoCount'           => $local_videos_data['total'],
				'items'                        => $local_videos,
				'isFetching'                   => false,
				'isFetchingUploadedVideoCount' => false,
				'pagination'                   => array(
					'totalPages' => $local_videos_data['totalPages'],
					'total'      => $local_videos_data['total'],
				),
				'query'                        => $local_videos_data['query'],
				'_meta'                        => array(
					'relyOnInitialState' => true,
				),
			),
		);

		if ( self::has_connected_owner() ) {
			return array_merge_recursive( $initial_state, self::get_connected_initial_state() );
		}

		return $initial_state;
	}
}
