<?php
/**
 * WPCOMSH_MailPoet_Recipient_Validator Test file.
 *
 * @package wpcomsh
 */

require_once __DIR__ . '/../mailpoet/class-mailpoet-recipient-validator.php';

/**
 * Tests for WPCOMSH_MailPoet_Recipient_Validator.
 */
class MailPoetRecipientValidatorTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The validator under test.
	 *
	 * @var WPCOMSH_MailPoet_Recipient_Validator
	 */
	private $validator;

	/**
	 * Name of the suppression table (including prefix).
	 *
	 * @var string
	 */
	private $table;

	/**
	 * Set up: create the suppression table and validator instance.
	 */
	public function set_up(): void {
		parent::set_up();

		global $wpdb;

		$this->table     = $wpdb->prefix . 'mailpoet_email_suppression';
		$this->validator = new WPCOMSH_MailPoet_Recipient_Validator();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.SchemaChange
		$wpdb->query(
			"CREATE TABLE IF NOT EXISTS `{$this->table}` (
				mailpoet_email_suppression_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				mailpoet_user_id              BIGINT UNSIGNED NOT NULL DEFAULT 0,
				hashed_recipient              VARCHAR(32)     NOT NULL,
				suppression_type              VARCHAR(16)     NOT NULL,
				dsndiag                       TEXT            NOT NULL DEFAULT '',
				suppressed_at                 DATETIME        NOT NULL,
				latest_hit                    DATETIME        NULL,
				PRIMARY KEY (mailpoet_email_suppression_id),
				UNIQUE KEY uniq_user_recipient (mailpoet_user_id, hashed_recipient)
			)"
		);
	}

	/**
	 * Tear down: drop the suppression table.
	 */
	public function tear_down(): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.SchemaChange
		$wpdb->query( "DROP TABLE IF EXISTS `{$this->table}`" );

		parent::tear_down();
	}

	/**
	 * Helper: insert a suppression record.
	 *
	 * @param int         $user_id         MailPoet user ID.
	 * @param string      $hashed_email    MD5-hashed email.
	 * @param string      $type            Suppression type ('hard' or 'complaint').
	 * @param string      $suppressed_at   ISO datetime string.
	 * @param string|null $latest_hit      ISO datetime string, or null.
	 */
	private function insert_suppression( int $user_id, string $hashed_email, string $type, string $suppressed_at, ?string $latest_hit = null ): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->insert(
			$this->table,
			array(
				'mailpoet_user_id' => $user_id,
				'hashed_recipient' => $hashed_email,
				'suppression_type' => $type,
				'dsndiag'          => '',
				'suppressed_at'    => $suppressed_at,
				'latest_hit'       => $latest_hit,
			)
		);
	}

	// -----------------------------------------------------------------------
	// is_known_hard_bouncer — basic cases
	// -----------------------------------------------------------------------

	/**
	 * A hard bounce whose latest_hit is within 14 days is active.
	 */
	public function test_recent_hard_bounce_is_active(): void {
		$hash = md5( 'test@example.com' );
		$this->insert_suppression( 1, $hash, 'hard', '2026-04-01 00:00:00', '2026-05-14 12:00:00' );

		$this->assertTrue( $this->validator->is_known_hard_bouncer( $hash, 1 ) );
	}

	/**
	 * A hard bounce whose latest_hit is older than 14 days is expired.
	 */
	public function test_expired_hard_bounce_is_not_active(): void {
		$hash = md5( 'old@example.com' );
		// latest_hit is 30 days before today (2026-05-15), so it's expired.
		$this->insert_suppression( 1, $hash, 'hard', '2026-03-01 00:00:00', '2026-04-15 00:00:00' );

		$this->assertFalse( $this->validator->is_known_hard_bouncer( $hash, 1 ) );
	}

	/**
	 * When latest_hit is NULL, suppressed_at is used as the fallback timestamp.
	 * A hard bounce whose suppressed_at is within 14 days is active.
	 */
	public function test_falls_back_to_suppressed_at_when_latest_hit_is_null(): void {
		$hash = md5( 'fallback@example.com' );
		$this->insert_suppression( 1, $hash, 'hard', '2026-05-10 00:00:00', null );

		$this->assertTrue( $this->validator->is_known_hard_bouncer( $hash, 1 ) );
	}

	/**
	 * When latest_hit is NULL and suppressed_at is older than 14 days, the bounce is expired.
	 */
	public function test_expired_when_latest_hit_null_and_old_suppressed_at(): void {
		$hash = md5( 'old-fallback@example.com' );
		$this->insert_suppression( 1, $hash, 'hard', '2026-03-01 00:00:00', null );

		$this->assertFalse( $this->validator->is_known_hard_bouncer( $hash, 1 ) );
	}

	/**
	 * Complaints (non-hard suppressions) are never treated as hard bounces.
	 */
	public function test_complaint_is_not_a_hard_bounce(): void {
		$hash = md5( 'complainer@example.com' );
		$this->insert_suppression( 1, $hash, 'complaint', '2026-05-14 00:00:00', '2026-05-14 12:00:00' );

		$this->assertFalse( $this->validator->is_known_hard_bouncer( $hash, 1 ) );
	}

	/**
	 * An unknown email address is not a hard bouncer.
	 */
	public function test_unknown_email_is_not_a_hard_bouncer(): void {
		$this->assertFalse( $this->validator->is_known_hard_bouncer( md5( 'nobody@example.com' ), 1 ) );
	}

	// -----------------------------------------------------------------------
	// is_known_hard_bouncer — user-scoping
	// -----------------------------------------------------------------------

	/**
	 * A hard bounce belonging to a different user is not returned when querying with a specific user ID.
	 */
	public function test_hard_bounce_scoped_to_different_user_is_not_returned(): void {
		$hash = md5( 'scoped@example.com' );
		$this->insert_suppression( 2, $hash, 'hard', '2026-05-14 00:00:00', '2026-05-14 12:00:00' );

		$this->assertFalse( $this->validator->is_known_hard_bouncer( $hash, 1 ) );
	}

	/**
	 * Without a user_id filter, a hard bounce from any user is returned.
	 */
	public function test_omitting_user_id_checks_all_users(): void {
		$hash = md5( 'any-user@example.com' );
		$this->insert_suppression( 99, $hash, 'hard', '2026-05-14 00:00:00', '2026-05-14 12:00:00' );

		$this->assertTrue( $this->validator->is_known_hard_bouncer( $hash ) );
	}

	/**
	 * Without a user_id filter, an expired bounce from any user is still not returned.
	 */
	public function test_omitting_user_id_still_respects_expiry(): void {
		$hash = md5( 'expired-any@example.com' );
		$this->insert_suppression( 99, $hash, 'hard', '2026-01-01 00:00:00', '2026-01-01 00:00:00' );

		$this->assertFalse( $this->validator->is_known_hard_bouncer( $hash ) );
	}
}
