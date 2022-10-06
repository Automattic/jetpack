<?php
/**
 * The Data class.
 * This class provides methods for data VideoPress access and manipulation.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

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
	 * @return array
	 */
	public static function get_video_data() {
		$video_data = array(
			'videos'     => array(),
			'total'      => 0,
			'totalPages' => 0,
			'query'      => array(
				'order'        => 'desc',
				'orderBy'      => 'date',
				'itemsPerPage' => 6,
				'page'         => 1,
				'type'         => 'video/videopress',
			),
		);

		$args = array(
			'order'     => $video_data['query']['order'],
			'orderby'   => $video_data['query']['orderBy'],
			'per_page'  => $video_data['query']['itemsPerPage'],
			'page'      => $video_data['query']['page'],
			'mime_type' => $video_data['query']['type'],
		);

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
	 * Gets the VideoPress used storage space in bytes
	 *
	 * @return int the used storage space
	 */
	public static function get_storage_used() {
		$site_data = Site::get_site_info();

		if ( isset( $site_data['options'] ) && isset( $site_data['options']['videopress_storage_used'] ) ) {
			return intval( round( $site_data['options']['videopress_storage_used'] * 1024 * 1024 ) );
		} else {
			return 0;
		}
	}

	/**
	 * Return the initial state of the VideoPress app,
	 * used to render initially the app in the frontend.
	 *
	 * @return array
	 */
	public static function get_initial_state() {

		$video_data = self::get_video_data();

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
				$poster        = $videopress_media_details['poster'];
				$upload_date   = $videopress_media_details['upload_date'];
				$duration      = $videopress_media_details['duration'];
				$is_private    = $videopress_media_details['is_private'];
				$file_url_base = $videopress_media_details['file_url_base'];
				$finished      = $videopress_media_details['finished'];
				$files         = $videopress_media_details['files'];

				if ( isset( $files['dvd']['original_img'] ) ) {
					$thumbnail = $file_url_base['https'] . $files['dvd']['original_img'];
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
					'thumnbail'      => $thumbnail,
					'finished'       => $finished,
				);
			},
			$video_data['videos']
		);

		return array(
			'videos' => array(
				'uploadedVideoCount'           => $video_data['total'],
				'items'                        => $videos,
				'isFetching'                   => false,
				'isFetchingUploadedVideoCount' => false,
				'storageUsed'                  => self::get_storage_used(),
				'pagination'                   => array(
					'totalPages' => $video_data['totalPages'],
					'total'      => $video_data['total'],
				),
				'query'                        => $video_data['query'],
				'_meta'                        => array(
					'relyOnInitialState' => true,
				),
			),
		);
	}
}
