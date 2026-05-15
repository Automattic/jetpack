<?php
/**
 * MailPoet Recipient Validator.
 *
 * @package wpcomsh
 */

/**
 * Validates email recipients against the MailPoet email suppression table.
 *
 * Hard bounces expire after BOUNCE_EXPIRY_DAYS days since their latest hit.
 * Only recent hard bounces (within the expiry window) are treated as active.
 */
class WPCOMSH_MailPoet_Recipient_Validator {

	/**
	 * Number of days after which a hard bounce is no longer considered active,
	 * measured from the latest_hit timestamp (falling back to suppressed_at).
	 */
	const BOUNCE_EXPIRY_DAYS = 14;

	/**
	 * Returns whether the given hashed email is a known active hard bouncer.
	 *
	 * A hard bounce is considered active only if its latest_hit (or suppressed_at
	 * as fallback when latest_hit is NULL) occurred within the last BOUNCE_EXPIRY_DAYS days.
	 *
	 * @param string   $hashed_email     MD5 hash of the email address.
	 * @param int|null $mailpoet_user_id Optional MailPoet user ID to scope the check.
	 *                                   When null, checks across all users.
	 * @return bool True if the email is a known active hard bouncer, false otherwise.
	 */
	public function is_known_hard_bouncer( string $hashed_email, ?int $mailpoet_user_id = null ): bool {
		global $wpdb;

		$expiry_date = gmdate( 'Y-m-d H:i:s', strtotime( '-' . self::BOUNCE_EXPIRY_DAYS . ' days' ) );
		$table       = $wpdb->prefix . 'mailpoet_email_suppression';

		if ( $mailpoet_user_id !== null ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$result = $wpdb->get_var(
				$wpdb->prepare(
					// COALESCE falls back to suppressed_at when latest_hit has not yet been set.
					"SELECT 1 FROM `{$table}`
					WHERE hashed_recipient = %s
					  AND mailpoet_user_id = %d
					  AND suppression_type = 'hard'
					  AND COALESCE(latest_hit, suppressed_at) > %s
					LIMIT 1",
					$hashed_email,
					$mailpoet_user_id,
					$expiry_date
				)
			);
		} else {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$result = $wpdb->get_var(
				$wpdb->prepare(
					// COALESCE falls back to suppressed_at when latest_hit has not yet been set.
					"SELECT 1 FROM `{$table}`
					WHERE hashed_recipient = %s
					  AND suppression_type = 'hard'
					  AND COALESCE(latest_hit, suppressed_at) > %s
					LIMIT 1",
					$hashed_email,
					$expiry_date
				)
			);
		}

		return (bool) $result;
	}
}
