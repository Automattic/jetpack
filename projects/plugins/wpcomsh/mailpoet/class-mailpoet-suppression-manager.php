<?php
/**
 * MailPoet Suppression Manager.
 *
 * @package wpcomsh
 */

/**
 * Manages hard bounce suppressions in the MailPoet email suppression table.
 *
 * When recording a hard bounce for an address that already exists in the table,
 * only latest_hit is updated — suppressed_at and other timestamps are preserved.
 * This ensures the original suppression timestamp is never overwritten by
 * subsequent bounce events (e.g. mkhb calls from email-worker).
 */
class WPCOMSH_MailPoet_Suppression_Manager {

	/**
	 * Inserts or updates a hard bounce suppression record.
	 *
	 * For new records: sets both suppressed_at and latest_hit to the current time.
	 * For existing records (identified by the unique mailpoet_user_id + hashed_recipient
	 * combination): only updates latest_hit, leaving suppressed_at and dsndiag unchanged.
	 *
	 * @param int    $mailpoet_user_id MailPoet user ID (0 for global scope).
	 * @param string $hashed_email     MD5 hash of the email address.
	 * @param string $dsndiag          Optional DSN diagnostic string from the bounce.
	 * @return bool True on success, false on failure.
	 */
	public function upsert_hard_bounce( int $mailpoet_user_id, string $hashed_email, string $dsndiag = '' ): bool {
		global $wpdb;

		$table = $wpdb->prefix . 'mailpoet_email_suppression';
		$now   = gmdate( 'Y-m-d H:i:s' );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->query(
			$wpdb->prepare(
				// On duplicate key (mailpoet_user_id + hashed_recipient), only update latest_hit.
				// suppressed_at, dsndiag, and other fields are intentionally left unchanged so
				// the original suppression record is preserved across subsequent bounce events.
				"INSERT INTO `{$table}` (mailpoet_user_id, hashed_recipient, suppression_type, dsndiag, suppressed_at, latest_hit)
				VALUES (%d, %s, 'hard', %s, %s, %s)
				ON DUPLICATE KEY UPDATE latest_hit = VALUES(latest_hit)",
				$mailpoet_user_id,
				$hashed_email,
				$dsndiag,
				$now,
				$now
			)
		);

		return $result !== false;
	}
}
