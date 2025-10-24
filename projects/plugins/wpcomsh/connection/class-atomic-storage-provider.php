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
	 *
	 * Provides connection credentials from Atomic Persistent Data (APD) for WordPress.com Atomic sites.
	 * Supports blog_token, blog_id, master_user, and user_tokens from external storage.
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
					$email = $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return $email ? $this->get_master_user_id( $email ) : false;

				case 'user_tokens':
					$email  = $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$secret = $persistent_data->JETPACK_CONNECTION_OWNER_TOKEN_SECRET; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return ( $email && $secret ) ? $this->get_user_tokens( $email, $secret ) : false;
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
		 * Get the master user id from email.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $email The user email.
		 * @return int|bool The master user id or false if not found.
		 */
		public function get_master_user_id( $email ) {
			if ( empty( $email ) ) {
				return false;
			}

			if ( ! is_email( $email ) ) {
				return false;
			}

			$user = get_user_by( 'email', $email );
			if ( ! $user instanceof \WP_User ) {
				return false;
			}
			return $user->ID;
		}

		/**
		 * Validates user tokens and removes conflicting tokens.
		 *
		 * Removes any tokens that:
		 * 1. Belong to the current user but don't match the external storage token
		 * 2. Have the same secret as external storage but belong to a different user (orphaned tokens)
		 *
		 * @since $$next-version$$
		 *
		 * @param string $normalized_token The normalized token from external storage (token_key.secret.user_id).
		 * @param array  $existing_tokens The existing tokens from the database.
		 * @param int    $user_id The user ID to validate tokens for.
		 * @return array The tokens array with conflicting tokens removed.
		 */
		private function validate_user_tokens( $normalized_token, $existing_tokens, $user_id ) {
			$has_conflicts = false;
			$last_dot_pos  = strrpos( $normalized_token, '.' );

			// Validate token format - it must contain a dot to separate secret from user_id
			if ( false === $last_dot_pos ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( "Invalid token format in validate_user_tokens: '{$normalized_token}'" );
				return $existing_tokens;
			}

			$secret_prefix = substr( $normalized_token, 0, $last_dot_pos );

			// Check if current user has a mismatched token
			if ( isset( $existing_tokens[ $user_id ] )
				&& is_string( $existing_tokens[ $user_id ] )
				&& ! hash_equals( $normalized_token, $existing_tokens[ $user_id ] ) ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( "Removing conflicting token for user {$user_id}" );
				unset( $existing_tokens[ $user_id ] );
				$has_conflicts = true;
			}

			// Check if any other user has a token with the same secret (orphaned token from previous owner)
			foreach ( $existing_tokens as $token_user_id => $token ) {
				if ( $token_user_id !== $user_id && strpos( $token, $secret_prefix . '.' ) === 0 ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( "Removing orphaned token with same secret for user {$token_user_id}" );
					unset( $existing_tokens[ $token_user_id ] );
					$has_conflicts = true;
				}
			}

			// Only persist changes if conflicts were found
			if ( $has_conflicts ) {
				// Persist the change to the database to prevent repeated error logging
				$private_options                = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
				$private_options['user_tokens'] = $existing_tokens;
				update_option( 'jetpack_private_options', $private_options );

				// Also clear master_user from database since connection owner data has changed
				// External storage will provide the correct value on next read
				\Jetpack_Options::delete_option( 'master_user' );
			}

			return $existing_tokens;
		}

		/**
		 * Get the user tokens by email and secret.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $email The user email.
		 * @param string $secret The token secret (format: token_key.secret).
		 * @return array|false The user tokens array or false if not found/invalid.
		 */
		public function get_user_tokens( $email, $secret ) {
			// Validate input
			if ( empty( $email ) || empty( $secret ) ) {
				return false;
			}

			if ( ! is_email( $email ) ) {
				return false;
			}

			// Get user by email
			$user = get_user_by( 'email', $email );
			if ( ! $user instanceof \WP_User ) {
				return false;
			}

			$user_id = (int) $user->ID;

			// Create normalized token (format: token_key.secret.user_id)
			// The secret from external storage should be token_key.secret (2 parts)
			// We need to append LOCAL user_id to make it 3 parts for Jetpack validation
			$normalized_token = $secret . '.' . $user_id;

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
