<?php
/**
 * WordAds Formats Class file.
 *
 * This file contains the definition of the WordAds_Formats class, which handles
 * determining the appropriate WordAds format slug based on ad slot dimensions.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WordAds_Formats
 *
 * Set of WordAds methods working with formats and Ad dimensions.
 */
class WordAds_Formats {
	/**
	 * Determine the WordAds format based on the ad dimensions.
	 *
	 * @param int $width  The width of the ad slot.
	 * @param int $height The height of the ad slot.
	 *
	 * @return string WordAds Format enum.
	 */
	public static function get_format_slug( int $width, int $height ): string {
		if ( $width === 300 && $height === 250 ) {
			return 'gutenberg_rectangle';
		}

		if ( $width === 728 && $height === 90 ) {
			return 'gutenberg_leaderboard';
		}

		if ( $width === 320 && $height === 50 ) {
			return 'gutenberg_mobile_leaderboard';
		}

		if ( $width === 160 && $height === 600 ) {
			return 'gutenberg_skyscraper';
		}

		return '';
	}
}
