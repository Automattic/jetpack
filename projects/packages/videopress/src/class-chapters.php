<?php
/**
 * This file provides the Chapters class.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;

/**
 * The Chapters class.
 * This class provides methods for fetching and rendering chapters.
 */
class Chapters {
	/**
	 * Fetch chapters for a given video, based on the uploaded VTT file.
	 *
	 * @param string $video_guid GUID of the video.
	 *
	 * @return array
	 */
	public static function fetch_chapters( $video_guid ) {
		$result = Client::wpcom_json_api_request_as_blog(
			'/videos/' . $video_guid . '/chapters',
			'1.1',
			array()
		);

		if ( is_wp_error( $result ) || 200 !== wp_remote_retrieve_response_code( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not fetch VideoPress chapters. Please try again later.', 'jetpack-videopress-pkg' ) ) );

			return array();
		}

		return json_decode( wp_remote_retrieve_body( $result ), true );
	}

	/**
	 * Return HTML markup for video chapters.
	 *
	 * @param string $video_guid GUID of the video.
	 *
	 * @return string HTML markup
	 */
	public static function render_chapters( $video_guid ) {
		error_log( '$video_guid: ' . print_r( $video_guid, true ) );

		$chapters = self::fetch_chapters( $video_guid );
		// @todo: figure out how to choose the language
		if ( ! $chapters || ! isset( $chapters['chapters']['en'] ) ) {
			return '';
		}

		$html = '<div class="video-chapters_list" data-guid="' . $video_guid .'"><ul>';
		foreach ( $chapters['chapters']['en'] as $chapter ) {
			$html .= sprintf(
				'<li><div class="video-chapters__item"><a class="video-chapters__text" href="#">%s</a> %s</div></li>',
				esc_html( $chapter['description'] ),
				esc_html( $chapter['start'] )
			);
		}
		$html .= '</ul></div>';

		return $html;
	}
}
