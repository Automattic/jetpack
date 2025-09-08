<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\ValidationHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use Likes;
use Notification_Builders_v1_1;
use Notification_Helpers_v1_1;
use WP_Error;
use WPCOM_Reblogging;

/**
 * User Notifications Inbox Executor Class
 *
 * Handles execution logic for user notifications inbox ability
 */
class UserNotificationsInboxExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user notifications inbox ability.
	 *
	 * @param array $input The input parameters.
	 * @return WP_Error|array The notifications data or error.
	 */
	public function execute( array $input = array()  {
		try {
			$action = ValidationHelper::validate_action(
				$input['action'] ?? 'list',
				array( 'list', 'get_summary' )
			);

			if ( is_wp_error( $action ) ) {
				return $action;
			}

			return match ( $action ) {
				'list' => $this->list_notifications( $input ),
				'get_summary' => $this->get_notifications_summary( $input ),
				default => $this->create_error( 'invalid_action', 'Invalid action specified' ),
			};
		} catch ( Exception $e ) {
			return $this->create_error(
				'notifications_inbox_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user notifications inbox ability.
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
	 * List user notifications
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array Notifications list or error.
	 */
	private function list_notifications( array $input  {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();

		// Validate and sanitize input parameters.
		$limit       = min( max( 1, $input['limit'] ?? 20 ), 100 );
		$unread_only = $input['unread_only'] ?? false;
		$type        = $input['type'] ?? null;
		$since       = isset( $input['since'] ) ? (int) $input['since'] : null;
		$before      = isset( $input['before'] ) ? (int) $input['before'] : null;

		// Check if notes_get function is available.
		if ( ! function_exists( 'notes_get' ) ) {
			return $this->create_error(
				'notes_unavailable',
				'Notifications system is not available',
				503
			);
		}

		// Build arguments for notes_get.
		$notes_args = array(
			'user_id' => $current_user_id,
			'limit'   => $limit + 10, // Get extra to account for filtered out notes.
			'include' => array( 'subject', 'body', 'type', 'noticon' ), // Force generation of these properties.
		);

		if ( $unread_only ) {
			$notes_args['unread'] = true;
		}

		if ( ! empty( $type ) ) {
			$notes_args['type'] = $type;
		}

		if ( ! empty( $since ) ) {
			$notes_args['since'] = $since;
		}

		if ( ! empty( $before ) ) {
			$notes_args['before'] = $before;
		}

		try {
			$raw_notes = notes_get( $notes_args );

			if ( ! is_array( $raw_notes ) ) {
				return array(
					'success'       => true,
					'notifications' => array(),
					'total'         => 0,
					'has_more'      => false,
				);
			}

			$formatted_notifications = array();
			$count                   = 0;

			foreach ( $raw_notes as $note ) {
				if ( $count >= $limit ) {
					break;
				}

				$formatted_note = $this->format_notification( $note );
				if ( $formatted_note ) {
					$formatted_notifications[] = $formatted_note;
					++$count;
				}
			}

			return array(
				'success'       => true,
				'notifications' => $formatted_notifications,
				'total'         => count( $formatted_notifications ),
				'has_more'      => count( $raw_notes ) > $limit,
			);

		} catch ( Exception $e ) {
			return $this->create_error(
				'notes_fetch_error',
				'Failed to fetch notifications: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Get notifications summary
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array Summary data or error.
	 */
	private function get_notifications_summary( array $input = array()  {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();

		if ( ! function_exists( 'notes_get' ) ) {
			return $this->create_error(
				'notes_unavailable',
				'Notifications system is not available',
				503
			);
		}

		try {
			// Get unread notifications.
			$unread_notes = notes_get(
				array(
					'user_id' => $current_user_id,
					'unread'  => true,
					'limit'   => 100,
					'include' => array( 'subject', 'body', 'type', 'noticon' ),
				)
			);

			$unread_count = is_array( $unread_notes ) ? count( $unread_notes ) : 0;

			// Get recent notifications for type breakdown.
			$recent_notes = notes_get(
				array(
					'user_id' => $current_user_id,
					'limit'   => 50,
					'include' => array( 'subject', 'body', 'type', 'noticon' ),
				)
			);

			$types_breakdown     = array();
			$latest_timestamp    = 0;
			$total_notifications = 0;

			if ( is_array( $recent_notes ) ) {
				$total_notifications = count( $recent_notes );

				foreach ( $recent_notes as $note ) {
					if ( isset( $note->timestamp ) && $note->timestamp > $latest_timestamp ) {
						$latest_timestamp = $note->timestamp;
					}

					$note_type = $this->map_callback_to_readable_type( $note->callback ?? 'unknown' );
					if ( $note_type ) {
						$types_breakdown[ $note_type ] = ( $types_breakdown[ $note_type ] ?? 0 ) + 1;
					}
				}
			}

			return array(
				'success' => true,
				'summary' => array(
					'total_notifications' => $total_notifications,
					'unread_count'        => $unread_count,
					'latest_timestamp'    => $latest_timestamp,
					'types_breakdown'     => $types_breakdown,
				),
			);

		} catch ( Exception $e ) {
			return $this->create_error(
				'summary_fetch_error',
				'Failed to fetch notifications summary: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Format a notification object for API response
	 *
	 * @param object $note The WP_Note object.
	 *
	 * @return array|null Formatted notification or null if invalid.
	 */
	private function format_notification( object $note ): ?array {
		if ( ! is_object( $note ) || ! isset( $note->id ) ) {
			return null;
		}

		// Try to build the note using the v1.1 builders if available.
		$built_note = $this->build_note_with_v1_1( $note );
		if ( $built_note ) {
			$note_subject = $built_note->subject ?? null;
			$note_body    = $built_note->body ?? null;
			$note_type    = $built_note->type ?? $note->callback;
			$note_noticon = $built_note->noticon ?? 'generic';
		} else {
			// Fallback: Force note building by accessing dynamic properties.
			try {
				$note_subject = $note->subject;
				$note_body    = $note->body;
				$note_type    = $note->type;
				$note_noticon = $note->noticon;
			} catch ( Exception $e ) {
				// If note building fails, log the error and continue with basic data.
				$note_subject = null;
				$note_body    = null;
				$note_type    = $note->callback ?? 'unknown';
				$note_noticon = 'generic';
			}
		}

		// Get basic note properties.
		$formatted = array(
			'id'        => (int) $note->id,
			'user_id'   => (int) $note->user_id,
			'user_name' => $this->get_user_name( $note ),
			'unread'    => (bool) $note->unread,
			'mute'      => (bool) ( $note->mute ?? false ),
			'timestamp' => (int) $note->timestamp,
			'time_iso'  => gmdate( 'c', $note->timestamp ),
			'type'      => $this->map_callback_to_readable_type( $note_type ),
			'noticon'   => $note_noticon ? $note_noticon : 'generic',
		);

		// Get subject information.
		$formatted['subject'] = $this->format_note_subject( $note_subject );

		// Get body information.
		$formatted['body'] = $this->format_note_body( $note_body );

		// Get metadata.
		$formatted['meta'] = $this->get_note_meta( $note );

		return $formatted;
	}

	/**
	 * Get actor user name from note object (the user who triggered the notification)
	 *
	 * @param object $note The note object.
	 *
	 * @return string Actor user name.
	 */
	private function get_user_name( object $note ): string {
		$callback = $note->callback ?? 'unknown';

		// Handle specific notification types with direct approaches.
		switch ( $callback ) {
			case 'gen_liked_note':
			case 'gen_liked_comment_note':
				return $this->get_liker_name( $note );

			case 'gen_followed_note':
				return $this->get_follower_name( $note );

			case 'gen_commented_note':
			case 'gen_commented_note_pingback':
				return $this->get_commenter_name( $note );

			case 'gen_reblog_note':
				return $this->get_reblogger_name( $note );

			case 'gen_new_post_note':
				return $this->get_post_author_name( $note );

			case 'WP_Note_Automattcher':
				return $this->get_mention_author_name( $note );
		}

		// Try to get actor from note-specific properties (after subject/body access).
		$actor_user_id = $this->get_actor_from_note_properties( $note );
		if ( $actor_user_id ) {
			$user = get_user_by( 'ID', $actor_user_id );
			if ( $user ) {
				return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
			}
		}

		// Try to extract actor user ID from args.
		$actor_user_id = $this->get_actor_user_id_from_args( $note );
		if ( $actor_user_id ) {
			$user = get_user_by( 'ID', $actor_user_id );
			if ( $user ) {
				return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
			}
		}

		// Try to extract actor name from the processed subject.
		$actor_name = $this->extract_actor_name_from_subject( $note );
		if ( $actor_name ) {
			return $actor_name;
		}

		// Try to extract actor name from the processed body.
		$actor_name = $this->extract_actor_name_from_body( $note );
		if ( $actor_name ) {
			return $actor_name;
		}

		// Fallback: return empty string if no actor found.
		return '';
	}

	/**
	 * Get actor user ID from note-specific properties (like likers, followers, etc.)
	 *
	 * @param object $note The note object.
	 *
	 * @return int|null Actor user ID or null if not found.
	 */
	private function get_actor_from_note_properties( object $note ): ?int {
		// For like notifications, check the likers property.
		if ( ! empty( $note->likers ) && is_array( $note->likers ) ) {
			// Return the most recent liker (first in the array).
			return (int) $note->likers[0];
		}

		// For follow notifications, we need to check the followers dynamically.
		$note_callback = $note->callback ?? '';
		if ( 'gen_followed_note' === $note_callback && isset( $note->args['blog_id'] ) ) {
			$blog_id = (int) $note->args['blog_id'];
			if ( $blog_id > 0 && function_exists( 'wpcom_subs_get_wpcom_subscribers_of_blog' ) ) {
				$followers = wpcom_subs_get_wpcom_subscribers_of_blog( array( 'blog_id' => $blog_id ) );
				if ( ! empty( $followers ) && is_array( $followers ) ) {
					// Return the most recent follower.
					return (int) $followers[0]->user_id;
				}
			}
		}

		// For reblog notifications, check rebloggers.
		if ( ! empty( $note->rebloggers ) && is_array( $note->rebloggers ) ) {
			return (int) $note->rebloggers[0];
		}

		// For comment notifications, try to get the comment author.
		if ( str_contains( $note->callback ?? '', 'comment' ) && isset( $note->args['comment_id'] ) ) {
			$comment_id = (int) $note->args['comment_id'];
			$blog_id    = (int) ( $note->args['blog_id'] ?? 0 );

			if ( $comment_id > 0 && $blog_id > 0 ) {
				switch_to_blog( $blog_id );
				$comment = get_comment( $comment_id );
				restore_current_blog();

				if ( $comment && $comment->user_id ) {
					return (int) $comment->user_id;
				}
			}
		}

		return null;
	}

	/**
	 * Get actor user ID from note args
	 *
	 * @param object $note The note object.
	 *
	 * @return int|null Actor user ID or null if not found.
	 */
	private function get_actor_user_id_from_args( object $note ): ?int {
		if ( ! isset( $note->args ) || ! is_array( $note->args ) ) {
			return null;
		}

		// Check for common actor user ID fields in args.
		$actor_fields = array(
			'requesting_user_id',
			'actor_user_id',
			'from_user_id',
			'user_id', // Sometimes the actor is stored as user_id in args.
		);

		foreach ( $actor_fields as $field ) {
			if ( isset( $note->args[ $field ] ) && $note->args[ $field ] > 0 ) {
				return (int) $note->args[ $field ];
			}
		}

		return null;
	}

	/**
	 * Extract actor name from note subject
	 *
	 * @param object $note The note object.
	 *
	 * @return string|null Actor name or null if not found.
	 */
	private function extract_actor_name_from_subject( object $note ): ?string {
		$subject = $note->subject;
		if ( ! $subject || ! is_array( $subject ) ) {
			return null;
		}

		$subject_text = $subject['text'] ?? '';
		if ( empty( $subject_text ) ) {
			return null;
		}

		// Extract name patterns from common notification types.
		$patterns = array(
			// "John Doe liked your post"
			'/^([^,]+?)\s+liked\s+your/',
			// "John Doe followed your blog"
			'/^([^,]+?)\s+followed\s+your/',
			// "John Doe commented on your post"
			'/^([^,]+?)\s+commented\s+on\s+your/',
			// "John Doe mentioned you"
			'/^([^,]+?)\s+mentioned\s+you/',
			// "John Doe reblogged your post"
			'/^([^,]+?)\s+reblogged\s+your/',
			// Generic pattern for single actor.
			'/^([^,]+?)\s+(liked|followed|commented|mentioned|reblogged)/',
		);

		foreach ( $patterns as $pattern ) {
			if ( preg_match( $pattern, $subject_text, $matches ) ) {
				$name = trim( $matches[1] );
				// Filter out common non-name words.
				if ( ! in_array( strtolower( $name ), array( 'someone', 'a person', 'user' ), true ) ) {
					return $name;
				}
			}
		}

		return null;
	}

	/**
	 * Extract actor name from note body
	 *
	 * @param object $note The note object.
	 *
	 * @return string|null Actor name or null if not found.
	 */
	private function extract_actor_name_from_body( object $note ): ?string {
		$body = $note->body;
		if ( ! $body || ! is_array( $body ) ) {
			return null;
		}

		// Check body items for actor information.
		if ( ! empty( $body['items'] ) && is_array( $body['items'] ) ) {
			$first_item = $body['items'][0];
			if ( isset( $first_item['html'] ) ) {
				// Extract name from HTML content.
				if ( preg_match( '/<a[^>]*>([^<]+)<\/a>/', $first_item['html'], $matches ) ) {
					return trim( wp_strip_all_tags( $matches[1] ) );
				}
			}
		}

		return null;
	}

	/**
	 * Map callback to readable type
	 *
	 * @param string $callback_or_type The callback or type.
	 *
	 * @return string Readable type.
	 */
	private function map_callback_to_readable_type( string $callback_or_type ): string {
		if ( empty( $callback_or_type ) ) {
			return 'unknown';
		}

		// If it's already a mapped type, return it.
		$mapped_types = array( 'like', 'follow', 'comment', 'mention', 'achievement', 'store_order', 'reblog', 'trophy' );
		if ( in_array( $callback_or_type, $mapped_types, true ) ) {
			return $callback_or_type;
		}

		// Map callback to readable type using the helper function.
		if ( class_exists( 'Notification_Helpers_v1_1' ) ) {
			$type = Notification_Helpers_v1_1::map_callback_to_type( $callback_or_type );
			if ( $type ) {
				return $type;
			}
		}

		// Manual mapping for common types.
		$manual_mapping = array(
			'gen_liked_note'                  => 'like',
			'gen_followed_note'               => 'follow',
			'gen_commented_note'              => 'comment',
			'gen_liked_comment_note'          => 'comment_like',
			'gen_reblog_note'                 => 'reblog',
			'WP_Note_Automattcher'            => 'mention',
			'gen_new_post_note'               => 'new_post',
			'gen_store_order_note'            => 'store_order',
			'achieve_automattician_note'      => 'achievement',
			'achieve_followed_milestone_note' => 'achievement',
			'achieve_likeable_blog_note'      => 'achievement',
		);

		return $manual_mapping[ $callback_or_type ] ?? $callback_or_type;
	}

	/**
	 * Format note subject information
	 *
	 * @param mixed $note_subject The note subject data.
	 * @return array Subject information.
	 */
	private function format_note_subject( mixed $note_subject ): array {
		$subject = array(
			'text' => '',
			'html' => '',
			'icon' => '',
		);

		if ( $note_subject ) {
			if ( is_array( $note_subject ) ) {
				$subject['text'] = $note_subject['text'] ?? '';
				$subject['html'] = $note_subject['html'] ?? '';
				$subject['icon'] = $note_subject['icon'] ?? '';
			} elseif ( is_object( $note_subject ) ) {
				$subject['text'] = $note_subject->text ?? '';
				$subject['html'] = $note_subject->html ?? '';
				$subject['icon'] = $note_subject->icon ?? '';
			} elseif ( is_string( $note_subject ) ) {
				$subject['text'] = $note_subject;
				$subject['html'] = $note_subject;
			}
		}

		return $subject;
	}

	/**
	 * Format note body information
	 *
	 * @param mixed $note_body The note body data.
	 * @return array Body information.
	 */
	private function format_note_body( mixed $note_body ): array {
		$body = array(
			'text' => '',
			'html' => '',
		);

		if ( $note_body ) {
			if ( is_array( $note_body ) ) {
				$body['text'] = $note_body['text'] ?? '';
				$body['html'] = $note_body['html'] ?? '';
			} elseif ( is_object( $note_body ) ) {
				$body['text'] = $note_body->text ?? '';
				$body['html'] = $note_body->html ?? '';
			} elseif ( is_string( $note_body ) ) {
				$body['text'] = $note_body;
				$body['html'] = $note_body;
			}
		}

		return $body;
	}

	/**
	 * Get note metadata
	 *
	 * @param object $note The note object.
	 *
	 * @return array Metadata.
	 */
	private function get_note_meta( object $note ): array {
		$meta = array(
			'blog_id'    => 0,
			'blog_name'  => '',
			'blog_url'   => '',
			'post_id'    => 0,
			'post_title' => '',
			'post_url'   => '',
		);

		if ( isset( $note->args ) && is_array( $note->args ) ) {
			$meta['blog_id'] = (int) ( $note->args['blog_id'] ?? 0 );
			$meta['post_id'] = (int) ( $note->args['post_id'] ?? 0 );

			// Try to get blog information.
			if ( $meta['blog_id'] > 0 ) {
				if ( function_exists( 'get_blog_details' ) ) {
					$blog_details = get_blog_details( $meta['blog_id'] );
					if ( $blog_details ) {
						$meta['blog_name'] = $blog_details->blogname ?? '';
						$meta['blog_url']  = $blog_details->siteurl ?? '';
					}
				}
				// Fallback to args if available.
				if ( empty( $meta['blog_name'] ) ) {
					$meta['blog_name'] = $note->args['blog_name'] ?? '';
				}
				if ( empty( $meta['blog_url'] ) ) {
					$meta['blog_url'] = $note->args['blog_url'] ?? '';
				}
			}

			// Try to get post information.
			if ( $meta['post_id'] > 0 && $meta['blog_id'] > 0 ) {
				if ( function_exists( 'get_blog_post' ) ) {
					$post = get_blog_post( $meta['blog_id'], $meta['post_id'] );
					if ( $post ) {
						$meta['post_title'] = $post->post_title ?? '';
						$meta['post_url']   = get_blog_permalink( $meta['blog_id'], $meta['post_id'] ) ?? '';
					}
				}
				// Fallback to args if available.
				if ( empty( $meta['post_title'] ) ) {
					$meta['post_title'] = $note->args['post_title'] ?? '';
				}
				if ( empty( $meta['post_url'] ) ) {
					$meta['post_url'] = $note->args['post_url'] ?? '';
				}
			}
		}

		return $meta;
	}

	/**
	 * Get liker name for like notifications
	 *
	 * @param object $note The note object.
	 *
	 * @return string Liker name.
	 */
	private function get_liker_name( object $note ): string {
		if ( ! isset( $note->args['blog_id'], $note->args['post_id'] ) ) {
			return '';
		}

		$blog_id = (int) $note->args['blog_id'];
		$post_id = (int) $note->args['post_id'];

		if ( ! class_exists( 'Likes' ) ) {
			return '';
		}

		// Get the most recent liker.
		$likers = Likes::user_ids_for_post(
			$blog_id,
			$post_id,
			array(
				'chronological' => true,
				'number'        => 1,
			)
		);
		if ( ! empty( $likers ) && is_array( $likers ) ) {
			$user = get_user_by( 'ID', $likers[0] );
			if ( $user ) {
				return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
			}
		}

		return '';
	}

	/**
	 * Get follower name for follow notifications
	 *
	 * @param object $note The note object.
	 *
	 * @return string Follower name.
	 */
	private function get_follower_name( object $note ): string {
		if ( ! isset( $note->args['blog_id'] ) ) {
			return '';
		}

		$blog_id = (int) $note->args['blog_id'];

		if ( function_exists( 'wpcom_subs_get_wpcom_subscribers_of_blog' ) ) {
			$followers = wpcom_subs_get_wpcom_subscribers_of_blog( array( 'blog_id' => $blog_id ) );
			if ( ! empty( $followers ) && is_array( $followers ) ) {
				$user = get_user_by( 'ID', $followers[0]->user_id );
				if ( $user ) {
					return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
				}
			}
		}

		return '';
	}

	/**
	 * Get commenter name for comment notifications
	 *
	 * @param object $note The note object.
	 *
	 * @return string Commenter name.
	 */
	private function get_commenter_name( object $note ): string {
		if ( ! isset( $note->args['comment_id'], $note->args['blog_id'] ) ) {
			return '';
		}

		$comment_id = (int) $note->args['comment_id'];
		$blog_id    = (int) $note->args['blog_id'];

		switch_to_blog( $blog_id );
		$comment = get_comment( $comment_id );
		restore_current_blog();

		if ( $comment && $comment->user_id ) {
			$user = get_user_by( 'ID', $comment->user_id );
			if ( $user ) {
				return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
			}
		} elseif ( $comment && ! empty( $comment->comment_author ) ) {
			return $comment->comment_author;
		}

		return '';
	}

	/**
	 * Get reblogger name for reblog notifications
	 *
	 * @param object $note The note object.
	 *
	 * @return string Reblogger name.
	 */
	private function get_reblogger_name( object $note ): string {
		if ( ! isset( $note->args['blog_id'], $note->args['post_id'] ) ) {
			return '';
		}

		$blog_id = (int) $note->args['blog_id'];
		$post_id = (int) $note->args['post_id'];

		if ( class_exists( 'WPCOM_Reblogging' ) ) {
			$rebloggers = WPCOM_Reblogging::get_reblog_user_ids_for_post(
				array(
					'blog_id'       => $blog_id,
					'post_id'       => $post_id,
					'chronological' => true,
				)
			);
			if ( ! empty( $rebloggers ) && is_array( $rebloggers ) ) {
				$user = get_user_by( 'ID', end( $rebloggers ) ); // Most recent reblogger.
				if ( $user ) {
					return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
				}
			}
		}

		return '';
	}

	/**
	 * Get post author name for new post notifications
	 *
	 * @param object $note The note object.
	 *
	 * @return string Post author name.
	 */
	private function get_post_author_name( object $note ): string {
		if ( ! isset( $note->args['blog_id'], $note->args['post_id'] ) ) {
			return '';
		}

		$blog_id = (int) $note->args['blog_id'];
		$post_id = (int) $note->args['post_id'];

		switch_to_blog( $blog_id );
		$post = get_post( $post_id );
		restore_current_blog();

		if ( $post && $post->post_author ) {
			$user = get_user_by( 'ID', $post->post_author );
			if ( $user ) {
				return ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
			}
		}

		return '';
	}

	/**
	 * Get mention author name for mention notifications
	 *
	 * @param object $note The note object.
	 *
	 * @return string Mention author name.
	 */
	private function get_mention_author_name( object $note ): string {
		// For mentions, try to get the author from the post/comment context.
		if ( isset( $note->args['comment_id'] ) ) {
			return $this->get_commenter_name( $note );
		} elseif ( isset( $note->args['post_id'] ) ) {
			return $this->get_post_author_name( $note );
		}

		return '';
	}

	/**
	 * Build note using v1.1 notification builders
	 *
	 * @param object $note The note object.
	 *
	 * @return object|null Built note or null if building fails.
	 */
	private function build_note_with_v1_1( object $note ): ?object {
		if ( ! class_exists( 'Notification_Builders_v1_1' ) ) {
			return null;
		}

		try {
			require_lib( 'notes/class.notification-builders-v1-1' );

			// Set the current user to the note recipient for proper building.
			$current_user_id = get_current_user_id();
			wp_set_current_user( $note->user_id );

			$built_notes = Notification_Builders_v1_1::build_notes_by_ids( $note->id );

			// Restore original user.
			wp_set_current_user( $current_user_id );

			if ( ! empty( $built_notes ) && is_array( $built_notes ) ) {
				return $built_notes[0];
			}
		} catch ( Exception ) {
			// Restore original user on error.
			if ( isset( $current_user_id ) ) {
				wp_set_current_user( $current_user_id );
			}
		}

		return null;
	}
}
