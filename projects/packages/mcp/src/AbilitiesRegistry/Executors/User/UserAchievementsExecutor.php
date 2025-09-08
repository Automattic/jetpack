<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use WP_Error;

/**
 * User Achievements Executor Class
 *
 * Contains the business logic for user achievements, badges, and milestones
 */
class UserAchievementsExecutor implements ExecutorInterface {

	/**
	 * Execute the user achievements ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return WP_Error|array The achievements data or error.
	 */
	public function execute( array $input = array() ): WP_Error|array {
		try {
			$action = $this->validate_action(
				$input['action'] ?? 'list',
				array( 'list', 'get_progress', 'get_stats', 'get_trophy_case', 'get_feats' )
			);

			if ( is_wp_error( $action ) ) {
				return $action;
			}

			switch ( $action ) {
				case 'list':
					return $this->list_achievements( $input );
				case 'get_progress':
					return $this->get_achievement_progress();
				case 'get_stats':
					return $this->get_achievement_stats();
				case 'get_trophy_case':
					return $this->get_trophy_case();
				case 'get_feats':
					return $this->get_user_feats( $input );
				default:
					return $this->create_error( 'invalid_action', 'Invalid action specified' );
			}
		} catch ( \Exception $e ) {
			return $this->create_error(
				'achievements_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user achievements ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		return $this->check_user_permission();
	}

	/**
	 * List user achievements
	 *
	 * @param array $input Input parameters.
	 *
	 * @return WP_Error|array Achievements list or error.
	 */
	private function list_achievements( array $input ): WP_Error|array {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id  = $this->get_current_user_id();
		$achievement_type = $input['achievement_type'] ?? 'all';
		$limit            = $input['limit'] ?? 20;
		$blog_id          = $input['blog_id'] ?? 0;

		$user_achievements_list = array();
		$feats                  = array();

		// Use global achievements array if available.
		global $achievements;
		if ( is_array( $achievements ) ) {
			$user_achievements_list = $this->get_user_achievements_from_global( $current_user_id, $blog_id );
		}

		// Get feats if requested.
		if ( 'all' === $achievement_type || 'feats' === $achievement_type ) {
			$feats = $this->get_user_feats_data( $current_user_id, $blog_id );
		}

		// Filter by type.
		$result = array();
		if ( 'all' === $achievement_type || 'achievements' === $achievement_type ) {
			$result['achievements'] = array_slice( $user_achievements_list, 0, $limit );
		}
		if ( 'all' === $achievement_type || 'feats' === $achievement_type ) {
			$result['feats'] = array_slice( $feats, 0, $limit );
		}

		$result['success']  = true;
		$result['progress'] = $this->calculate_progress( $user_achievements_list, $feats );

		return $result;
	}

	/**
	 * Get achievement progress
	 *
	 * @return WP_Error|array Progress data or error.
	 */
	private function get_achievement_progress(): WP_Error|array {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$achievements    = $this->get_user_achievements_from_global( $current_user_id, 0 );
		$feats           = $this->get_user_feats_data( $current_user_id, 0 );

		return array(
			'success'  => true,
			'progress' => $this->calculate_progress( $achievements, $feats ),
		);
	}

	/**
	 * Get achievement statistics
	 *
	 * @return WP_Error|array Stats data or error.
	 */
	private function get_achievement_stats(): WP_Error|array {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$achievements    = $this->get_user_achievements_from_global( $current_user_id, 0 );
		$feats           = $this->get_user_feats_data( $current_user_id, 0 );

		$stats = array(
			'total_achievements' => count( $achievements ),
			'total_feats'        => count( $feats ),
			'highest_level'      => $this->get_highest_level( $achievements, $feats ),
			'recent_activity'    => $this->get_recent_achievement_activity( $current_user_id ),
		);

		return array(
			'success' => true,
			'stats'   => $stats,
		);
	}

	/**
	 * Get trophy case
	 *
	 * @return WP_Error|array Trophy case data or error.
	 */
	private function get_trophy_case(): WP_Error|array {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$achievements    = $this->get_user_achievements_from_global( $current_user_id, 0 );

		// Get featured badges (highest level achievements).
		$featured_badges = array_slice( $achievements, 0, 6 );

		return array(
			'success'     => true,
			'trophy_case' => array(
				'featured_badges' => $featured_badges,
				'badge_count'     => count( $achievements ),
				'showcase'        => $featured_badges,
			),
		);
	}

	/**
	 * Get user feats data
	 *
	 * @param array $input Input parameters.
	 *
	 * @return WP_Error|array Feats data or error.
	 */
	private function get_user_feats( array $input ): WP_Error|array {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$blog_id         = $input['blog_id'] ?? 0;
		$limit           = $input['limit'] ?? 20;

		$feats = $this->get_user_feats_data( $current_user_id, $blog_id );

		return array(
			'success' => true,
			'feats'   => array_slice( $feats, 0, $limit ),
			'total'   => count( $feats ),
		);
	}

	/**
	 * Get user achievements from global achievements array
	 *
	 * @param int $user_id User ID.
	 * @param int $blog_id Blog ID.
	 *
	 * @return array User achievements.
	 */
	private function get_user_achievements_from_global( int $user_id, int $blog_id ): array {
		global $achievements;
		$user_achievements = array();

		if ( ! is_array( $achievements ) ) {
			return $user_achievements;
		}

		foreach ( $achievements as $ach_id => $achievement_name ) {
			if ( function_exists( 'user_achieved' ) ) {
				$level = user_achieved( $ach_id, $user_id, $blog_id );
				if ( $level > 0 ) {
					$user_achievements[] = $this->format_achievement_data( $ach_id, $achievement_name, $level, $blog_id );
				}
			}
		}

		return $user_achievements;
	}

	/**
	 * Get user feats data
	 *
	 * @param int $user_id User ID.
	 * @param int $blog_id Blog ID.
	 *
	 * @return array User feats.
	 */
	private function get_user_feats_data( int $user_id, int $blog_id ): array {
		global $feats_list;
		$user_feats = array();

		if ( ! is_array( $feats_list ) ) {
			return $user_feats;
		}

		foreach ( $feats_list as $feat_id => $feat_name ) {
			if ( function_exists( 'user_achieved_feat' ) ) {
				$level = user_achieved_feat( $feat_id, $user_id, $blog_id );
				if ( $level > 0 ) {
					$user_feats[] = array(
						'id'          => $feat_id,
						'name'        => $feat_name,
						'level'       => $level,
						'best_level'  => $level,
						'achieved_at' => '', // Would need to query from database.
						'blog_id'     => $blog_id,
					);
				}
			}
		}

		return $user_feats;
	}

	/**
	 * Format achievement data
	 *
	 * @param int    $ach_id Achievement ID.
	 * @param string $achievement_name Achievement name.
	 * @param int    $level Achievement level.
	 * @param int    $blog_id Blog ID.
	 *
	 * @return array Formatted achievement data.
	 */
	private function format_achievement_data( int $ach_id, string $achievement_name, int $level, int $blog_id ): array {
		$extras = array();
		if ( function_exists( 'get_achievement_extras' ) ) {
			$extras = get_achievement_extras( $ach_id );
		}

		return array(
			'id'          => $ach_id,
			'name'        => $achievement_name,
			'badge_type'  => $extras['badge_type'] ?? ucfirst( str_replace( '_', ' ', $achievement_name ) ),
			'level'       => $level,
			'achieved_at' => '', // Would need to query from database.
			'blog_id'     => $blog_id,
			'description' => $extras['custom_msg'] ?? "Achieved {$achievement_name}",
		);
	}

	/**
	 * Calculate achievement progress
	 *
	 * @param array $achievements User achievements.
	 * @param array $feats User feats.
	 *
	 * @return array Progress data.
	 */
	private function calculate_progress( array $achievements, array $feats ): array {
		$total_achievements = count( $achievements );
		$total_feats        = count( $feats );
		$highest_level      = $this->get_highest_level( $achievements, $feats );

		return array(
			'total_achievements' => $total_achievements,
			'total_feats'        => $total_feats,
			'highest_level'      => $highest_level,
			'recent_activity'    => array(), // Would query recent achievements.
		);
	}

	/**
	 * Get highest achievement/feat level
	 *
	 * @param array $achievements User achievements.
	 * @param array $feats User feats.
	 *
	 * @return int Highest level achieved.
	 */
	private function get_highest_level( array $achievements, array $feats ): int {
		$highest = 0;

		foreach ( $achievements as $achievement ) {
			if ( $achievement['level'] > $highest ) {
				$highest = $achievement['level'];
			}
		}

		foreach ( $feats as $feat ) {
			if ( $feat['level'] > $highest ) {
				$highest = $feat['level'];
			}
		}

		return $highest;
	}

	/**
	 * Get recent achievement activity
	 *
	 * @param int $user_id User ID.
	 *
	 * @return array Recent activity.
	 */
	private function get_recent_achievement_activity( int $user_id ): array {
		// This would typically query the achievements table for recent entries
		// For now, return placeholder data.
		return array(
			array(
				'type'        => 'achievement',
				'name'        => 'blogger',
				'level'       => 1,
				'achieved_at' => gmdate( 'c', strtotime( '-1 week' ) ),
			),
		);
	}

	/**
	 * Validate action parameter
	 *
	 * @param string $action Action to validate.
	 * @param array  $allowed_actions Allowed actions.
	 *
	 * @return string|WP_Error Validated action or error.
	 */
	private function validate_action( string $action, array $allowed_actions ): string|WP_Error {
		if ( ! in_array( $action, $allowed_actions, true ) ) {
			return $this->create_error(
				'invalid_action',
				sprintf( 'Invalid action "%s". Allowed actions: %s', $action, implode( ', ', $allowed_actions ) )
			);
		}

		return $action;
	}

	/**
	 * Validate user is logged in
	 *
	 * @return WP_Error|null Error if validation fails, null if user is logged in.
	 */
	private function validate_user_logged_in(): ?WP_Error {
		if ( ! is_user_logged_in() ) {
			return $this->create_error(
				'user_not_authenticated',
				'User must be authenticated to access achievements'
			);
		}

		return null;
	}

	/**
	 * Get current user ID
	 *
	 * @return int Current user ID.
	 */
	private function get_current_user_id(): int {
		return get_current_user_id();
	}

	/**
	 * Check user permission
	 *
	 * @return bool True if user has permission, false otherwise.
	 */
	private function check_user_permission(): bool {
		return is_user_logged_in();
	}

	/**
	 * Create error response
	 *
	 * @param string $error_code Error code.
	 * @param string $message Error message.
	 * @param int    $status HTTP status code.
	 *
	 * @return WP_Error Error object.
	 */
	private function create_error( string $error_code, string $message, int $status = 400 ): WP_Error {
		return new WP_Error(
			$error_code,
			$message,
			array( 'status' => $status )
		);
	}
}
