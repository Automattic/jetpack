<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Traits;

use WP_Error;

/**
 * User Context Trait
 *
 * Provides common user context functionality for abilities
 */
trait UserContextTrait {
	/**
	 * Get current user ID
	 *
	 * @return int User ID.
	 */
	protected function get_current_user_id(): int {
		return get_current_user_id();
	}

	/**
	 * Check if user is logged in and return error if not
	 *
	 * @return WP_Error|null Returns WP_Error if no user, null if user exists.
	 */
	protected function validate_user_logged_in(): ?WP_Error {
		$user_id = $this->get_current_user_id();

		if ( 0 === $user_id ) {
			return $this->create_error( 'no_user', 'No user is currently logged in', 401 );
		}

		return null;
	}

	/**
	 * Get current user object with validation
	 *
	 * @return WP_Error|\WP_User Returns WP_Error on failure, WP_User on success.
	 */
	protected function get_current_user() {
		$user_id = $this->get_current_user_id();

		if ( 0 === $user_id ) {
			return $this->create_error( 'no_user', 'No user is currently logged in', 401 );
		}

		$user = get_user_by( 'ID', $user_id );
		if ( ! $user ) {
			return $this->create_error( 'user_not_found', 'User not found', 404 );
		}

		return $user;
	}

	/**
	 * Validate connection ID parameter
	 *
	 * @param mixed $connection_id Connection ID to validate.
	 * @return WP_Error|int Returns WP_Error on failure, int on success.
	 */
	protected function validate_connection_id( $connection_id ) {
		if ( ! is_numeric( $connection_id ) || (int) $connection_id <= 0 ) {
			return $this->create_error( 'invalid_connection_id', 'Valid connection ID is required' );
		}

		return (int) $connection_id;
	}

	/**
	 * Standard permission check - user must be logged in
	 *
	 * @return bool True if permission granted, false otherwise.
	 */
	protected function check_user_permission(): bool {
		return $this->get_current_user_id() > 0;
	}

	/**
	 * Create a standardized WP_Error for ability errors
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message.
	 * @param int    $status  HTTP status code (default: 400).
	 * @return WP_Error The error object.
	 */
	protected function create_error( string $code, string $message, int $status = 400 ): WP_Error {
		return new WP_Error(
			$code,
			$message,
			array( 'status' => $status )
		);
	}
}
