<?php
/**
 * Atomic Persistent Data storage provider for Jetpack Connection data.
 *
 * @package wpcomsh
 */

// Only define the class if the interface is available
if ( interface_exists( 'Automattic\Jetpack\Connection\Storage_Provider_Interface' ) ) {

	/**
	 * Atomic Persistent Data storage provider for Jetpack Connection data.
	 * Stage 1: Read-only support for blog_token and id (blog_id).
	 *
	 * @since 8.0.0
	 */
	class Atomic_Storage_Provider implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {

		/**
		 * Check if Atomic Persistent Data is available in current environment.
		 *
		 * @return bool True if available, false otherwise.
		 */
		public function is_available() {
			return class_exists( 'Atomic_Persistent_Data' );
		}

		/**
		 * Check if this provider should handle the given option.
		 *
		 * @param string $option_name The option name to check.
		 * @return bool True if this provider should handle the option.
		 */
		public function should_handle( $option_name ) {
			// Handle blog connection data by default
			return in_array( $option_name, array( 'blog_token', 'id', 'master_user', 'user_tokens' ), true );
		}

		/**
		 * Get value from Atomic Persistent Data.
		 *
		 * @param string $option_name The option name to retrieve.
		 * @return mixed The option value, or null if not found.
		 */
		public function get( $option_name ) {
			$persistent_data = new Atomic_Persistent_Data();

			switch ( $option_name ) {
				case 'blog_token':
					return empty( $persistent_data->JETPACK_BLOG_TOKEN ) ? false : $persistent_data->JETPACK_BLOG_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'id':
					return intval( $persistent_data->JETPACK_BLOG_ID ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'master_user':
					$token = $persistent_data->JETPACK_CONNECTION_OWNER_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return $token ? $this->get_master_user_id( $token ) : false;

				case 'user_tokens':
					$token = $persistent_data->JETPACK_CONNECTION_OWNER_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return $token ? $this->get_user_tokens( $token ) : false;
			}

			return null;
		}

		/**
		 * Get environment identifier for logging.
		 *
		 * @return string Environment identifier.
		 */
		public function get_environment_id() {
			return 'woa';
		}

		/**
		 * Get the master user id from token.
		 *
		 * @param string $email_token The email token JSON string.
		 * @return int|bool The master user id or false if not found.
		 */
		public function get_master_user_id( $email_token ) {
			// Extract email from token
			if ( empty( $email_token ) ) {
				return false;
			}

			$token = json_decode( $email_token );
			if ( JSON_ERROR_NONE !== json_last_error() || ! $token || empty( $token->user_email ) ) {
				return false;
			}

			if ( ! is_email( $token->user_email ) ) {
				return false;
			}

			$user = get_user_by( 'email', $token->user_email );
			if ( ! $user instanceof \WP_User ) {
				return false;
			}
			return $user->ID;
		}

		/**
		 * Validates user tokens and removes conflicting token for the specific user.
		 *
		 * @param string $normalized_token The normalized token from external storage (token_key.secret.user_id).
		 * @param array  $existing_tokens The existing tokens from the database.
		 * @param int    $user_id The user ID to validate tokens for.
		 * @return array The tokens array with conflicting user token removed.
		 */
		private function validate_user_tokens( $normalized_token, $existing_tokens, $user_id ) {
			// Check if there's an existing token for this user
			if ( ! isset( $existing_tokens[ $user_id ] ) ) {
				return $existing_tokens;
			}

			$existing_token = $existing_tokens[ $user_id ];

			if ( hash_equals( $normalized_token, $existing_token ) ) {
				return $existing_tokens;
			}

			// Token mismatch - remove only this user's conflicting token
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( "Removing conflicting token for user {$user_id}" );
			unset( $existing_tokens[ $user_id ] );

			return $existing_tokens;
		}

		/**
		 * Get the user tokens by email.
		 *
		 * @param object|string $email_token The email token object or JSON encoded string.
		 * @return array|false The user tokens array or false if not found/invalid.
		 */
		public function get_user_tokens( $email_token ) {
			// Validate input
			if ( empty( $email_token ) ) {
				return false;
			}

			$token = json_decode( $email_token );

			if ( JSON_ERROR_NONE !== json_last_error() || ! $token || empty( $token->user_email ) || empty( $token->secret ) ) {
				return false;
			}

			// Get user by email
			$user = get_user_by( 'email', $token->user_email );
			if ( ! $user || ! $user->ID ) {
				return false;
			}

			$user_id = (int) $user->ID;

			// Create normalized token (format: token_key.secret.user_id)
			// The secret from external storage should be token_key.secret (2 parts)
			// We need to append LOCAL user_id to make it 3 parts for Jetpack validation
			$normalized_token = $token->secret . '.' . $user_id;

			// Get existing tokens from database (bypass external storage to avoid circular dependency)
			$private_options = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
			$existing_tokens = isset( $private_options['user_tokens'] ) && is_array( $private_options['user_tokens'] )
				? $private_options['user_tokens']
				: array();

			// Validate tokens and clean up if there's a mismatch
			if ( ! empty( $existing_tokens ) ) {
				$existing_tokens = $this->validate_user_tokens( $normalized_token, $existing_tokens, $user_id );
			}

			// Store the token with local user ID as key and local user ID in token
			$existing_tokens[ $user_id ] = $normalized_token;

			return $existing_tokens;
		}
	}
}
