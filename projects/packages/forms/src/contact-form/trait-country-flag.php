<?php
/**
 * Country_Flag trait.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Trait for converting country codes to emoji flags.
 *
 * This trait provides a reusable method for converting two-letter ISO country codes
 * (e.g., 'US', 'GB', 'DE') into their corresponding emoji flag representations.
 */
trait Country_Flag {

	/**
	 * Convert a country code to an emoji flag.
	 *
	 * @param string $country_code The two-letter country code (e.g., 'US', 'GB', 'DE').
	 *
	 * @return string The emoji flag for the country code, or empty string if invalid.
	 */
	private static function country_code_to_emoji_flag( $country_code ) {
		if ( empty( $country_code ) || strlen( $country_code ) !== 2 ) {
			return '';
		}

		$country_code = strtoupper( $country_code );

		// Convert each letter to a regional indicator symbol.
		// Regional indicator symbols start at Unicode code point 127462 (🇦)
		// and correspond to A-Z (ASCII 65-90).
		$flag = '';
		for ( $i = 0; $i < 2; $i++ ) {
			$char = $country_code[ $i ];

			// Check if the character is a valid uppercase letter (A-Z).
			if ( ord( $char ) < 65 || ord( $char ) > 90 ) {
				return '';
			}

			$code_point = 127462 + ( ord( $char ) - 65 );

			// Convert code point to UTF-8 encoded character.
			$flag .= mb_chr( $code_point, 'UTF-8' );
		}

		return $flag;
	}
}
