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

		$html = '<div class="video-chapters_list" data-guid="' . $video_guid . '"><ul>';
		foreach ( $chapters['chapters']['en'] as $chapter ) {
			$html .= sprintf(
				'<li><div class="video-chapters__item"><a class="video-chapters__text" href="#" data-time="%s">%s</a> %s</div></li>',
				esc_attr( self::vtt_time_to_ms( $chapter['start'] ) ),
				esc_html( $chapter['description'] ),
				esc_html( self::vtt_time_to_mm_ss( $chapter['start'] ) )
			);
		}
		$html .= '</ul></div>';

		return $html;
	}

	/**
	 * Vtt time to milliseconds integer.
	 *
	 * @param string $vtt_time_format Timestamp in VTT format.
	 *
	 * @return int Number of milliseconds.
	 */
	protected static function vtt_time_to_ms( $vtt_time_format ) {
		$date_time_string = '1970-01-01 ' . $vtt_time_format;
		$date             = \DateTime::createFromFormat( 'Y-m-d H:i:s.u', $date_time_string );
		if ( ! $date ) {
			$date = \DateTime::createFromFormat( 'Y-m-d i:s.u', $date_time_string );
			if ( ! $date ) {
				return 0;
			}
		}

		$secs       = $date->getTimestamp();
		$millisecs  = $secs * 1000;
		$millisecs += $date->format( 'u' ) / 1000;

		return (int) $millisecs;
	}

	/**
	 * Convert vtt timestamp to mm:ss format.
	 *
	 * @param string $vtt_time_format Timestamp in VTT format.
	 *
	 * @return string Time in mm:ss
	 */
	protected static function vtt_time_to_mm_ss( $vtt_time_format ) {
		$date_time_string = '1970-01-01 ' . $vtt_time_format;
		$date             = \DateTime::createFromFormat( 'Y-m-d H:i:s.u', $date_time_string );
		if ( ! $date ) {
			$date = \DateTime::createFromFormat( 'Y-m-d i:s.u', $date_time_string );
			if ( ! $date ) {
				return '00:00';
			}
		}

		// @todo add hours if longer than one hour
		return $date->format( 'i:s' );
	}
}
