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
	 * @since $$next-version$$
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
			// Handle blog connection data, master_user, and user_tokens
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
					return $persistent_data->JETPACK_BLOG_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'id':
					$blog_id = $persistent_data->JETPACK_BLOG_ID; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return $blog_id ? intval( $blog_id ) : null;

				case 'master_user':
					// Get master user from APD owner email
					return $this->get_master_user_from_owner_email();

				case 'user_tokens':
					// Use our special owner substitution logic
					return $this->get_user_tokens_with_owner_substitution();
			}

			return null;
		}

		/**
		 * Get user tokens with owner substitution logic.
		 * This is the key method that implements the blog token substitution.
		 *
		 * @since $$next-version$$
		 *
		 * @return array|null Modified user tokens array or null if not available.
		 */
		public function get_user_tokens_with_owner_substitution() {
			$persistent_data = new Atomic_Persistent_Data();

			// Get owner email from APD
			$owner_email = $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL ?? null; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			if ( ! $owner_email ) {
				return null; // No owner email, fall back to database
			}

			// Find WordPress user by email
			$owner_user = get_user_by( 'email', $owner_email );
			if ( ! $owner_user ) {
				return null; // Owner user not found locally
			}

			// Get blog token from APD
			$blog_token = $persistent_data->JETPACK_BLOG_TOKEN ?? null; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			if ( ! $blog_token ) {
				return null; // No blog token available
			}

			// Get existing user tokens from database (for non-owner users)
			$existing_user_tokens = get_option( 'jetpack_user_tokens', array() );
			if ( ! is_array( $existing_user_tokens ) ) {
				$existing_user_tokens = array();
			}

			// Create modified user tokens array
			$modified_user_tokens = $existing_user_tokens;

			// CORE LOGIC: Create fake user token for owner using blog token + user ID
			$owner_user_id    = $owner_user->ID;
			$blog_token_parts = explode( '.', $blog_token );

			if ( count( $blog_token_parts ) >= 2 ) {
				// Create user token format: token_key.token_secret.user_id
				$fake_user_token                        = $blog_token_parts[0] . '.' . $blog_token_parts[1] . '.' . $owner_user_id;
				$modified_user_tokens[ $owner_user_id ] = $fake_user_token;
			}

			return $modified_user_tokens;
		}

		/**
		 * Get master user ID from owner email.
		 *
		 * @since $$next-version$$
		 *
		 * @return int|null Master user ID or null if not found.
		 */
		private function get_master_user_from_owner_email() {
			$persistent_data = new Atomic_Persistent_Data();
			$owner_email     = $persistent_data->JETPACK_CONNECTION_OWNER_EMAIL ?? null; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

			if ( ! $owner_email ) {
				return null;
			}

			$owner_user = get_user_by( 'email', $owner_email );
			return $owner_user ? $owner_user->ID : null;
		}

		/**
		 * Get environment identifier for logging.
		 *
		 * @return string Environment identifier.
		 */
		public function get_environment_id() {
			return 'woa';
		}
	}

}
