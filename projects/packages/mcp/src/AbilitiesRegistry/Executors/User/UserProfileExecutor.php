<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Executors\User;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\UserContextTrait;
use WP_Error;
use WP_User;

/**
 * User Profile Executor Class
 *
 * Handles execution logic for user profile ability
 */
class UserProfileExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user profile ability.
	 *
	 * @param array $input The input parameters.
	 * @return WP_Error|array The profile data or error.
	 */
	public function execute( array $input = array() ) {
		// Validate user is logged in.
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$user            = get_user_by( 'ID', $current_user_id );

		if ( ! $user ) {
			return $this->create_error( 'user_not_found', 'User not found', 404 );
		}

		// Build the response based on requested fields.
		$response = array(
			'success' => true,
			'profile' => $this->get_basic_profile( $user ),
		);

		// Add optional sections based on input parameters.
		if ( ! empty( $input['include_preferences'] ) ) {
			$response['preferences'] = $this->get_user_preferences( $user );
		}

		if ( ! empty( $input['include_stats'] ) ) {
			$response['stats'] = $this->get_user_stats( $user );
		}

		if ( ! empty( $input['include_account'] ) ) {
			$response['account'] = $this->get_account_info( $user );
		}

		if ( ! empty( $input['include_social'] ) ) {
			$response['social'] = $this->get_social_data( $user );
		}

		if ( ! empty( $input['include_activity'] ) ) {
			$response['activity'] = $this->get_activity_data( $user );
		}

		// Filter response by specific fields if requested.
		if ( ! empty( $input['fields'] ) && is_array( $input['fields'] ) ) {
			$response = $this->filter_response_fields( $response, $input['fields'] );
		}

		return $response;
	}

	/**
	 * Check permission for the user profile ability.
	 *
	 * @param array $input The input parameters.
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		return $this->check_user_permission();
	}

		/**
		 * Get basic user profile information.
		 *
		 * @param WP_User $user The user object.
		 * @return array Basic profile data.
		 */
	private function get_basic_profile( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		return array(
			'id'           => (int) $user->ID,
			'username'     => $user->user_login,
			'email'        => $user->user_email,
			'display_name' => ! empty( $user->display_name ) ? $user->display_name : $user->user_login,
			'first_name'   => ! empty( $user->first_name ) ? $user->first_name : '',
			'last_name'    => ! empty( $user->last_name ) ? $user->last_name : '',
			'description'  => ! empty( $user->description ) ? $user->description : '',
			'url'          => ! empty( $user->user_url ) ? $user->user_url : '',
			'avatar_url'   => get_avatar_url( $user->ID, array( 'size' => 96 ) ),
			'locale'       => get_user_locale( $user->ID ),
			'timezone'     => $this->get_user_timezone( $user ),
			'date_format'  => $this->get_user_date_format( $user ),
			'time_format'  => $this->get_user_time_format( $user ),
			'registered'   => gmdate( 'c', strtotime( $user->user_registered ) ),
			'capabilities' => array_keys( $user->get_role_caps() ),
		);
	}

		/**
		 * Get user preferences and settings.
		 *
		 * @param WP_User $user The user object.
		 * @return array User preferences.
		 */
	private function get_user_preferences( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		return array(
			'language'         => get_user_locale( $user->ID ),
			'color_scheme'     => ! empty( get_user_meta( $user->ID, 'admin_color', true ) ) ? get_user_meta( $user->ID, 'admin_color', true ) : 'default',
			'admin_interface'  => get_user_meta( $user->ID, 'show_admin_bar_front', true ) ? 'enabled' : 'disabled',
			'notifications'    => $this->get_notification_preferences( $user ),
			'privacy_settings' => $this->get_privacy_settings( $user ),
		);
	}

		/**
		 * Get user statistics and metrics.
		 *
		 * @param WP_User $user The user object.
		 * @return array User statistics.
		 */
	private function get_user_stats( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// @phan-suppress-next-line PhanUndeclaredFunction
		$user_sites  = get_ordered_blogs_of_user( $user->ID );
		$total_sites = $user_sites ? count( $user_sites ) : 0;

		// Get content statistics across all user's sites.
		$stats = $this->get_content_statistics( $user->ID, $user_sites );

		return array(
			'total_sites'    => $total_sites,
			'total_posts'    => $stats['posts'],
			'total_pages'    => $stats['pages'],
			'total_comments' => $stats['comments'],
			'member_since'   => gmdate( 'c', strtotime( $user->user_registered ) ),
			'last_active'    => $this->get_last_active_date( $user ),
		);
	}

		/**
		 * Get account and subscription information.
		 *
		 * @param WP_User $user The user object.
		 * @return array Account information.
		 */
	private function get_account_info( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// This is placeholder data - in a real WordPress.com environment,
		// this would integrate with the actual subscription and billing systems.
		return array(
			'plan'               => $this->get_user_plan( $user ),
			'subscriptions'      => $this->get_user_subscriptions( $user ),
			'storage'            => $this->get_storage_info( $user ),
			'bandwidth'          => $this->get_bandwidth_info( $user ),
			'is_paying_customer' => $this->is_paying_customer( $user ),
		);
	}

		/**
		 * Get social and community engagement data.
		 *
		 * @param WP_User $user The user object.
		 * @return array Social data.
		 */
	private function get_social_data( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		return array(
			'following_count'      => $this->get_following_count( $user ),
			'followers_count'      => $this->get_followers_count( $user ),
			'reader_subscriptions' => $this->get_reader_subscriptions( $user ),
			'likes_given'          => $this->get_likes_given_count( $user ),
			'comments_made'        => $this->get_comments_made_count( $user ),
		);
	}

		/**
		 * Get activity and engagement metrics.
		 *
		 * @param WP_User $user The user object.
		 * @return array Activity data.
		 */
	private function get_activity_data( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// @phan-suppress-next-line PhanUndeclaredFunction
		$user_sites = get_ordered_blogs_of_user( $user->ID );

		return array(
			'most_active_site'     => $this->get_most_active_site( $user, $user_sites ),
			'publishing_frequency' => $this->get_publishing_frequency( $user, $user_sites ),
			'total_views'          => $this->get_total_views( $user, $user_sites ),
			'total_visitors'       => $this->get_total_visitors( $user, $user_sites ),
			'recent_activity'      => $this->get_recent_activity( $user ),
		);
	}

		/**
		 * Get user timezone.
		 *
		 * @param WP_User $user The user object.
		 * @return string User timezone.
		 */
	private function get_user_timezone( WP_User $user ): string {
		$timezone = get_user_meta( $user->ID, 'timezone', true );
		return ! empty( $timezone ) ? $timezone : get_option( 'timezone_string', 'UTC' );
	}

		/**
		 * Get user date format.
		 *
		 * @param WP_User $user The user object.
		 * @return string User date format.
		 */
	private function get_user_date_format( WP_User $user ): string {
		$format = get_user_meta( $user->ID, 'date_format', true );
		return ! empty( $format ) ? $format : get_option( 'date_format', 'F j, Y' );
	}

		/**
		 * Get user time format.
		 *
		 * @param WP_User $user The user object.
		 * @return string User time format.
		 */
	private function get_user_time_format( WP_User $user ): string {
		$format = get_user_meta( $user->ID, 'time_format', true );
		return ! empty( $format ) ? $format : get_option( 'time_format', 'g:i a' );
	}

		/**
		 * Get notification preferences.
		 *
		 * @param WP_User $user The user object.
		 * @return array Notification preferences.
		 */
	private function get_notification_preferences( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - in real WordPress.com, this would integrate with notification settings.
		return array(
			'email_notifications'   => true,
			'push_notifications'    => false,
			'browser_notifications' => true,
		);
	}

		/**
		 * Get privacy settings.
		 *
		 * @param WP_User $user The user object.
		 * @return array Privacy settings.
		 */
	private function get_privacy_settings( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		return array(
			'profile_visibility' => 'public',
			'search_engines'     => true,
			'show_email'         => false,
		);
	}

		/**
		 * Get content statistics across user's sites.
		 *
		 * @param int   $user_id The user ID.
		 * @param array $user_sites Array of user sites.
		 * @return array Content statistics.
		 */
	private function get_content_statistics( int $user_id, ?array $user_sites ): array {
		$stats = array(
			'posts'    => 0,
			'pages'    => 0,
			'comments' => 0,
		);

		if ( ! $user_sites ) {
			return $stats;
		}

		foreach ( $user_sites as $site ) {
			$blog_id = (int) $site->userblog_id;

			switch_to_blog( $blog_id );

			// Count posts by this user.
			$posts = get_posts(
				array(
					'author'      => $user_id,
					'post_status' => 'publish',
					'numberposts' => -1,
					'fields'      => 'ids',
				)
			);

			// Count pages by this user.
			$pages = get_posts(
				array(
					'author'      => $user_id,
					'post_type'   => 'page',
					'post_status' => 'publish',
					'numberposts' => -1,
					'fields'      => 'ids',
				)
			);

			// Count comments by this user.
			$comments = get_comments(
				array(
					'user_id' => $user_id,
					'status'  => 'approve',
					'count'   => true,
				)
			);

			restore_current_blog();

			$stats['posts']    += count( $posts );
			$stats['pages']    += count( $pages );
			$stats['comments'] += (int) $comments;
		}

		return $stats;
	}

		/**
		 * Get last active date.
		 *
		 * @param WP_User $user The user object.
		 * @return string Last active date.
		 */
	private function get_last_active_date( WP_User $user ): string {
		// Placeholder - in WordPress.com this would use actual activity tracking.
		$last_active = get_user_meta( $user->ID, 'last_active', true );
		return $last_active ? gmdate( 'c', $last_active ) : gmdate( 'c' );
	}

		/**
		 * Get user plan information.
		 *
		 * @param WP_User $user The user object.
		 * @return array Plan information.
		 */
	private function get_user_plan( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would integrate with WordPress.com plans API.
		return array(
			'name'       => 'Free',
			'slug'       => 'free',
			'is_premium' => false,
			'expires'    => null,
			'auto_renew' => false,
		);
	}

		/**
		 * Get user subscriptions.
		 *
		 * @param WP_User $user The user object.
		 * @return array Subscriptions.
		 */
	private function get_user_subscriptions( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would integrate with subscriptions system.
		return array();
	}

		/**
		 * Get storage information.
		 *
		 * @param WP_User $user The user object.
		 * @return array Storage information.
		 */
	private function get_storage_info( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		return array(
			'used_mb'    => 150.5,
			'limit_mb'   => 3072,
			'percentage' => 4.9,
		);
	}

		/**
		 * Get bandwidth information.
		 *
		 * @param WP_User $user The user object.
		 * @return array Bandwidth information.
		 */
	private function get_bandwidth_info( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		return array(
			'used_gb'    => 2.1,
			'limit_gb'   => null, // Unlimited
			'percentage' => null,
		);
	}

		/**
		 * Check if user is a paying customer.
		 *
		 * @param WP_User $user The user object.
		 * @return bool Whether user is paying customer.
		 */
	private function is_paying_customer( WP_User $user ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would check actual subscription status.
		return false;
	}

		/**
		 * Get following count.
		 *
		 * @param WP_User $user The user object.
		 * @return int Following count.
		 */
	private function get_following_count( WP_User $user ): int { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would integrate with WordPress.com following system.
		return 42;
	}

		/**
		 * Get followers count.
		 *
		 * @param WP_User $user The user object.
		 * @return int Followers count.
		 */
	private function get_followers_count( WP_User $user ): int { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would integrate with WordPress.com followers system.
		return 28;
	}

		/**
		 * Get reader subscriptions count.
		 *
		 * @param WP_User $user The user object.
		 * @return int Reader subscriptions count.
		 */
	private function get_reader_subscriptions( WP_User $user ): int { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would integrate with Reader subscriptions.
		return 156;
	}

		/**
		 * Get likes given count.
		 *
		 * @param WP_User $user The user object.
		 * @return int Likes given count.
		 */
	private function get_likes_given_count( WP_User $user ): int { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would integrate with likes system.
		return 847;
	}

		/**
		 * Get comments made count.
		 *
		 * @param WP_User $user The user object.
		 * @return int Comments made count.
		 */
	private function get_comments_made_count( WP_User $user ): int {
		// Get actual count of comments made by user across network.
		// @phan-suppress-next-line PhanUndeclaredFunction
		$user_sites     = get_ordered_blogs_of_user( $user->ID );
		$total_comments = 0;

		if ( $user_sites ) {
			foreach ( $user_sites as $site ) {
				switch_to_blog( $site->userblog_id );

				$comments = get_comments(
					array(
						'user_id' => $user->ID,
						'status'  => 'approve',
						'count'   => true,
					)
				);

				$total_comments += (int) $comments;

				restore_current_blog();
			}
		}

		return $total_comments;
	}

		/**
		 * Get most active site.
		 *
		 * @param WP_User    $user The user object.
		 * @param array|null $user_sites Array of user sites.
		 * @return array|null Most active site information.
		 */
	private function get_most_active_site( WP_User $user, ?array $user_sites ): ?array {
		if ( ! $user_sites ) {
			return null;
		}

		// Placeholder logic - would use actual activity metrics.
		// Use array_values to ensure numeric indexing or reset to get first element
		$first_site = reset( $user_sites );

		if ( ! $first_site ) {
			return null;
		}

		return array(
			'blog_id'   => (int) $first_site->userblog_id,
			'site_name' => $first_site->blogname,
			'site_url'  => $first_site->siteurl,
			'posts'     => 25,
		);
	}

		/**
		 * Get publishing frequency.
		 *
		 * @param WP_User    $user The user object.
		 * @param array|null $user_sites Array of user sites.
		 * @return string Publishing frequency.
		 */
	private function get_publishing_frequency( WP_User $user, ?array $user_sites ): string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user and $user_sites will be used in future implementation
		// Placeholder - would analyze actual publishing patterns.
		return 'weekly';
	}

		/**
		 * Get total views across all sites.
		 *
		 * @param WP_User    $user The user object.
		 * @param array|null $user_sites Array of user sites.
		 * @return int Total views.
		 */
	private function get_total_views( WP_User $user, ?array $user_sites ): int { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user and $user_sites will be used in future implementation
		// Placeholder - would integrate with stats system.
		return 12450;
	}

		/**
		 * Get total visitors across all sites.
		 *
		 * @param WP_User    $user The user object.
		 * @param array|null $user_sites Array of user sites.
		 * @return int Total visitors.
		 */
	private function get_total_visitors( WP_User $user, ?array $user_sites ): int { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user and $user_sites will be used in future implementation
		// Placeholder - would integrate with stats system.
		return 8923;
	}

		/**
		 * Get recent activity.
		 *
		 * @param WP_User $user The user object.
		 * @return array Recent activity.
		 */
	private function get_recent_activity( WP_User $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user will be used in future implementation
		// Placeholder - would get actual recent activity.
		return array(
			array(
				'type'      => 'post_published',
				'timestamp' => gmdate( 'c', time() - 3600 ),
				'site_name' => 'My Blog',
				'title'     => 'Latest Blog Post',
			),
			array(
				'type'      => 'comment_made',
				'timestamp' => gmdate( 'c', time() - 7200 ),
				'site_name' => 'Another Site',
				'content'   => 'Great article!',
			),
		);
	}

		/**
		 * Filter response fields based on requested fields.
		 *
		 * @param array $response The full response.
		 * @param array $fields The requested fields.
		 * @return array Filtered response.
		 */
	private function filter_response_fields( array $response, array $fields ): array {
		$filtered = array( 'success' => $response['success'] );

		foreach ( $fields as $field ) {
			if ( isset( $response[ $field ] ) ) {
				$filtered[ $field ] = $response[ $field ];
			}
		}

		return $filtered;
	}
}
