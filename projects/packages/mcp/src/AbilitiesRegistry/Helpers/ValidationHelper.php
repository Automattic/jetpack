<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Helpers;

use WP_Error;

/**
 * Helper class for input validation
 */
class ValidationHelper {

	/**
	 * Validate an action parameter against allowed actions
	 *
	 * @param string $action          The action to validate.
	 * @param array  $allowed_actions Array of allowed actions.
	 * @return string|WP_Error The validated action or error.
	 */
	public static function validate_action( string $action, array $allowed_actions ) {
		if ( empty( $action ) ) {
			return new WP_Error( 'missing_action', 'Action parameter is required' );
		}

		if ( ! in_array( $action, $allowed_actions, true ) ) {
			return new WP_Error(
				'invalid_action',
				sprintf( 'Invalid action. Allowed: %s', implode( ', ', $allowed_actions ) )
			);
		}

		return $action;
	}

	/**
	 * Validate pagination parameters
	 *
	 * @param array $input Input array with potential pagination parameters.
	 * @return array Validated pagination parameters.
	 */
	public static function validate_pagination( array $input ): array {
		return array(
			'page'     => max( 1, intval( $input['page'] ?? 1 ) ),
			'per_page' => min( max( 1, intval( $input['per_page'] ?? 10 ) ), 100 ),
		);
	}

	/**
	 * Validate an email address
	 *
	 * @param string $email The email to validate.
	 * @return string|WP_Error The validated email or error.
	 */
	public static function validate_email( string $email ): string|WP_Error {
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', 'Invalid email address format' );
		}
		return sanitize_email( $email );
	}

	/**
	 * Validate a URL
	 *
	 * @param string $url The URL to validate.
	 * @return string|WP_Error The validated URL or error.
	 */
	public static function validate_url( string $url ): string|WP_Error {
		$sanitized = esc_url_raw( $url );
		if ( empty( $sanitized ) ) {
			return new WP_Error( 'invalid_url', 'Invalid URL format' );
		}
		return $sanitized;
	}

	/**
	 * Validate and sanitize a string field
	 *
	 * @param string $value      The value to validate.
	 * @param string $field_name The field name for error messages.
	 * @param int    $max_length Maximum allowed length.
	 * @return string|WP_Error The validated string or error.
	 */
	public static function validate_string( string $value, string $field_name = 'field', int $max_length = 255 ): string|WP_Error {
		$sanitized = sanitize_text_field( $value );

		if ( strlen( $sanitized ) > $max_length ) {
			return new WP_Error(
				'string_too_long',
				sprintf( '%s must be %d characters or less', $field_name, $max_length )
			);
		}

		return $sanitized;
	}

	/**
	 * Validate a site ID parameter
	 *
	 * @param mixed $site_id The site ID to validate.
	 * @return int|WP_Error The validated site ID or error.
	 */
	public static function validate_site_id( $site_id ): int|WP_Error {
		if ( empty( $site_id ) ) {
			return new WP_Error( 'missing_site_id', 'Site ID is required' );
		}

		$site_id = intval( $site_id );
		if ( $site_id <= 0 ) {
			return new WP_Error( 'invalid_site_id', 'Site ID must be a positive integer' );
		}

		return $site_id;
	}
}
