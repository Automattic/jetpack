<?php
/**
 * The Data class.
 * This class provides methods for data VideoPress access and manipulation.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;

/**
 * The Data class.
 */
class Data {
	/**
	 * Gets the product data
	 *
	 * @return array
	 */
	public static function get_videos() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		// @todo: build a proper query string for request.
		$endpoint = "/sites/{$blog_id}/media?per_page=6&mime_type=video/videopress";

		$args = array(
			'method' => 'GET',
		);

		$response = Client::wpcom_json_api_request_as_user( $endpoint, '2', $args, null, 'wp' );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			// @todo: error handling
			return array();
		}

		return json_decode( $response['body'], true );
	}

	/**
	 * Return the initial state of the VideoPress app,
	 * used to render initially the app in the frontend.
	 *
	 * @return array
	 */
	public static function get_initial_state() {

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
			self::get_videos()
		);

		return array(
			'videos' => array(
				'uploadedVideoCount'           => count( $videos ), // @todo: pick the total number properly
				'items'                        => $videos,
				'isFetching'                   => false,
				'isFetchingUploadedVideoCount' => false,
				'_meta'                        => array(
					'relyOnInitialState' => true,
				),
			),
		);
	}
}
