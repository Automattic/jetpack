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
					return $this->get_blog_token( $persistent_data->JETPACK_BLOG_TOKEN ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'id':
					return intval( $persistent_data->JETPACK_BLOG_ID ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'master_user':
					return $this->get_master_user_id( $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'user_tokens':
					return $this->get_user_tokens( $persistent_data->JETPACK_CONNECTION_OWNER_TOKEN ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
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
		 * Get the blog token with validation against database.
		 *
		 * @param string $external_blog_token The blog token from external storage.
		 * @return string|false The validated blog token or false if invalid.
		 */
		private function get_blog_token( $external_blog_token ) {
			if ( empty( $external_blog_token ) ) {
				return false;
			}

			// Get existing blog token from jetpack_private_options (bypass external storage to avoid circular dependency)
			$private_options     = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
			$existing_blog_token = isset( $private_options['blog_token'] ) ? $private_options['blog_token'] : null;

			// Validate against existing token (this may clear the database token on mismatch)
			if ( ! empty( $existing_blog_token ) ) {
				$this->validate_blog_token( $external_blog_token, $existing_blog_token );
			}
			// Always return the external token
			return $external_blog_token;
		}

		/**
		 * Get the master user id by email.
		 *
		 * @param string $email The email of the master user.
		 * @return int|bool The master user id or false if not found.
		 */
		public function get_master_user_id( $email ) {
			if ( empty( $email ) || ! is_email( $email ) ) {
				return false;
			}

			$user = get_user_by( 'email', $email );
			if ( ! $user instanceof \WP_User ) {
				return false;
			}
			return $user->ID;
		}

		/**
		 * Validates user tokens and cleans up on mismatch.
		 *
		 * @param string $normalized_token The normalized token from external storage (token_key.secret.user_id).
		 * @param array  $existing_tokens The existing tokens from the database.
		 * @param int    $user_id The user ID to validate tokens for.
		 * @return array The cleaned tokens array (empty if mismatch detected).
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

			// Token mismatch - clear all user tokens
			return $this->clear_tokens( 'user_tokens', $user_id );
		}

		/**
		 * Validates blog token and clears it on mismatch.
		 *
		 * @param string $external_token The token from external storage.
		 * @param string $existing_token The existing token from database.
		 * @return string|null The token if valid, null if mismatch detected.
		 */
		private function validate_blog_token( $external_token, $existing_token ) {
			if ( hash_equals( $external_token, $existing_token ) ) {
				return $external_token;
			}

			// Token mismatch - clear blog token and log
			$this->clear_tokens( 'blog_token' );
			return null;
		}

		/**
		 * Clears tokens from the database and logs the mismatch.
		 *
		 * @param string $token_type The type of token ('user_tokens' or 'blog_token').
		 * @param int    $user_id Optional user ID for logging purposes (for user tokens).
		 * @return array|null Empty array for user tokens, null for blog token.
		 */
		private function clear_tokens( $token_type, $user_id = null ) {
			if ( 'user_tokens' === $token_type ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( "Jetpack token mismatch for user {$user_id}. Clearing all user tokens." );
			} else {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'Jetpack blog token mismatch detected. Clearing blog token.' );
			}

			// Clear the specified token(s) from jetpack_private_options
			$private_options = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );

			if ( 'user_tokens' === $token_type ) {
				$private_options['user_tokens'] = array();
			} else {
				unset( $private_options['blog_token'] );
			}
			\Jetpack_Options::update_raw_option( 'jetpack_private_options', $private_options );

			// Return empty array for user tokens, null for blog token
			return 'user_tokens' === $token_type ? array() : null;
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

			// Verify this is the master user
			$master_user = (int) \Jetpack_Options::get_option( 'master_user' );
			if ( ! $master_user || $master_user !== $user_id ) {
				return false;
			}

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
