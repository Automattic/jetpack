<?php
/**
 * Tests for Debug_Log.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\InsertId;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Send\Debug_Log
 */
#[CoversClass( Debug_Log::class )]
class Debug_Log_Test extends BaseTestCase {

	const CANARY_KEY   = 'jpsend-canary-K3y9f2Q7xw';
	const CANARY_TOKEN = 'jpsendCanaryCfToken_8f3kQ2mZ7wX4vT9pL1nR';

	/**
	 * SQL the fake database saw.
	 *
	 * @var string[]
	 */
	private $queries = array();

	/**
	 * Rows SELECTs on the debug table get.
	 *
	 * @var array[]
	 */
	private $rows = array();

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * Schema 4, and a fake database.
	 */
	public function set_up() {
		parent::set_up();
		wp_cache_flush();
		update_option( Email_Log::DB_VERSION_OPTION, '4' );
		add_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10, 2 );
	}

	/**
	 * Remove the fake database, the mock and settings.
	 */
	public function tear_down() {
		remove_filter( 'wordbless_wpdb_query_results', array( $this, 'answer' ), 10 );
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		Settings::delete();
		Account::delete();
		parent::tear_down();
	}

	/**
	 * The fake database.
	 *
	 * @param array  $results Default results.
	 * @param string $query   SQL.
	 * @return array
	 */
	public function answer( $results, $query ) {
		global $wpdb;
		$this->queries[] = $wpdb->remove_placeholder_escape( $query );
		if ( 0 === stripos( $query, 'INSERT' ) ) {
			InsertId::bump_and_get();
		}
		if ( false !== strpos( $query, Debug_Log::table_name() ) && 0 === stripos( $query, 'SELECT' ) ) {
			if ( false !== strpos( $query, 'COUNT(*)' ) && ! isset( $this->rows[0]['COUNT(*)'] ) ) {
				return array( (object) array( 'n' => (string) count( $this->rows ) ) );
			}
			return array_map( fn( $row ) => (object) $row, $this->rows );
		}
		return $results;
	}

	/**
	 * Turn it on until a time.
	 *
	 * @param int $until Unix time.
	 */
	private static function turn_on_until( $until ) {
		Settings::update(
			array(
				'debug_log'       => true,
				'debug_log_until' => gmdate( 'Y-m-d\\TH:i:s\\Z', $until ),
			)
		);
	}

	/**
	 * Inserts into the debug table.
	 *
	 * @return string[]
	 */
	private function entries() {
		return array_values( array_filter( $this->queries, fn( $query ) => 0 === stripos( $query, 'INSERT INTO `' . Debug_Log::table_name() ) ) );
	}

	/**
	 * Whether the log records, and why.
	 *
	 * @return array[]
	 */
	public static function provide_states() {
		return array(
			'off by default'     => array( null, '4', false ),
			'on'                 => array( HOUR_IN_SECONDS, '4', true ),
			'its time ran out'   => array( -1, '4', false ),
			'before the upgrade' => array( HOUR_IN_SECONDS, '3', false ),
		);
	}

	/**
	 * @dataProvider provide_states
	 *
	 * @param int|null $until   Seconds from now it records until; null when never turned on.
	 * @param string   $version Stored schema version.
	 * @param bool     $records Whether an entry is written.
	 */
	#[DataProvider( 'provide_states' )]
	public function test_records_only_while_on( $until, $version, $records ) {
		update_option( Email_Log::DB_VERSION_OPTION, $version );
		if ( null !== $until ) {
			self::turn_on_until( time() + $until );
		}

		Debug_Log::add( 'info', 'sending', 'mail.sent', 'Sent.' );

		$this->assertSame( $records, Debug_Log::enabled() );
		$this->assertCount( $records ? 1 : 0, $this->entries() );
	}

	public function test_checking_never_writes_but_expiring_turns_it_off_once() {
		self::turn_on_until( time() - 1 );

		$this->assertFalse( Debug_Log::enabled() );
		$this->assertTrue( Settings::get()['debug_log'] );

		Debug_Log::expire_if_due();

		$this->assertFalse( Settings::get()['debug_log'] );
		$this->assertCount( 1, $this->entries() );
		$this->assertStringContainsString( "'debug.off'", $this->entries()[0] );
		$this->assertStringContainsString( 'automatically', $this->entries()[0] );
	}

	public function test_turning_on_sets_when_it_turns_itself_off() {
		Debug_Log::turn_on( 30 );

		$this->assertSame( 30, Settings::get()['debug_log_days'] );
		$this->assertEqualsWithDelta( time() + 30 * DAY_IN_SECONDS, strtotime( Settings::get()['debug_log_until'] ), 5 );
		$this->assertStringContainsString( "'debug.on'", $this->entries()[0] );
		$this->assertStringContainsString( "'Debug log turned on for 1 month.'", $this->entries()[0] );
	}

	public function test_a_new_length_while_it_records_says_it_restarted_not_that_it_turned_on() {
		Debug_Log::turn_on( 30 );
		Debug_Log::turn_on( 1 );

		$this->assertEqualsWithDelta( time() + DAY_IN_SECONDS, strtotime( Settings::get()['debug_log_until'] ), 5 );
		$this->assertStringContainsString( "'Debug log now records for 1 day.'", $this->entries()[1] );
	}

	/**
	 * Settings and whether the hourly job deletes old entries.
	 *
	 * @return array[]
	 */
	public static function provide_prune_states() {
		return array(
			'on'  => array( true ),
			'off' => array( false ),
		);
	}

	/**
	 * @dataProvider provide_prune_states
	 *
	 * @param bool $on Whether it's recording.
	 */
	#[DataProvider( 'provide_prune_states' )]
	public function test_old_entries_are_deleted_on_or_off( $on ) {
		Settings::update(
			array(
				'debug_log'      => $on,
				'debug_log_days' => 1,
			)
		);
		$this->rows = array( array( 'id' => '7' ) );

		Debug_Log::prune();

		$deletes = array_values( array_filter( $this->queries, fn( $query ) => 0 === strpos( $query, 'DELETE FROM `' . Debug_Log::table_name() ) ) );
		$this->assertStringContainsString( "created_at < '" . gmdate( 'Y-m-d H', time() - DAY_IN_SECONDS ), $deletes[0] );
		// Past the newest 20,000, by id.
		$this->assertStringContainsString( 'OFFSET 19999', implode( "\n", $this->queries ) );
		$this->assertStringContainsString( 'WHERE id < 7', $deletes[1] );
	}

	/**
	 * Strings and what's left of them.
	 *
	 * @return array[]
	 */
	public static function provide_scrubs() {
		$hex = 'a3f9c2e1b4d5a6f7e8c9b0a1d2e3f4a5';
		return array(
			'bearer token'         => array( array( 'message' => 'Authorization: Bearer abc.def-ghi' ), 'message', 'Authorization: Bearer [removed]' ),
			'secret query value'   => array( array( 'message' => 'GET /x?key=abc123&page=2' ), 'message', 'GET /x?key=[removed]&page=2' ),
			'long hex run'         => array( array( 'message' => 'token ' . $hex ), 'message', 'token [removed]' ),
			'base64 run'           => array( array( 'message' => 'id dGhpc0lzQVRlc3RLZXkxMjM0NTY3ODkwYWJjZGVm' ), 'message', 'id [removed]' ),
			'address'              => array( array( 'message' => 'Invalid address: jane.doe@example.com' ), 'message', 'Invalid address: j•••@example.com' ),
			'request id stays'     => array( array( 'request_id' => $hex ), 'request_id', $hex ),
			'message id stays'     => array( array( 'message_id' => 'msg-12@relay.example.net' ), 'message_id', 'msg-12@relay.example.net' ),
			'same value elsewhere' => array( array( 'path' => $hex ), 'path', '[removed]' ),
			'long string'          => array( array( 'message' => str_repeat( 'x ', 300 ) ), 'message', str_repeat( 'x ', 249 ) . 'x…' ),
		);
	}

	/**
	 * @dataProvider provide_scrubs
	 *
	 * @param array  $context  Context.
	 * @param string $key      The key to read back.
	 * @param string $expected Its value after redaction.
	 */
	#[DataProvider( 'provide_scrubs' )]
	public function test_redaction( array $context, $key, $expected ) {
		$this->assertSame( $expected, Debug_Log::redact( $context )[ $key ] );
	}

	public function test_an_emails_early_entries_are_linked_to_its_row_once_it_exists() {
		self::turn_on_until( time() + HOUR_IN_SECONDS );
		Debug_Log::hold();
		Debug_Log::add( 'debug', 'sending', 'mail.caught', 'Picked up an email.' );
		Debug_Log::add( 'error', 'sending', 'api.call', 'POST /send → HTTP 403 in 412 ms.' );
		// Not about this email.
		Debug_Log::add( 'info', 'settings', 'settings.changed', 'Changed the debug log.' );

		Debug_Log::claim( 42 );
		Debug_Log::claim( 43 );

		$updates = array_values( preg_grep( '/^UPDATE `' . preg_quote( Debug_Log::table_name(), '/' ) . '`/', $this->queries ) );
		$this->assertCount( 1, $updates );
		$this->assertMatchesRegularExpression( '/SET log_id = 42 WHERE log_id = 0 AND id IN \(\d+,\d+\)$/', $updates[0] );
	}

	public function test_nothing_is_linked_when_no_email_was_being_sent() {
		self::turn_on_until( time() + HOUR_IN_SECONDS );
		Debug_Log::add( 'debug', 'sending', 'mail.skipped', 'Left it to your host: sending is off.' );

		Debug_Log::claim( 42 );

		$this->assertSame( array(), preg_grep( '/^UPDATE /', $this->queries ) );
	}

	public function test_a_repeated_value_is_recorded_once_and_nothing_is_stored_while_off() {
		$this->assertFalse( Debug_Log::changed( 'usage', '169/-1' ) );
		$this->assertFalse( get_transient( 'jetpack_send_debug_seen_usage' ) );

		self::turn_on_until( time() + HOUR_IN_SECONDS );
		$this->assertTrue( Debug_Log::changed( 'usage', '169/-1' ) );
		$this->assertFalse( Debug_Log::changed( 'usage', '169/-1' ) );
		$this->assertTrue( Debug_Log::changed( 'usage', '170/-1' ) );
		delete_transient( 'jetpack_send_debug_seen_usage' );
	}

	public function test_a_dkim_value_from_the_domain_check_survives_only_there() {
		$found = 'v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA';

		$this->assertSame( $found, Debug_Log::redact( array( 'found' => $found ), '', 'dns.check' )['found'] );
		$this->assertSame( 'v=DKIM1;k=rsa;p=[removed]', Debug_Log::redact( array( 'found' => $found ), '', 'api.call' )['found'] );
	}

	public function test_server_paths_are_cut_to_the_part_inside_wordpress() {
		$this->assertSame( 'wp-content/plugins/shop/mail.php', Debug_Log::redact( array( 'message' => WP_CONTENT_DIR . '/plugins/shop/mail.php' ) )['message'] );
	}

	public function test_unknown_context_keys_and_oversized_contexts_are_dropped() {
		self::turn_on_until( time() + HOUR_IN_SECONDS );

		Debug_Log::add(
			'info',
			'sending',
			'mail.caught',
			'Picked up an email.',
			array(
				'origin'  => str_repeat( 'p', 5000 ),
				'subject' => 'Your order',
				'body'    => 'Hello Jane',
			)
		);

		$entry = $this->entries()[0];
		$this->assertStringNotContainsString( 'Your order', $entry );
		$this->assertStringNotContainsString( 'Hello Jane', $entry );
		$this->assertLessThan( 4096 + 400, strlen( $entry ) );
	}

	public function test_the_canary_key_and_token_never_reach_a_debug_entry_or_the_log() {
		self::turn_on_until( time() + HOUR_IN_SECONDS );
		Settings::update( array( 'enabled' => true ) );
		Account::save(
			array(
				'handle'           => 'jpsendtest',
				'api_key'          => self::CANARY_KEY,
				'lockdown_auth_id' => 'jpsendtest',
				'domain'           => 'example.com',
				'dkim_selector'    => '',
				'monthly_limit'    => -1,
				'dns_records'      => array(),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-07T00:00:00+00:00',
				'dns_check'        => null,
			)
		);
		$atts       = array(
			'to'      => 'jane.doe@example.org',
			'subject' => 'Order 1048',
			'message' => 'Secret body words',
		);
		$this->http = new Http_Mock(
			array(
				array(
					202,
					array(
						'request_id' => 'req-1',
						'results'    => array( array( 'status' => 'sent' ) ),
					),
				),
				array( 403, array( 'errors' => array( 'Invalid API key ' . self::CANARY_KEY ) ) ),
				new WP_Error( 'http_request_failed', 'cURL error 7: Failed to connect with key ' . self::CANARY_KEY ),
				array( 200, array( 'handle' => 'jpsendtest' ) ),
				array( 200, array( 'key' => self::CANARY_KEY ) ),
				array( 200, array() ),
			)
		);

		Mailer::pre_wp_mail( null, $atts );
		Settings::update( array( 'fallback' => false ) );
		Mailer::pre_wp_mail( null, $atts );
		Settings::update( array( 'fallback' => true ) );
		Mailer::pre_wp_mail( null, $atts );
		( new Local_Provisioner( new MailChannels_Client( 'parent-key-123456' ) ) )->provision( 'example.com' );
		Cloudflare_Dns::apply( self::CANARY_TOKEN, 'example.com', array() );
		Debug_Log::add( 'info', 'domain', 'cloudflare.write', 'Wrote with ' . self::CANARY_TOKEN, array( 'name' => self::CANARY_TOKEN ) );

		$this->assertNotEmpty( $this->entries() );
		foreach ( $this->queries as $query ) {
			if ( 1 === preg_match( '/^(INSERT|UPDATE)/i', $query ) && ( false !== strpos( $query, Debug_Log::table_name() ) || false !== strpos( $query, Email_Log::table_name() ) ) ) {
				$this->assertStringNotContainsString( self::CANARY_KEY, $query );
				$this->assertStringNotContainsString( self::CANARY_TOKEN, $query );
				$this->assertStringNotContainsString( 'parent-key-123456', $query );
			}
		}
		foreach ( $this->entries() as $entry ) {
			$this->assertStringNotContainsString( 'Secret body words', $entry );
			$this->assertStringNotContainsString( 'jane.doe@example.org', $entry );
		}
	}

	public function test_entries_come_back_with_string_ids_and_who_did_it() {
		$this->rows = array(
			array(
				'id'         => '3',
				'created_at' => '2026-10-19 14:14:03',
				'level'      => 'error',
				'area'       => 'sending',
				'event'      => 'mail.failed',
				'message'    => 'Not sent: lockdown.',
				'context'    => '{"reason":"lockdown"}',
				'log_id'     => '0',
				'user_id'    => '0',
			),
		);

		$this->assertSame(
			array(
				'id'         => '3',
				'created_at' => '2026-10-19 14:14:03',
				'level'      => 'error',
				'area'       => 'sending',
				'event'      => 'mail.failed',
				'message'    => 'Not sent: lockdown.',
				'context'    => array( 'reason' => 'lockdown' ),
				'log_id'     => '',
				'user'       => '',
			),
			Debug_Log::get( 3 )
		);
	}

	public function test_copy_for_support_lists_entries_in_the_site_timezone() {
		update_option( 'timezone_string', 'America/New_York' );
		$this->rows = array(
			array(
				'id'         => '3',
				'created_at' => '2026-10-19 18:14:03',
				'level'      => 'error',
				'area'       => 'sending',
				'event'      => 'mail.failed',
				'message'    => 'Not sent: lockdown.',
				'context'    => '{"log_id":120}',
				'log_id'     => '120',
				'user_id'    => '0',
			),
		);

		$text = Debug_Log::text( array() );
		update_option( 'timezone_string', '' );

		$this->assertSame( 1, $text['count'] );
		$this->assertStringStartsWith( "Jetpack Send debug log\nSite: ", $text['text'] );
		$this->assertStringContainsString( 'Times are America/New_York, UTC-04:00. Newest first. 1 entries.', $text['text'] );
		$this->assertStringContainsString( '2026-10-19 14:14:03  ERROR    sending   mail.failed      Not sent: lockdown. {"log_id":120}', $text['text'] );
	}

	public function test_clear_deletes_every_entry_and_says_how_many() {
		$this->rows = array( array( 'COUNT(*)' => '37' ) );

		$this->assertSame( 37, Debug_Log::clear() );
		$this->assertStringContainsString( 'DELETE FROM `' . Debug_Log::table_name() . '`', implode( "\n", $this->queries ) );
	}
}
