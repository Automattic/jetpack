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
					return empty( $persistent_data->JETPACK_BLOG_TOKEN ) ? null : $persistent_data->JETPACK_BLOG_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'id':
					$blog_id = $persistent_data->JETPACK_BLOG_ID; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return empty( $blog_id ) ? null : intval( $blog_id );

				case 'master_user':
					$email = $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$id    = $this->get_master_user_id( $email ? $email : '' );
					return $id ? $id : null;

				case 'user_tokens':
					$email  = $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$secret = $persistent_data->JETPACK_CONNECTION_OWNER_TOKEN_SECRET; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					if ( empty( $email ) || empty( $secret ) ) {
						return null;
					}
					$tokens = $this->get_user_tokens( $email, $secret );
					return ( is_array( $tokens ) && ! empty( $tokens ) ) ? $tokens : null;
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
			// Ensure WordPress core functions are loaded
			if ( ! function_exists( 'get_user_by' ) || empty( $email ) ) {
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
		 * Remove conflicting tokens for a given normalized token and user.
		 *
		 * Conflicts are:
		 * - Current user has a different token string than normalized token
		 * - Any other user has a token sharing the same secret prefix
		 *
		 * @since $$next-version$$
		 *
		 * @param array  $tokens           Tokens array keyed by user ID.
		 * @param string $normalized_token Normalized token (token_key.secret.user_id).
		 * @param int    $user_id          Local user ID for whom the token applies.
		 * @return array { Updated tokens and whether any conflicts were removed }
		 * @phpstan-return array{ tokens: array, had_conflicts: bool }
		 */
		private function remove_conflicting_tokens( $tokens, $normalized_token, $user_id ) {
			$had_conflicts = false;
			$last_dot_pos  = strrpos( $normalized_token, '.' );

			// Validate token format - must contain a dot to separate secret from user_id.
			if ( false === $last_dot_pos ) {
				return array(
					'tokens'        => $tokens,
					'had_conflicts' => false,
				);
			}

			$secret_prefix = substr( $normalized_token, 0, $last_dot_pos );

			// Remove mismatched token for the current user.
			if ( isset( $tokens[ $user_id ] )
			&& is_string( $tokens[ $user_id ] )
			&& ! hash_equals( $normalized_token, $tokens[ $user_id ] ) ) {
				unset( $tokens[ $user_id ] );
				$had_conflicts = true;
			}

			// Remove orphaned tokens (same secret, different user).
			foreach ( $tokens as $token_user_id => $token ) {
				if ( is_string( $token ) && (int) $token_user_id !== $user_id && strpos( $token, $secret_prefix . '.' ) === 0 ) {
					unset( $tokens[ $token_user_id ] );
					$had_conflicts = true;
				}
			}

			return array(
				'tokens'        => $tokens,
				'had_conflicts' => $had_conflicts,
			);
		}

		/**
		 * Validates user tokens and removes conflicting tokens.
		 *
		 * Removes any tokens that:
		 * 1. Belong to the current user but don't match the external storage token
		 * 2. Have the same secret as external storage but belong to a different user (orphaned tokens)
		 *
		 * Re-reads the latest state before persisting to minimize race condition window.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $normalized_token The normalized token from external storage (token_key.secret.user_id).
		 * @param array  $existing_tokens The existing tokens from the database.
		 * @param int    $user_id The user ID to validate tokens for.
		 * @return array The tokens array with conflicting tokens removed.
		 */
		private function validate_user_tokens( $normalized_token, $existing_tokens, $user_id ) {
			$result        = $this->remove_conflicting_tokens( $existing_tokens, $normalized_token, $user_id );
			$has_conflicts = $result['had_conflicts'];

			// Only persist changes if conflicts were found
			if ( $has_conflicts ) {
				// Re-read latest state right before writing to minimize race window
				$latest_options = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
				$latest_tokens  = isset( $latest_options['user_tokens'] ) && is_array( $latest_options['user_tokens'] )
				? $latest_options['user_tokens']
				: array();

				// Re-apply cleanup to latest tokens (might find no conflicts now if state changed)
				$latest_result = $this->remove_conflicting_tokens( $latest_tokens, $normalized_token, $user_id );

				// Write the cleaned latest state
				$latest_options['user_tokens'] = $latest_result['tokens'];
				\Jetpack_Options::update_raw_option( 'jetpack_private_options', $latest_options, false );

				// Also clear master_user from database since connection owner data has changed
				// External storage will provide the correct value on next read
				\Jetpack_Options::delete_option( 'master_user' );

				// Clear object cache to ensure cached values are invalidated
				wp_cache_delete( 'alloptions', 'options' );
				wp_cache_delete( 'jetpack_options', 'options' );
				wp_cache_delete( 'jetpack_private_options', 'options' );

				// Return what we actually wrote to the database
				return $latest_result['tokens'];
			}

			// No conflicts, return cleaned tokens
			return $result['tokens'];
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

			// Ensure WordPress core functions are loaded
			if ( ! function_exists( 'get_user_by' ) || ! is_email( $email ) ) {
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
