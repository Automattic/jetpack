<?php
/**
 * Tests for Email_Log.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use WorDBless\InsertId;

/**
 * @covers \Automattic\Jetpack\Send\Email_Log
 */
#[CoversClass( Email_Log::class )]
class Email_Log_Test extends BaseTestCase {

	/**
	 * SQL the fake database saw, in order.
	 *
	 * @var string[]
	 */
	private $queries = array();

	/**
	 * Rows the fake database answers SELECTs with.
	 *
	 * @var array[]
	 */
	private $rows = array();

	/**
	 * Filters added by answer_with().
	 *
	 * @var \Closure[]
	 */
	private $extra_answers = array();

	/**
	 * Whether another request holds the upgrade lock.
	 *
	 * @var bool
	 */
	private $lock_held = false;

	/**
	 * Tables created so far, which DESCRIBE then finds, as a real database would.
	 *
	 * @var bool[]
	 */
	private $created = array();

	/**
	 * Whether the host refuses table changes: nothing is ever created.
	 *
	 * @var bool
	 */
	private $refuse_changes = false;

	/**
	 * Mark the table installed and answer queries from memory.
	 */
	public function set_up() {
		parent::set_up();
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		add_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10, 2 );
	}

	/**
	 * Remove the fake database.
	 */
	public function tear_down() {
		remove_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10 );
		foreach ( $this->extra_answers as $filter ) {
			remove_filter( 'wordbless_wpdb_query_results', $filter, 20 );
		}
		remove_all_filters( 'jetpack_send_log_retention_days' );
		remove_all_filters( 'jetpack_send_log_redact_patterns' );
		$this->created        = array();
		$this->refuse_changes = false;
		Settings::delete();
		delete_option( Stats::BACKFILL_OPTION );
		delete_option( Email_Log::FIELDS_BACKFILL_OPTION );
		parent::tear_down();
	}

	/**
	 * The fake database: records each query, bumps the insert id on INSERT, answers SELECTs.
	 *
	 * @param array  $results Default results.
	 * @param string $query   SQL.
	 * @return object[]
	 */
	public function answer( $results, $query ) {
		global $wpdb;
		$query           = $wpdb->remove_placeholder_escape( $query );
		$this->queries[] = $query;
		if ( 0 === stripos( $query, 'INSERT IGNORE' ) ) {
			$wpdb->rows_affected = $this->lock_held ? 0 : 1;
			return $results;
		}
		if ( $this->lock_held && 0 === stripos( $query, 'SELECT option_value' ) ) {
			return array( (object) array( 'option_value' => (string) time() ) );
		}
		if ( ! $this->refuse_changes && preg_match( '/^\s*CREATE TABLE `?(\w+)`?/i', $query, $table ) ) {
			$this->created[ $table[1] ] = true;
		}
		if ( preg_match( '/^\s*DESCRIBE `?(\w+)`?/i', $query, $table ) ) {
			return isset( $this->created[ $table[1] ] ) ? array( (object) array( 'Field' => 'resend_of' ) ) : $results;
		}
		if ( 0 === stripos( $query, 'INSERT' ) ) {
			InsertId::bump_and_get();
		}
		if ( false === strpos( $query, Email_Log::table_name() ) ) {
			return $results;
		}
		if ( false !== stripos( $query, 'COUNT(*)' ) ) {
			return array( (object) array( 'COUNT(*)' => (string) count( $this->rows ) ) );
		}
		if ( 0 === stripos( $query, 'SELECT' ) ) {
			return array_map( fn( $row ) => (object) $row, $this->rows );
		}
		return $results;
	}

	/**
	 * Answer queries containing a text with one row, ahead of the fake log.
	 *
	 * @param string $needle Text in the SQL.
	 * @param array  $row    Row.
	 */
	private function answer_with( $needle, array $row ) {
		$this->extra_answers[] = static function ( $results, $query ) use ( $needle, $row ) {
			return false !== strpos( $query, $needle ) ? array( (object) $row ) : $results;
		};
		add_filter( 'wordbless_wpdb_query_results', end( $this->extra_answers ), 20, 2 );
	}

	/**
	 * The last query on the log table whose SQL starts with a keyword.
	 *
	 * @param string $keyword SQL keyword.
	 * @return string
	 */
	private function last_query( $keyword ) {
		$matching = array_values( array_filter( $this->queries, fn( $query ) => 0 === stripos( $query, $keyword ) && false !== strpos( $query, Email_Log::table_name() ) ) );
		return (string) end( $matching );
	}

	public function test_insert_returns_the_new_row_id() {
		$id = Email_Log::insert(
			array(
				'recipients' => 'me@example.org',
				'subject'    => 'Hello',
				'status'     => Email_Log::STATUS_SENT,
				'source'     => 'test',
			)
		);

		$this->assertSame( InsertId::$id, $id );
		$this->assertStringContainsString( "'test'", $this->last_query( 'INSERT' ) );
	}

	public function test_insert_defaults_the_source_to_wp_mail() {
		Email_Log::insert( array( 'status' => Email_Log::STATUS_SENT ) );

		$this->assertStringContainsString( "'wp_mail'", $this->last_query( 'INSERT' ) );
	}

	public function test_insert_is_a_no_op_until_the_table_is_installed() {
		update_option( Email_Log::DB_VERSION_OPTION, '0' );

		$this->assertFalse( Email_Log::insert( array( 'status' => Email_Log::STATUS_SENT ) ) );
		$this->assertSame( '', $this->last_query( 'INSERT' ) );
	}

	public function test_update_changes_only_the_given_columns() {
		$this->assertTrue(
			Email_Log::update(
				42,
				array(
					'status'     => Email_Log::STATUS_SENT,
					'request_id' => 'req-9',
				)
			)
		);

		$sql = $this->last_query( 'UPDATE' );
		$this->assertStringContainsString( "`status` = 'sent'", $sql );
		$this->assertStringContainsString( "`request_id` = 'req-9'", $sql );
		$this->assertStringContainsString( '`id` = 42', $sql );
		$this->assertStringNotContainsString( '`subject`', $sql );
	}

	/**
	 * Updates that are refused before reaching the database.
	 *
	 * @return array[]
	 */
	public static function provide_refused_updates() {
		return array(
			'no id'          => array( 0, array( 'status' => 'sent' ), true ),
			'nothing to set' => array( 5, array( 'unknown' => 'x' ), true ),
			'not installed'  => array( 5, array( 'status' => 'sent' ), false ),
		);
	}

	/**
	 * @dataProvider provide_refused_updates
	 *
	 * @param int   $id        Row id.
	 * @param array $row       Columns.
	 * @param bool  $installed Whether the table is installed.
	 */
	#[DataProvider( 'provide_refused_updates' )]
	public function test_update_refuses_without_a_row_or_columns( $id, array $row, $installed ) {
		if ( ! $installed ) {
			update_option( Email_Log::DB_VERSION_OPTION, '0' );
		}

		$this->assertFalse( Email_Log::update( $id, $row ) );
		$this->assertSame( '', $this->last_query( 'UPDATE' ) );
	}

	/**
	 * Filters and the conditions both queries carry.
	 *
	 * @return array[]
	 */
	public static function provide_filters() {
		return array(
			'no filter'            => array( array(), 'WHERE 1=1 ORDER' ),
			'any of two status'    => array( array( 'status' => array( 'failed', 'fallback' ) ), "status IN ('failed','fallback')" ),
			'a plugin'             => array( array( 'origin' => array( 'plugin:shop' ) ), "origin IN ('plugin:shop')" ),
			'site emails, resends' => array( array( 'source' => array( 'wp_mail', 'resend' ) ), "source IN ('wp_mail','resend')" ),
			'custom days'          => array(
				array(
					'start_utc' => strtotime( '2026-10-01 07:00:00 UTC' ),
					'end_utc'   => '2026-10-20 07:00:00',
				),
				"created_at >= '2026-10-01 07:00:00' AND created_at < '2026-10-20 07:00:00'",
			),
		);
	}

	/**
	 * @dataProvider provide_filters
	 *
	 * @param array  $args     Query args.
	 * @param string $expected SQL fragment the page query carries.
	 */
	#[DataProvider( 'provide_filters' )]
	public function test_query_filters( array $args, $expected ) {
		$this->rows = array( array( 'id' => '7' ) );

		$page = Email_Log::query( $args + array( 'page' => 2, 'per_page' => 10 ) ); // phpcs:ignore WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound

		$this->assertSame( 1, $page['total'] );
		$this->assertFalse( $page['total_capped'] );
		$select = $this->last_query( 'SELECT id, created_at' );
		$this->assertStringContainsString( str_replace( ' ORDER', '', $expected ), $select );
		$this->assertStringContainsString( 'LIMIT 10 OFFSET 10', $select );
		$this->assertStringContainsString( 'from_email, reason, resend_of', $select );
	}

	public function test_the_older_positional_form_still_filters() {
		Email_Log::query( 1, 20, 'failed', 'wp_mail', '2026-10-12 07:00:00' );

		$this->assertStringContainsString( "status IN ('failed') AND source IN ('wp_mail') AND created_at >= '2026-10-12 07:00:00'", $this->last_query( 'SELECT id, created_at' ) );
	}

	/**
	 * Search terms and the LIKE value they become.
	 *
	 * @return array[]
	 */
	public static function provide_searches() {
		return array(
			'percent sign' => array( '50%', '%50\\%%' ),
			'underscore'   => array( 'a_b', '%a\\_b%' ),
			'apostrophe'   => array( "O'Brien", "%O'Brien%" ),
			'backslash'    => array( 'C:\\x', '%C:\\\\x%' ),
		);
	}

	/**
	 * @dataProvider provide_searches
	 *
	 * @param string $term Search.
	 * @param string $like The LIKE value in the SQL.
	 */
	#[DataProvider( 'provide_searches' )]
	public function test_search_escapes_like_wildcards( $term, $like ) {
		Email_Log::query(
			array(
				'search'   => $term,
				'per_page' => 20,
			)
		);

		$this->assertStringContainsString( "( subject LIKE '{$like}' OR recipients LIKE '{$like}' OR from_email LIKE '{$like}' OR other_addresses LIKE '{$like}' OR body_text LIKE '{$like}' )", $this->last_query( 'SELECT id, created_at' ) );
	}

	/**
	 * How many rows match the filters and the search, and what the page says.
	 *
	 * @return array[]
	 */
	public static function provide_search_caps() {
		return array(
			'few rows'              => array( 300, 12, true, 12, false ),
			'too many to read'      => array( 20001, 12, false, 12, false ),
			'more than 1,000 match' => array( 300, 1001, true, 1000, true ),
		);
	}

	/**
	 * @dataProvider provide_search_caps
	 *
	 * @param int  $filtered Rows the filters match (the pre-count).
	 * @param int  $matching Rows the search matches (the capped total).
	 * @param bool $text     Whether email text was searched.
	 * @param int  $total    Total reported.
	 * @param bool $capped   Whether the total was capped.
	 */
	#[DataProvider( 'provide_search_caps' )]
	public function test_search_counts_stop_early( $filtered, $matching, $text, $total, $capped ) {
		$this->extra_answers[] = static function ( $results, $query ) use ( $filtered, $matching ) {
			if ( false !== strpos( $query, 'SELECT COUNT(*) FROM ( SELECT 1' ) ) {
				return array( (object) array( 'n' => (string) ( false !== strpos( $query, 'LIKE' ) ? $matching : $filtered ) ) );
			}
			return $results;
		};
		add_filter( 'wordbless_wpdb_query_results', end( $this->extra_answers ), 20, 2 );

		$page = Email_Log::query( array( 'search' => 'jordan' ) );

		$this->assertSame( $text, $page['searched_text'] );
		$this->assertSame( $total, $page['total'] );
		$this->assertSame( $capped, $page['total_capped'] );
		$this->assertStringContainsString( 'LIMIT 20001 ) counted', $this->queries[ count( $this->queries ) - 3 ] );
		$this->assertStringContainsString( 'LIMIT 1001 ) counted', $this->last_query( 'SELECT COUNT(*)' ) );
		$this->assertSame( $text, false !== strpos( $this->last_query( 'SELECT id, created_at' ), 'body_text LIKE' ) );
	}

	/**
	 * Searches too short to use.
	 *
	 * @return array[]
	 */
	public static function provide_short_searches() {
		return array(
			'one character'      => array( 'a' ),
			'control characters' => array( "\t\n" ),
		);
	}

	/**
	 * @dataProvider provide_short_searches
	 *
	 * @param string $term Search.
	 */
	#[DataProvider( 'provide_short_searches' )]
	public function test_a_search_under_two_characters_searches_nothing( $term ) {
		Email_Log::query( array( 'search' => $term ) );

		$this->assertStringNotContainsString( 'LIKE', $this->last_query( 'SELECT id, created_at' ) );
	}

	public function test_before_the_upgrade_search_covers_subjects_and_recipients_only() {
		update_option( Email_Log::DB_VERSION_OPTION, '3' );

		$page = Email_Log::query( array( 'search' => 'jordan' ) );

		$this->assertFalse( $page['searched_text'] );
		$this->assertStringContainsString( "( subject LIKE '%jordan%' OR recipients LIKE '%jordan%' )", $this->last_query( 'SELECT id, created_at' ) );
	}

	public function test_delete_removes_the_rows_that_exist_and_clears_the_cached_stats() {
		set_transient( Email_Log::STATS_TRANSIENT . '7', array( 'max_id' => 9 ), HOUR_IN_SECONDS );
		$this->rows = array( array( 'id' => '3' ), array( 'id' => '5' ) );

		// @phan-suppress-next-line PhanTypeMismatchArgument -- Mixed and bad ids are the point of the test.
		$result = Email_Log::delete( array( 5, '3', 3, 0, -2, 9 ) );

		$this->assertSame( array( 5, 3 ), $result['deleted'] );
		$this->assertSame( array( 9 ), $result['missing'] );
		$this->assertStringContainsString( 'WHERE id IN (5,3,9)', $this->last_query( 'DELETE' ) );
		$this->assertFalse( get_transient( Email_Log::STATS_TRANSIENT . '7' ) );
	}

	/**
	 * Deletes that never reach the database.
	 *
	 * @return array[]
	 */
	public static function provide_empty_deletes() {
		return array(
			'no valid ids'  => array( array( 0, -1 ), true ),
			'not installed' => array( array( 4 ), false ),
		);
	}

	/**
	 * @dataProvider provide_empty_deletes
	 *
	 * @param array $ids       Ids.
	 * @param bool  $installed Whether the table is installed.
	 */
	#[DataProvider( 'provide_empty_deletes' )]
	public function test_delete_does_nothing_without_ids_or_a_table( array $ids, $installed ) {
		if ( ! $installed ) {
			update_option( Email_Log::DB_VERSION_OPTION, '0' );
		}

		$this->assertSame( array(), Email_Log::delete( $ids )['deleted'] );
		$this->assertSame( '', $this->last_query( 'DELETE' ) );
	}

	public function test_this_months_count_takes_every_sent_email_tests_included() {
		Email_Log::sent_counts( '2026-10-01 07:00:00' );

		$sql = $this->last_query( 'SELECT' );
		$this->assertStringContainsString( "created_at >= '2026-10-01 07:00:00'", $sql );
		$this->assertStringContainsString( "status = 'sent'", $sql );
		$this->assertStringNotContainsString( "source <> 'test'", $sql );
	}

	public function test_history_skips_tests_and_stops_at_the_first_site_email() {
		$this->assertFalse( Email_Log::has_history() );
		$sql = $this->last_query( 'SELECT' );
		$this->assertStringContainsString( "source <> 'test'", $sql );
		$this->assertStringContainsString( 'LIMIT 1', $sql );

		$this->rows = array( array( '1' => '1' ) );
		$this->assertTrue( Email_Log::has_history() );

		update_option( Email_Log::DB_VERSION_OPTION, '0' );
		$this->assertFalse( Email_Log::has_history() );
	}

	public function test_query_is_empty_until_the_table_is_installed() {
		update_option( Email_Log::DB_VERSION_OPTION, '0' );

		$this->assertSame( array(), Email_Log::query( 1, 20, '', 'test' )['items'] );
		$this->assertSame( '', $this->last_query( 'SELECT' ) );
	}

	public function test_upgrading_from_v3_adds_columns_and_tables_without_deleting_anything() {
		update_option( Email_Log::DB_VERSION_OPTION, '3' );
		$this->answer_with( 'MAX(id)', array( 'v' => '120' ) );

		Email_Log::maybe_install();

		$sql = implode( "\n", $this->queries );
		foreach ( array( 'body_text text NULL', "reason varchar(32) NOT NULL DEFAULT ''", 'KEY origin_created (origin,created_at)', 'CREATE TABLE ' . Stats::table_name(), 'CREATE TABLE ' . Debug_Log::table_name() ) as $part ) {
			$this->assertStringContainsString( $part, $sql );
		}
		$this->assertDoesNotMatchRegularExpression( '/\b(DROP|DELETE FROM `wp_jetpack|TRUNCATE)\b/i', $sql );
		$this->assertSame( '4', get_option( Email_Log::DB_VERSION_OPTION ) );
		$this->assertSame( 120, Stats::backfill_state()['until_id'] );
		$this->assertSame( 'hourly', wp_get_scheduled_event( Email_Log::PRUNE_HOOK )->schedule );
	}

	/**
	 * The version before, the settings saved, and the retention after the upgrade.
	 *
	 * @return array[]
	 */
	public static function provide_retention_upgrades() {
		return array(
			'an existing log'            => array( '3', null, 30 ),
			'other settings saved'       => array( '3', array( 'fallback' => false ), 30 ),
			'a retention already chosen' => array( '3', array( 'log_retention_days' => 90 ), 90 ),
			'a new install'              => array( '', null, null ),
		);
	}

	/**
	 * @dataProvider provide_retention_upgrades
	 *
	 * @param string     $previous Stored version.
	 * @param array|null $saved    Settings saved before the upgrade.
	 * @param int|null   $expected Stored retention after it; null when none is stored.
	 */
	#[DataProvider( 'provide_retention_upgrades' )]
	public function test_sites_that_had_a_log_keep_30_days( $previous, $saved, $expected ) {
		update_option( Email_Log::DB_VERSION_OPTION, $previous );
		if ( $saved ) {
			Settings::update( $saved );
		}

		Email_Log::maybe_install();

		$this->assertSame( $expected, Settings::stored()['log_retention_days'] ?? null );
		$this->assertSame( $expected ?? 7, Email_Log::retention_days() );
	}

	public function test_another_request_upgrading_leaves_this_one_on_the_old_schema() {
		update_option( Email_Log::DB_VERSION_OPTION, '3' );
		$this->lock_held = true;

		Email_Log::maybe_install();

		$this->assertSame( array(), preg_grep( '/CREATE TABLE/', $this->queries ) );
		$this->assertTrue( Email_Log::is_installed() );
		$this->assertFalse( Email_Log::has_v4_schema() );
	}

	public function test_on_the_old_schema_nothing_new_is_written() {
		update_option( Email_Log::DB_VERSION_OPTION, '3' );
		Settings::update(
			array(
				'debug_log'       => true,
				'debug_log_until' => gmdate( 'Y-m-d\\TH:i:s\\Z', time() + HOUR_IN_SECONDS ),
			)
		);

		Email_Log::insert(
			array(
				'status'    => 'failed',
				'reason'    => 'lockdown',
				'detail'    => array( 'v' => 1 ),
				'resend_of' => 3,
				'message'   => array( 'body' => 'Hi' ),
			)
		);
		Stats::add( time(), 'failed', 'wp_mail', '' );
		Debug_Log::add( 'error', 'sending', 'mail.failed', 'Not sent.' );

		$this->assertStringNotContainsString( 'reason', $this->last_query( 'INSERT' ) );
		$this->assertStringNotContainsString( 'body_text', $this->last_query( 'INSERT' ) );
		$this->assertSame( array(), preg_grep( '/wp_jetpack_send_(stats|debug)/', $this->queries ) );
		// A log from before the setting kept 30 days.
		$this->assertSame( 30, Email_Log::retention_days() );
	}

	public function test_the_site_code_sets_the_retention_over_the_setting() {
		Settings::update( array( 'log_retention_days' => 365 ) );
		add_filter( 'jetpack_send_log_retention_days', fn() => 14 );

		$this->assertSame( 14, Email_Log::retention_days() );
		$this->assertTrue( Email_Log::retention_locked() );
	}

	public function test_search_columns_come_from_the_stored_message() {
		Email_Log::insert(
			array(
				'status'  => 'sent',
				'message' => array(
					'from'         => array( 'email' => 'hello@example.com' ),
					'reply_to'     => array( 'email' => 'help@example.com' ),
					'cc'           => array( array( 'email' => 'boss@example.org' ) ),
					'bcc'          => array( array( 'email' => 'audit@example.org' ) ),
					'content_type' => 'text/html',
					'body'         => '<p>Order <b>1048</b> is on its way.</p>',
				),
			)
		);

		$insert = $this->last_query( 'INSERT' );
		$this->assertStringContainsString( "'hello@example.com', 'boss@example.org,audit@example.org,help@example.com', 'Order 1048 is on its way.'", $insert );
	}

	public function test_the_text_copy_is_cut_on_a_character_boundary() {
		// The fake database can't take non-ASCII through wpdb::insert(), so check the cut itself.
		$cut_bytes = new \ReflectionMethod( Email_Log::class, 'cut_bytes' );
		if ( PHP_VERSION_ID < 80100 ) {
			$cut_bytes->setAccessible( true );
		}
		$cut = $cut_bytes->invoke( null, str_repeat( 'é', 3000 ) . str_repeat( '😀', 4000 ), Email_Log::BODY_TEXT_BYTES );

		$this->assertLessThanOrEqual( Email_Log::BODY_TEXT_BYTES, strlen( $cut ) );
		$this->assertGreaterThan( Email_Log::BODY_TEXT_BYTES - 4, strlen( $cut ) );
		$this->assertTrue( mb_check_encoding( $cut, 'UTF-8' ) );
	}

	/**
	 * Bodies with sign-in links, and what the stored copy keeps.
	 *
	 * @return array[]
	 */
	public static function provide_links() {
		return array(
			'password reset'    => array( 'https://x.example/wp-login.php?action=rp&key=AbC123&login=jo', 'https://x.example/wp-login.php?action=rp&key=[removed]&login=jo' ),
			'HTML ampersands'   => array( '<a href="https://x.example/wp-login.php?login=jo&amp;key=AbC123&amp;action=rp">', '<a href="https://x.example/wp-login.php?login=jo&amp;key=[removed]&amp;action=rp">' ),
			'recovery mode'     => array( 'https://x.example/wp-login.php?action=enter_recovery_mode&rm_token=T1&rm_key=K1', 'https://x.example/wp-login.php?action=enter_recovery_mode&rm_token=[removed]&rm_key=[removed]' ),
			'privacy request'   => array( 'https://x.example/wp-login.php?action=confirmaction&request_id=4&confirm_key=K9', 'https://x.example/wp-login.php?action=confirmaction&request_id=4&confirm_key=[removed]' ),
			'new admin email'   => array( 'https://x.example/wp-admin/options.php?adminhash=H7', 'https://x.example/wp-admin/options.php?adminhash=[removed]' ),
			'new user email'    => array( 'https://x.example/wp-admin/profile.php?newuseremail=H8', 'https://x.example/wp-admin/profile.php?newuseremail=[removed]' ),
			'activation'        => array( 'https://x.example/wp-activate.php?key=A1', 'https://x.example/wp-activate.php?key=[removed]' ),
			'data export'       => array( 'https://x.example/wp-content/uploads/wp-personal-data-exports/wp-personal-data-file-abc.zip', 'https://x.example/wp-content/uploads/wp-personal-data-exports/[removed]' ),
			'store reset'       => array( 'https://shop.example/my-account/lost-password/?key=K2&#038;id=7&#038;login=jo', 'https://shop.example/my-account/lost-password/?key=[removed]&#038;id=7&#038;login=jo' ),
			'store new account' => array( 'https://shop.example/my-account/lost-password/?action=newaccount&key=K3&login=jo', 'https://shop.example/my-account/lost-password/?action=newaccount&key=[removed]&login=jo' ),
			'store order link'  => array( 'https://shop.example/order-received/12/?key=wc_order_abc', 'https://shop.example/order-received/12/?key=wc_order_abc' ),
		);
	}

	/**
	 * @dataProvider provide_links
	 *
	 * @param string $body     Body.
	 * @param string $expected Stored body.
	 */
	#[DataProvider( 'provide_links' )]
	public function test_redact_links( $body, $expected ) {
		$this->assertSame( $expected, Email_Log::redact_links( $body ) );
	}

	public function test_a_stripped_copy_is_marked_and_a_site_can_add_patterns() {
		add_filter( 'jetpack_send_log_redact_patterns', fn() => array( '/magic=([a-z0-9]+)/' ) );

		Email_Log::insert(
			array(
				'status'  => 'sent',
				'message' => array( 'body' => 'https://x.example/?magic=abc123' ),
			)
		);

		$this->assertStringContainsString( '"body":"https://x.example/?magic=[removed]","redacted":true', $this->last_query( 'INSERT' ) );
	}

	/**
	 * Bodies the link pattern must treat exactly as the old one did.
	 *
	 * @return array[]
	 */
	public static function provide_link_bodies() {
		return array(
			'a reset link'            => array( 'Reset: https://shop.example/wp-login.php?action=rp&key=AbC123&login=jo now.' ),
			'two links'               => array( '<a href="https://a.example/?x=1">a</a> and (https://b.example/wp-activate.php?key=zz)' ),
			'a ? at the end of a run' => array( 'Ready? Go to https://a.example/page? and https://b.example/?ok=1' ),
			'several ? in one run'    => array( 'https://a.example/?a=1?b=2&adminhash=secret' ),
			'no link'                 => array( 'Thanks for your order.' ),
		);
	}

	/**
	 * @dataProvider provide_link_bodies
	 *
	 * @param string $body Body.
	 */
	#[DataProvider( 'provide_link_bodies' )]
	public function test_links_are_found_as_before( $body ) {
		$old = (string) preg_replace_callback(
			'#[^\s"\'<>()]*\?[^\s"\'<>()]+#',
			function ( $match ) {
				return '<' . $match[0] . '>';
			},
			$body
		);
		$new = (string) preg_replace_callback(
			'#(?<![^\s"\'<>()])[^\s"\'<>()?]*+\?[^\s"\'<>()]+#',
			function ( $match ) {
				return '<' . $match[0] . '>';
			},
			$body
		);

		$this->assertSame( $old, $new );
	}

	/**
	 * In its own process, so the pattern is compiled after JIT is off: one compiled earlier keeps its
	 * JIT code. The low backtrack limit makes a pattern that backtracks fail rather than just run slow.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_large_inline_image_doesnt_slow_the_send_without_pcre_jit() {
		ini_set( 'pcre.jit', '0' ); // phpcs:ignore WordPress.PHP.IniSet.Risky -- The slow path is the one being tested, in its own process.
		ini_set( 'pcre.backtrack_limit', '10000' ); // phpcs:ignore WordPress.PHP.IniSet.Risky -- Its own process.
		$body    = '<img src="data:image/png;base64,' . str_repeat( 'iVBORw0KGgo', 9310 ) . '"> Reset: https://shop.example/wp-login.php?action=rp&key=AbC123&login=jo';
		$started = microtime( true );

		$redacted = Email_Log::redact_links( $body );

		$this->assertLessThan( 1.0, microtime( true ) - $started );
		$this->assertStringContainsString( 'key=[removed]', $redacted );
		$this->assertStringStartsWith( '<img src="data:image/png;base64,iVBORw0KGgo', $redacted );
	}

	public function test_the_hourly_job_is_put_back_when_it_went_missing() {
		wp_clear_scheduled_hook( Email_Log::PRUNE_HOOK );
		Email_Log::init();

		Email_Log::ensure_scheduled();

		$this->assertNotFalse( has_action( 'admin_init', array( Email_Log::class, 'ensure_scheduled' ) ) );
		$this->assertSame( 'hourly', wp_get_scheduled_event( Email_Log::PRUNE_HOOK )->schedule );
	}

	public function test_a_refused_upgrade_keeps_the_old_version_and_waits_an_hour_to_try_again() {
		update_option( Email_Log::DB_VERSION_OPTION, '3' );
		$this->refuse_changes = true;

		Email_Log::maybe_install();
		$this->assertSame( '3', get_option( Email_Log::DB_VERSION_OPTION ) );
		$this->assertTrue( Email_Log::is_installed() );
		$this->assertFalse( Email_Log::has_v4_schema() );

		$this->queries = array();
		Email_Log::maybe_install();
		$this->assertSame( array(), preg_grep( '/CREATE TABLE/', $this->queries ) );
		delete_transient( Email_Log::UPGRADE_RETRY_TRANSIENT );
	}

	public function test_the_backfill_strips_sign_in_links_from_an_older_rows_stored_copy() {
		update_option( Email_Log::FIELDS_BACKFILL_OPTION, 0 );
		Stats::start_backfill( 5 );
		$this->rows = array(
			array(
				'id'      => '1',
				'bytes'   => '120',
				'message' => wp_json_encode( array( 'body' => 'Reset: https://shop.example/wp-login.php?action=rp&key=AbC123&login=jo' ), JSON_UNESCAPED_SLASHES ),
			),
		);

		Email_Log::backfill_batch();

		$update = (string) current( preg_grep( '/^UPDATE `' . preg_quote( Email_Log::table_name(), '/' ) . '`/', $this->queries ) );
		$this->assertStringContainsString( 'key=[removed]', $update );
		$this->assertStringContainsString( '"redacted":true', $update );
		$this->assertStringNotContainsString( 'AbC123', $update );
	}

	public function test_the_backfill_reads_at_most_8_mb_of_bodies_a_run() {
		update_option( Email_Log::FIELDS_BACKFILL_OPTION, 0 );
		Stats::start_backfill( 5 );
		$big        = array(
			'bytes'   => '5000000',
			'message' => '{"body":"Hi"}',
		);
		$this->rows = array( array( 'id' => '1' ) + $big, array( 'id' => '2' ) + $big, array( 'id' => '3' ) + $big );

		Email_Log::backfill_batch();

		$read = array_values( preg_grep( '/SELECT id, message FROM/', $this->queries ) );
		$this->assertMatchesRegularExpression( '/LIMIT 1$/', trim( $read[0] ) );
	}

	public function test_prune_deletes_in_batches_and_leaves_rows_the_backfill_hasnt_counted() {
		update_option(
			Stats::BACKFILL_OPTION,
			array(
				'until_id' => 500,
				'cursor'   => 200,
				'done'     => false,
			)
		);
		Settings::update( array( 'log_retention_days' => 7 ) );
		$this->rows = array( array( 'id' => '3' ), array( 'id' => '4' ) );

		$result = Email_Log::prune( 10 );

		$this->assertSame(
			array(
				'deleted'   => 2,
				'remaining' => 0,
			),
			$result
		);
		$select = $this->last_query( 'SELECT id FROM' );
		$this->assertStringContainsString( "created_at < '" . gmdate( 'Y-m-d H', time() - 7 * DAY_IN_SECONDS ), $select );
		$this->assertStringContainsString( 'AND ( id <= 200 OR id > 500 ) ORDER BY id LIMIT 1000', $select );
		$this->assertStringContainsString( 'WHERE id IN (3,4)', $this->last_query( 'DELETE' ) );
	}

	public function test_keeping_emails_forever_prunes_nothing() {
		Settings::update( array( 'log_retention_days' => 0 ) );

		$this->assertSame( 0, Email_Log::prune()['deleted'] );
		$this->assertSame( '', $this->last_query( 'SELECT' ) );
	}

	public function test_the_summary_counts_with_the_prunes_cutoffs() {
		$now = strtotime( '2026-10-19 12:00:00 UTC' );
		$this->answer_with(
			'AS total',
			array(
				'total'  => '1284',
				'oldest' => '2026-10-12 09:00:00',
				'd1'     => '1200',
				'd7'     => '3',
				'd30'    => '0',
				'd90'    => '0',
				'd180'   => '0',
				'd365'   => '0',
			)
		);

		$summary = Email_Log::summary( $now );

		$this->assertSame( 1284, $summary['total'] );
		$this->assertSame( '2026-10-12T09:00:00Z', $summary['oldest_at'] );
		$this->assertSame( 3, $summary['older_than']['7'] );
		$this->assertStringContainsString( "SUM( CASE WHEN created_at < '2026-10-12 12:00:00' THEN 1 ELSE 0 END ) AS d7", $this->last_query( 'SELECT' ) );
	}

	public function test_admin_page_loads_only_add_and_fill_never_delete() {
		update_option( Email_Log::FIELDS_BACKFILL_OPTION, 0 );
		Stats::start_backfill( 5 );
		$this->rows = array(
			array(
				'id'         => '1',
				'created_at' => '2026-10-18 09:00:00',
				'status'     => 'sent',
				'source'     => 'wp_mail',
				'origin'     => '',
				'message'    => '{"body":"Hi","content_type":"text/plain"}',
			),
		);
		Send::init();
		$callbacks = array( array( Stats::class, 'backfill_batch' ), array( Email_Log::class, 'backfill_batch' ), array( Debug_Log::class, 'expire_if_due' ) );
		foreach ( $callbacks as $callback ) {
			$this->assertNotFalse( has_action( 'admin_init', $callback ) );
			call_user_func( $callback );
		}

		$this->assertSame( array(), preg_grep( '/^\s*(DELETE FROM `wp_jetpack|DROP|TRUNCATE)/i', $this->queries ) );
		$this->assertStringContainsString( 'LIMIT 200', implode( "\n", preg_grep( '/SELECT id, LENGTH\(message\)/', $this->queries ) ) );
		$this->assertNotEmpty( preg_grep( '/^UPDATE `' . preg_quote( Email_Log::table_name(), '/' ) . '` SET `from_email`/', $this->queries ) );
		$this->assertFalse( has_action( 'init', array( Email_Log::class, 'backfill_batch' ) ) );
	}

	public function test_uninstall_drops_every_table_and_option() {
		update_option( Email_Log::FIELDS_BACKFILL_OPTION, 0 );
		update_option( Resend::TIMES_OPTION, array( time() ) );
		Stats::start_backfill( 5 );
		set_transient( Email_Log::UPGRADE_RETRY_TRANSIENT, 1, HOUR_IN_SECONDS );
		set_transient( Debug_Log::SEEN_PREFIX . 'usage', '203/-1', DAY_IN_SECONDS );
		set_transient( REST_Controller::CHECK_DNS_THROTTLE, time(), MINUTE_IN_SECONDS );

		Send::uninstall();

		$sql = implode( "\n", $this->queries );
		foreach ( array( Email_Log::table_name(), Stats::table_name(), Debug_Log::table_name() ) as $table ) {
			$this->assertStringContainsString( "DROP TABLE IF EXISTS `{$table}`", $sql );
		}
		$this->assertStringContainsString( "LIKE 'jetpack\\_send\\_lock\\_%'", $sql );
		foreach ( array( Email_Log::DB_VERSION_OPTION, Email_Log::FIELDS_BACKFILL_OPTION, Email_Log::STATS_GEN_OPTION, Resend::TIMES_OPTION, Stats::BACKFILL_OPTION, Settings::OPTION ) as $option ) {
			$this->assertFalse( get_option( $option ), $option );
		}
		$this->assertFalse( wp_next_scheduled( Email_Log::PRUNE_HOOK ) );
		$this->assertFalse( get_transient( Email_Log::UPGRADE_RETRY_TRANSIENT ) );
		$this->assertFalse( get_transient( Debug_Log::SEEN_PREFIX . 'usage' ) );
		$this->assertFalse( get_transient( REST_Controller::CHECK_DNS_THROTTLE ) );
	}

	public function test_insert_truncates_the_origin_to_its_column() {
		Email_Log::insert(
			array(
				'status' => Email_Log::STATUS_SENT,
				'origin' => 'plugin:' . str_repeat( 'a', 120 ),
			)
		);

		$this->assertStringContainsString( "'plugin:" . str_repeat( 'a', 93 ) . "'", $this->last_query( 'INSERT' ) );
	}

	public function test_the_table_installs_on_init_so_front_end_emails_are_logged() {
		Email_Log::init();

		$this->assertNotFalse( has_action( 'init', array( Email_Log::class, 'maybe_install' ) ) );
	}

	/**
	 * The stored schema version before an install.
	 *
	 * @return array[]
	 */
	public static function provide_previous_versions() {
		return array(
			'first install' => array( null ),
			'upgrade'       => array( '2' ),
		);
	}

	/**
	 * @dataProvider provide_previous_versions
	 *
	 * @param string|null $previous Stored version, or null for none.
	 */
	#[DataProvider( 'provide_previous_versions' )]
	public function test_install_autoloads_the_version_so_the_check_on_init_costs_no_query( $previous ) {
		global $wpdb;
		if ( null === $previous ) {
			delete_option( Email_Log::DB_VERSION_OPTION );
		} else {
			update_option( Email_Log::DB_VERSION_OPTION, $previous );
		}
		$this->queries = array();

		Email_Log::maybe_install();

		$writes = array_values(
			array_filter(
				$this->queries,
				fn( $query ) => 1 === preg_match( '/^\s*(INSERT|UPDATE)/i', $query ) && false !== strpos( $query, $wpdb->options ) && false !== strpos( $query, Email_Log::DB_VERSION_OPTION )
			)
		);
		$this->assertNotEmpty( $writes );
		$this->assertStringContainsString( "'on'", end( $writes ) );
		$this->assertSame( Email_Log::DB_VERSION, get_option( Email_Log::DB_VERSION_OPTION ) );
	}
}
