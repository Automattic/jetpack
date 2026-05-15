<?php
/**
 * WPCOMSH_MailPoet_Suppression_Manager Test file.
 *
 * @package wpcomsh
 */

require_once __DIR__ . '/../mailpoet/class-mailpoet-suppression-manager.php';

/**
 * Tests for WPCOMSH_MailPoet_Suppression_Manager.
 */
class MailPoetSuppressionManagerTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The suppression manager under test.
	 *
	 * @var WPCOMSH_MailPoet_Suppression_Manager
	 */
	private $manager;

	/**
	 * Name of the suppression table (including prefix).
	 *
	 * @var string
	 */
	private $table;

	/**
	 * Set up: create the suppression table and manager instance.
	 */
	public function set_up(): void {
		parent::set_up();

		global $wpdb;

		$this->table   = $wpdb->prefix . 'mailpoet_email_suppression';
		$this->manager = new WPCOMSH_MailPoet_Suppression_Manager();

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
	 * Helper: fetch a single row from the suppression table.
	 *
	 * @param int    $user_id      MailPoet user ID.
	 * @param string $hashed_email MD5-hashed email.
	 * @return array<string,mixed>|null Row data or null.
	 */
	private function get_row( int $user_id, string $hashed_email ): ?array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM `{$this->table}` WHERE mailpoet_user_id = %d AND hashed_recipient = %s",
				$user_id,
				$hashed_email
			),
			ARRAY_A
		);
	}

	// -----------------------------------------------------------------------
	// upsert_hard_bounce — insert
	// -----------------------------------------------------------------------

	/**
	 * Inserting a new hard bounce populates both suppressed_at and latest_hit.
	 */
	public function test_new_hard_bounce_sets_both_timestamps(): void {
		$hash   = md5( 'new@example.com' );
		$result = $this->manager->upsert_hard_bounce( 1, $hash, 'smtp;550 No such user' );

		$this->assertTrue( $result );

		$row = $this->get_row( 1, $hash );
		$this->assertNotNull( $row );
		$this->assertSame( 'hard', $row['suppression_type'] );
		$this->assertSame( 'smtp;550 No such user', $row['dsndiag'] );
		$this->assertNotNull( $row['suppressed_at'] );
		$this->assertNotNull( $row['latest_hit'] );
	}

	/**
	 * suppressed_at and latest_hit are the same timestamp for a brand-new record.
	 */
	public function test_new_record_suppressed_at_equals_latest_hit(): void {
		$hash = md5( 'new2@example.com' );
		$this->manager->upsert_hard_bounce( 1, $hash );

		$row = $this->get_row( 1, $hash );
		$this->assertSame( $row['suppressed_at'], $row['latest_hit'] );
	}

	// -----------------------------------------------------------------------
	// upsert_hard_bounce — update (ON DUPLICATE KEY)
	// -----------------------------------------------------------------------

	/**
	 * A subsequent bounce for the same address updates latest_hit but NOT suppressed_at.
	 */
	public function test_duplicate_bounce_only_updates_latest_hit(): void {
		global $wpdb;

		$hash = md5( 'repeat@example.com' );

		// Insert the original record with a known suppressed_at.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->insert(
			$this->table,
			array(
				'mailpoet_user_id' => 1,
				'hashed_recipient' => $hash,
				'suppression_type' => 'hard',
				'dsndiag'          => 'original diag',
				'suppressed_at'    => '2026-01-01 00:00:00',
				'latest_hit'       => '2026-01-01 00:00:00',
			)
		);

		// Simulate a second bounce event coming in later (mkhb).
		$this->manager->upsert_hard_bounce( 1, $hash, 'new diag' );

		$row = $this->get_row( 1, $hash );

		// suppressed_at must remain the original value.
		$this->assertSame( '2026-01-01 00:00:00', $row['suppressed_at'] );

		// latest_hit must be updated to a more recent time.
		$this->assertGreaterThan( '2026-01-01 00:00:00', $row['latest_hit'] );

		// dsndiag must also remain unchanged (it is not part of the ON DUPLICATE KEY clause).
		$this->assertSame( 'original diag', $row['dsndiag'] );
	}

	/**
	 * Records for different users are stored independently.
	 */
	public function test_different_users_stored_independently(): void {
		$hash = md5( 'shared@example.com' );

		$this->manager->upsert_hard_bounce( 1, $hash );
		$this->manager->upsert_hard_bounce( 2, $hash );

		$this->assertNotNull( $this->get_row( 1, $hash ) );
		$this->assertNotNull( $this->get_row( 2, $hash ) );
	}
}
