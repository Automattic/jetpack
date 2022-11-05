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
			l( 'Error when fetching chapters for GUID ' . $video_guid );

			return array(
				'chapters' => array(),
				'error'    => true,
			);
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
		$chapters_response = self::fetch_chapters( $video_guid );
		if ( isset( $chapters_response['error'] ) && $chapters_response['error'] ) {
			return '';
		}
		$chapters = $chapters_response['chapters'];

		// @todo: figure out how to choose the language
		if ( ! $chapters || ! isset( $chapters['chapters']['en'] ) ) {
			return '';
		}

		$html = '<div class="video-chapters_list" data-guid="' . $video_guid . '"><ul>';
		foreach ( $chapters['chapters']['en'] as $chapter ) {
			$html .= sprintf(
				'<li><div class="video-chapters__item"><a class="video-chapters__text" href="#" data-time="%s">%s</a> %s</div></li>',
				esc_attr( $chapter['start'] ),
				esc_html( $chapter['description'] ),
				esc_html( self::format_time_from_ms( $chapter['start'] ) )
			);
		}
		$html .= '</ul></div>';

		return $html;
	}

	/**
	 * Convert time in milliseconds to mm:ss or hh:mm:ss format.
	 *
	 * @param int $timestamp Timestamp in milliseconds. Must be shorter than 24h.
	 *
	 * @return string Time in mm:ss or hh:mm:ss
	 */
	protected static function format_time_from_ms( $timestamp ) {
		$utc     = new \DateTimeZone( 'UTC' );
		$seconds = (int) floor( $timestamp / 1000 );
		$date    = \DateTime::createFromFormat( 'U', $seconds, $utc );

		return $date->format( $seconds > 3600 ? 'H:i:s' : 'i:s' );
	}
}
