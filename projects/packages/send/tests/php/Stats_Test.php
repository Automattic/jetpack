<?php
/**
 * Tests for the counts table and the GET /stats payload.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Stats
 * @covers \Automattic\Jetpack\Send\REST_Controller
 */
#[CoversClass( Stats::class )]
#[CoversClass( REST_Controller::class )]
class Stats_Test extends BaseTestCase {

	/** 2026-10-18 12:00:00 UTC. */
	const NOW = 1792324800;

	/**
	 * The fake database.
	 *
	 * @var Fake_Db
	 */
	private $db;

	/**
	 * Schema 4, UTC, and an empty fake database.
	 */
	public function set_up() {
		parent::set_up();
		// WorDBless clears options between tests but not their cache, which can make update_option() a no-op.
		wp_cache_flush();
		update_option( Email_Log::DB_VERSION_OPTION, '4' );
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 0 );
		$this->db = new Fake_Db();
	}

	/**
	 * Remove the fake database and cached stats.
	 */
	public function tear_down() {
		$this->db->remove();
		Email_Log::clear_stats_cache();
		delete_option( Stats::BACKFILL_OPTION );
		update_option( 'timezone_string', '' );
		parent::tear_down();
	}

	/**
	 * A counts row.
	 *
	 * @param string $at     UTC time inside the hour.
	 * @param string $status Status.
	 * @param int    $n      Emails.
	 * @return array
	 */
	private static function hour( $at, $status, $n ) {
		return array(
			'bucket' => (string) Stats::bucket( strtotime( $at . ' UTC' ) ),
			'status' => $status,
			'n'      => (string) $n,
		);
	}

	/**
	 * Zones and the bucket a time falls in.
	 *
	 * @return array[]
	 */
	public static function provide_buckets() {
		return array(
			'UTC'                     => array( 'UTC', '2026-10-18 12:34:56', '2026-10-18 12:00:00' ),
			'Kolkata, +5:30'          => array( 'Asia/Kolkata', '2026-10-18 12:34:56', '2026-10-18 12:30:00' ),
			'Kathmandu, +5:45'        => array( 'Asia/Kathmandu', '2026-10-18 12:10:00', '2026-10-18 11:15:00' ),
			"St John's, -3:30 winter" => array( 'America/St_Johns', '2026-01-18 12:10:00', '2026-01-18 11:30:00' ),
			'Los Angeles, -8 winter'  => array( 'America/Los_Angeles', '2026-01-18 12:34:56', '2026-01-18 12:00:00' ),
			'before falling back'     => array( 'America/Los_Angeles', '2026-11-01 08:30:00', '2026-11-01 08:00:00' ),
			'after falling back'      => array( 'America/Los_Angeles', '2026-11-01 09:30:00', '2026-11-01 09:00:00' ),
		);
	}

	/**
	 * @dataProvider provide_buckets
	 *
	 * @param string $zone   Site timezone.
	 * @param string $at     UTC time.
	 * @param string $bucket UTC start of its site-local hour.
	 */
	#[DataProvider( 'provide_buckets' )]
	public function test_bucket_is_the_start_of_the_site_local_hour( $zone, $at, $bucket ) {
		update_option( 'timezone_string', $zone );

		$this->assertSame( strtotime( $bucket . ' UTC' ), Stats::bucket( strtotime( $at . ' UTC' ) ) );
	}

	public function test_counting_adds_to_the_hours_row_without_reading_it() {
		Stats::add( strtotime( '2026-10-18 09:15:00 UTC' ), 'sent', 'wp_mail', 'plugin:shop', 12 );

		$this->assertStringContainsString(
			"VALUES ( 1792314000, 'sent', 'wp_mail', 'plugin:shop', 1 ) ON DUPLICATE KEY UPDATE emails = emails + 1",
			$this->db->matching( 'INSERT INTO `' . Stats::table_name() )[0]
		);
	}

	/**
	 * Rows the backfill counts, which live counting skips, and the ones it doesn't.
	 *
	 * @return array[]
	 */
	public static function provide_backfill_boundary() {
		return array(
			'logged before the upgrade' => array( 40, 0 ),
			'the boundary itself'       => array( 50, 0 ),
			'logged after the upgrade'  => array( 51, 1 ),
			'not logged at all'         => array( 0, 1 ),
		);
	}

	/**
	 * @dataProvider provide_backfill_boundary
	 *
	 * @param int $log_id Log row id.
	 * @param int $counts Inserts expected.
	 */
	#[DataProvider( 'provide_backfill_boundary' )]
	public function test_live_counting_skips_rows_the_backfill_counts( $log_id, $counts ) {
		Stats::start_backfill( 50 );

		Stats::add( self::NOW, 'sent', 'wp_mail', '', $log_id );
		Stats::move( self::NOW, 'fallback', 'failed', 'wp_mail', '', $log_id );

		// One insert for the count, an update and an insert for the move.
		$this->assertCount( 3 * $counts, $this->db->matching( Stats::table_name() ) );
	}

	public function test_nothing_is_counted_before_the_upgrade() {
		update_option( Email_Log::DB_VERSION_OPTION, '3' );

		Stats::add( self::NOW, 'sent', 'wp_mail', '' );

		$this->assertSame( array(), $this->db->matching( Stats::table_name() ) );
	}

	public function test_moving_a_count_lowers_one_status_raises_the_other_and_stales_the_cache() {
		$gen = Email_Log::stats_gen();

		Stats::move( self::NOW, 'fallback', 'failed', 'wp_mail', 'plugin:shop', 7 );

		$queries = $this->db->matching( Stats::table_name() );
		$this->assertStringContainsString( "SET emails = emails - 1 WHERE bucket = 1792324800 AND status = 'fallback'", $queries[0] );
		$this->assertStringContainsString( "'failed', 'wp_mail', 'plugin:shop', 1 )", $queries[1] );
		$this->assertSame( $gen + 1, Email_Log::stats_gen() );
	}

	public function test_the_backfill_only_adds_and_never_counts_a_row_twice() {
		Stats::start_backfill( 3 );
		$this->db->on(
			'SELECT id, created_at, status, source, origin FROM `' . Email_Log::table_name(),
			fn( $query ) => false !== strpos( $query, 'id > 0' ) ? array(
				array(
					'id'         => '1',
					'created_at' => '2026-10-18 09:15:00',
					'status'     => 'sent',
					'source'     => 'wp_mail',
					'origin'     => '',
				),
				array(
					'id'         => '2',
					'created_at' => '2026-10-18 09:45:00',
					'status'     => 'sent',
					'source'     => 'wp_mail',
					'origin'     => '',
				),
				array(
					'id'         => '3',
					'created_at' => '2026-10-18 09:50:00',
					'status'     => 'failed',
					'source'     => 'test',
					'origin'     => '',
				),
			) : array()
		);

		$this->assertTrue( Stats::backfill_batch( 0 ) );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Running a second batch is the point of the test.
		$this->assertTrue( Stats::backfill_batch( 0 ) );

		$inserts = $this->db->matching( 'INSERT INTO `' . Stats::table_name() );
		$this->assertCount( 2, $inserts );
		$this->assertStringContainsString( "'sent', 'wp_mail', '', 2 )", $inserts[0] );
		$this->assertSame( array(), $this->db->matching( 'DELETE FROM `' . Stats::table_name() ) );
		$this->assertSame(
			array(
				'until_id' => 3,
				'cursor'   => 3,
				'done'     => true,
			),
			Stats::backfill_state()
		);
	}

	public function test_a_second_upgrade_keeps_the_first_boundary() {
		Stats::start_backfill( 40 );
		Stats::start_backfill( 90 );

		$this->assertSame( 40, Stats::backfill_state()['until_id'] );
	}

	public function test_while_the_backfill_runs_the_numbers_add_the_rows_it_hasnt_reached() {
		update_option(
			Stats::BACKFILL_OPTION,
			array(
				'until_id' => 9,
				'cursor'   => 5,
				'done'     => false,
			)
		);
		$this->db->on(
			'GROUP BY source, status',
			array(
				array(
					'source' => 'wp_mail',
					'status' => 'sent',
					'n'      => '10',
				),
			)
		)
			->on(
				'SELECT id, created_at, status, source, origin FROM `' . Email_Log::table_name(),
				fn( $query ) => false !== strpos( $query, 'id > 5 AND id <= 9' ) ? array(
					array(
						'id'         => '6',
						'created_at' => '2026-10-17 10:00:00',
						'status'     => 'sent',
						'source'     => 'wp_mail',
						'origin'     => '',
					),
				) : array()
			);

		$totals = REST_Controller::stats_data( 7, self::NOW )['totals'];

		$this->assertSame( 11, $totals['sent'] );
	}

	/**
	 * Ranges, the bars they get and the first day.
	 *
	 * @return array[]
	 */
	public static function provide_ranges() {
		return array(
			'last 7 days'  => array( 7, 'day', 7, '2026-10-12' ),
			'last 90 days' => array( 90, 'day', 90, '2026-07-21' ),
			'24 hours'     => array( 1, 'hour', 24, '2026-10-17' ),
		);
	}

	/**
	 * @dataProvider provide_ranges
	 *
	 * @param int    $range Days.
	 * @param string $unit  Bars.
	 * @param int    $bars  How many.
	 * @param string $from  First day.
	 */
	#[DataProvider( 'provide_ranges' )]
	public function test_every_bar_is_listed_oldest_first_with_zeros_filled_in( $range, $unit, $bars, $from ) {
		$this->db->on(
			'GROUP BY bucket, status',
			array(
				self::hour( '2026-10-18 09:15:00', 'sent', 4 ),
				self::hour( '2026-10-18 09:40:00', 'failed', 1 ),
				self::hour( '2026-10-18 11:00:00', 'fallback', 2 ),
			)
		);

		$data = REST_Controller::stats_data( $range, self::NOW );

		$this->assertSame( $unit, $data['unit'] );
		$this->assertSame( $from, $data['from'] );
		$this->assertSame( '2026-10-18', $data['to'] );
		$list = 'hour' === $unit ? $data['hours'] : $data['days'];
		$this->assertCount( $bars, $list );
		$this->assertSame( array(), 'hour' === $unit ? $data['days'] : $data['hours'] );
		if ( 'hour' === $unit ) {
			$this->assertSame( '2026-10-17T13:00:00Z', $list[0]['start'] );
			$this->assertSame( 4, $list[20]['sent'] );
			$this->assertSame( 1, $list[20]['failed'] );
			return;
		}
		$this->assertSame(
			array(
				'date'     => '2026-10-18',
				'sent'     => 4,
				'fallback' => 2,
				'failed'   => 1,
			),
			end( $list )
		);
		$this->assertSame( 0, $list[0]['sent'] );
	}

	/**
	 * Zones where the clocks go forward at midnight (00:00 doesn't exist that day), with a today on
	 * the change and one after it, plus zones that change at other times.
	 *
	 * @return array[]
	 */
	public static function provide_day_lists() {
		return array(
			'Santiago, on the change' => array( 'America/Santiago', '2026-09-06 18:00:00', '2026-09-06' ),
			'Santiago, after it'      => array( 'America/Santiago', '2026-10-19 18:00:00', '2026-10-19' ),
			'Cairo, on the change'    => array( 'Africa/Cairo', '2026-04-24 09:00:00', '2026-04-24' ),
			'Cairo, after it'         => array( 'Africa/Cairo', '2026-05-10 09:00:00', '2026-05-10' ),
			'Sydney, after its 2 am'  => array( 'Australia/Sydney', '2026-10-19 02:00:00', '2026-10-19' ),
			'Kolkata, half an hour'   => array( 'Asia/Kolkata', '2026-10-19 14:20:00', '2026-10-19' ),
			'UTC'                     => array( 'UTC', '2026-10-19 14:20:00', '2026-10-19' ),
		);
	}

	/**
	 * @dataProvider provide_day_lists
	 *
	 * @param string $zone  Site timezone.
	 * @param string $now   UTC now.
	 * @param string $today Site-local today.
	 */
	#[DataProvider( 'provide_day_lists' )]
	public function test_a_preset_lists_every_day_up_to_today_wherever_the_clocks_change( $zone, $now, $today ) {
		update_option( 'timezone_string', $zone );

		foreach ( array( 90, 180, 365 ) as $range ) {
			$days = REST_Controller::stats_data( $range, strtotime( $now . ' UTC' ) )['days'];

			$this->assertCount( $range, $days, "$range days" );
			$this->assertSame( $today, end( $days )['date'], "$range days" );
			$this->assertSame( gmdate( 'Y-m-d', strtotime( $today . ' UTC' ) - ( $range - 1 ) * DAY_IN_SECONDS ), $days[0]['date'], "$range days" );
			$this->assertCount( $range, array_unique( array_column( $days, 'date' ) ), "$range days" );
		}
	}

	/**
	 * Custom days in Santiago that end on the day the clocks go forward at midnight, and after it.
	 *
	 * @return array[]
	 */
	public static function provide_custom_day_lists() {
		return array(
			'ending on the change' => array( '2026-09-01', '2026-09-06', 6, '2026-09-07 03:00:00' ),
			'ending after it'      => array( '2026-09-01', '2026-10-19', 49, '2026-10-20 03:00:00' ),
		);
	}

	/**
	 * @dataProvider provide_custom_day_lists
	 *
	 * @param string $start    First day.
	 * @param string $end      Last day.
	 * @param int    $bars     Days listed.
	 * @param string $midnight UTC of the midnight after the last day.
	 */
	#[DataProvider( 'provide_custom_day_lists' )]
	public function test_custom_days_across_a_midnight_change_list_the_last_day( $start, $end, $bars, $midnight ) {
		update_option( 'timezone_string', 'America/Santiago' );
		$midnight = strtotime( $midnight . ' UTC' );
		// One email at 23:30 on the last day, and one at 00:30 the day after, which isn't in the range.
		$this->db->on(
			'GROUP BY bucket, status',
			array(
				self::hour( gmdate( 'Y-m-d H:i:s', $midnight - 30 * MINUTE_IN_SECONDS ), 'sent', 1 ),
				self::hour( gmdate( 'Y-m-d H:i:s', $midnight + 30 * MINUTE_IN_SECONDS ), 'sent', 1 ),
			)
		);
		$period = Period::resolve(
			array(
				'start' => $start,
				'end'   => $end,
			),
			365,
			strtotime( '2026-10-19 18:00:00 UTC' )
		);

		$days = REST_Controller::stats_data( $period, strtotime( '2026-10-19 18:00:00 UTC' ) )['days'];

		$this->assertCount( $bars, $days );
		$this->assertSame( $start, $days[0]['date'] );
		$this->assertSame( $end, end( $days )['date'] );
		$this->assertSame( 1, end( $days )['sent'] );
		$this->assertSame( 1, array_sum( array_column( $days, 'sent' ) ) );
		// The counts are read up to that midnight, not an hour past it.
		$this->assertStringContainsString( 'bucket < ' . $midnight, $this->db->matching( 'GROUP BY bucket, status' )[0] );
	}

	/**
	 * Days on which the clocks change, with their first hour and how many hours they have.
	 *
	 * @return array[]
	 */
	public static function provide_change_days() {
		return array(
			'Santiago, forward at midnight' => array( 'America/Santiago', '2026-09-06', '2026-09-06T04:00:00Z', 23 ),
			'Cairo, forward at midnight'    => array( 'Africa/Cairo', '2026-04-24', '2026-04-23T22:00:00Z', 23 ),
			'Sydney, forward at 2 am'       => array( 'Australia/Sydney', '2026-10-04', '2026-10-03T14:00:00Z', 23 ),
			'Santiago, back at midnight'    => array( 'America/Santiago', '2026-04-04', '2026-04-04T03:00:00Z', 25 ),
		);
	}

	/**
	 * @dataProvider provide_change_days
	 *
	 * @param string $zone  Site timezone.
	 * @param string $day   The day.
	 * @param string $first Its first hour slot.
	 * @param int    $hours Slots.
	 */
	#[DataProvider( 'provide_change_days' )]
	public function test_a_day_the_clocks_change_has_one_slot_per_real_hour( $zone, $day, $first, $hours ) {
		update_option( 'timezone_string', $zone );
		$period = Period::resolve(
			array(
				'start' => $day,
				'end'   => $day,
			),
			365,
			strtotime( '2026-10-19 18:00:00 UTC' )
		);

		$slots = REST_Controller::stats_data( $period, strtotime( '2026-10-19 18:00:00 UTC' ) )['hours'];

		$this->assertCount( $hours, $slots );
		$this->assertSame( $first, $slots[0]['start'] );
		$this->assertSame( $day, Period::local( strtotime( end( $slots )['start'] ) )->format( 'Y-m-d' ) );
	}

	/**
	 * Half-hour and quarter-hour zones a UTC site might move to.
	 *
	 * @return array[]
	 */
	public static function provide_moved_zones() {
		return array(
			'Kolkata, +5:30'   => array( 'Asia/Kolkata', ':30:00Z' ),
			'Kathmandu, +5:45' => array( 'Asia/Kathmandu', ':15:00Z' ),
			'Adelaide, +10:30' => array( 'Australia/Adelaide', ':30:00Z' ),
		);
	}

	/**
	 * @dataProvider provide_moved_zones
	 *
	 * @param string $zone   The zone the site moved to.
	 * @param string $minute Where its hours start.
	 */
	#[DataProvider( 'provide_moved_zones' )]
	public function test_hour_bars_keep_counts_written_before_a_move_to_a_half_hour_zone( $zone, $minute ) {
		// Written while the site was on UTC: each count starts on the hour.
		$this->db->on(
			'GROUP BY bucket, status',
			array(
				array(
					'bucket' => (string) strtotime( '2026-10-18 09:00:00 UTC' ),
					'status' => 'sent',
					'n'      => '4',
				),
				array(
					'bucket' => (string) strtotime( '2026-10-18 11:00:00 UTC' ),
					'status' => 'failed',
					'n'      => '1',
				),
			)
		);
		update_option( 'timezone_string', $zone );

		$hours = REST_Controller::stats_data( 1, self::NOW )['hours'];

		$this->assertCount( 24, $hours );
		$this->assertStringEndsWith( $minute, $hours[0]['start'] );
		$this->assertSame( 4, array_sum( array_column( $hours, 'sent' ) ) );
		$this->assertSame( 1, array_sum( array_column( $hours, 'failed' ) ) );
	}

	public function test_a_cached_preset_isnt_reused_after_a_move_to_a_zone_with_the_same_hour() {
		update_option( 'timezone_string', 'Asia/Kolkata' );
		$before = REST_Controller::stats_data( 1, self::NOW )['hours'][0]['start'];
		// Kathmandu is 15 minutes on: the same date and hour, but its hours start elsewhere.
		update_option( 'timezone_string', 'Asia/Kathmandu' );

		$after = REST_Controller::stats_data( 1, self::NOW )['hours'][0]['start'];

		$this->assertStringEndsWith( ':30:00Z', $before );
		$this->assertStringEndsWith( ':15:00Z', $after );
	}

	public function test_tests_are_counted_apart_and_resends_as_site_emails() {
		$this->db->on(
			'GROUP BY source, status',
			array(
				array(
					'source' => 'wp_mail',
					'status' => 'sent',
					'n'      => '5',
				),
				array(
					'source' => 'resend',
					'status' => 'failed',
					'n'      => '1',
				),
				array(
					'source' => 'test',
					'status' => 'sent',
					'n'      => '2',
				),
			)
		);

		$data = REST_Controller::stats_data( 7, self::NOW );

		$this->assertSame(
			array(
				'emails'   => 6,
				'sent'     => 5,
				'fallback' => 0,
				'failed'   => 1,
			),
			$data['totals']
		);
		$this->assertSame( 2, $data['tests'] );
		$this->assertStringContainsString( "source <> 'test'", $this->db->matching( 'GROUP BY bucket, status' )[0] );
	}

	public function test_this_month_counts_every_sent_email_tests_included() {
		$this->db->on(
			'GROUP BY source, status',
			array(
				array(
					'source' => 'wp_mail',
					'status' => 'sent',
					'n'      => '5',
				),
				array(
					'source' => 'test',
					'status' => 'sent',
					'n'      => '2',
				),
				array(
					'source' => 'wp_mail',
					'status' => 'failed',
					'n'      => '9',
				),
			)
		);

		$this->assertSame(
			array(
				'emails' => 7,
				'tests'  => 2,
			),
			Stats::sent_counts( self::NOW )
		);
	}

	public function test_origins_keep_the_top_five_and_add_up_the_rest() {
		$this->db->on(
			'GROUP BY origin',
			array_merge(
				array(
					array(
						'origin' => 'core:password_reset',
						'n'      => '20',
					),
				),
				array_map(
					fn( $i ) => array(
						'origin' => 'plugin:p' . $i,
						'n'      => (string) ( 10 - $i ),
					),
					range( 1, 7 )
				)
			)
		);

		$origins = REST_Controller::stats_data( 7, self::NOW )['origins'];

		$this->assertCount( 6, $origins );
		$this->assertSame( 'Password resets', $origins[0]['label'] );
		$this->assertSame(
			array(
				'key'      => 'other',
				'label'    => 'Everything else',
				'count'    => 5 + 4 + 3,
				'icon_url' => null,
			),
			$origins[5]
		);
	}

	public function test_history_first_day_and_last_day_come_from_the_counts() {
		$this->db->on( 'SELECT 1 FROM `' . Stats::table_name(), array( array( 'x' => '1' ) ) )
			->on( 'MIN(bucket)', array( array( 'v' => (string) strtotime( '2026-10-16 05:00:00 UTC' ) ) ) )
			->on( 'MAX(bucket)', array( array( 'v' => (string) strtotime( '2026-10-17 22:00:00 UTC' ) ) ) );

		$data = REST_Controller::stats_data( 90, self::NOW );

		$this->assertTrue( $data['has_history'] );
		$this->assertSame( '2026-10-16', $data['stats_since'] );
		$this->assertSame( '2026-10-17', $data['last_email_day'] );
		$this->assertNull( $data['last_email_at'] );
	}

	public function test_attention_counts_failed_site_emails_and_resends_still_in_the_log() {
		$this->db->on(
			'AS failed',
			array(
				array(
					'failed'   => '3',
					'fallback' => '1',
				),
			)
		);

		$data = REST_Controller::stats_data( 90, self::NOW );

		$this->assertSame(
			array(
				'failed_in_log'   => 3,
				'fallback_in_log' => 1,
			),
			$data['attention']
		);
		$this->assertStringContainsString( "source IN ( 'wp_mail', 'resend' )", $this->db->matching( 'AS failed' )[0] );
	}

	public function test_deleting_emails_from_the_log_keeps_their_counts() {
		$this->db->on( 'SELECT id FROM', array( array( 'id' => '3' ) ) );
		$gen = Email_Log::stats_gen();

		$this->assertSame( array( 3 ), Email_Log::delete( array( 3 ) )['deleted'] );
		$this->assertSame( array(), $this->db->matching( Stats::table_name() ) );
		$this->assertSame( $gen + 1, Email_Log::stats_gen() );
	}

	public function test_counts_older_than_800_days_are_pruned() {
		Stats::prune();

		$this->assertStringContainsString( 'WHERE bucket < ' . ( time() - 800 * DAY_IN_SECONDS ), $this->db->matching( 'DELETE FROM `' . Stats::table_name() )[0] );
	}

	/**
	 * What changes between two requests, and whether the second one counts again.
	 *
	 * @return array[]
	 */
	public static function provide_cache_changes() {
		return array(
			'nothing'          => array( fn() => null, 0, false ),
			'a new email'      => array( fn() => null, 1, true ),
			'a moved count'    => array( fn() => Email_Log::clear_stats_cache(), 0, true ),
			'the hour changed' => array( fn() => null, 0, true, HOUR_IN_SECONDS ),
		);
	}

	/**
	 * @dataProvider provide_cache_changes
	 *
	 * @param callable $change  What happens in between.
	 * @param int      $new_ids Emails logged in between.
	 * @param bool     $counts  Whether the second request counts again.
	 * @param int      $later   Seconds between the requests.
	 */
	#[DataProvider( 'provide_cache_changes' )]
	public function test_a_preset_is_cached_until_its_numbers_can_change( $change, $new_ids, $counts, $later = 0 ) {
		$max_id = 10;
		$this->db->on(
			'MAX(id)',
			function () use ( &$max_id ) {
				return array( array( 'v' => (string) $max_id ) );
			}
		);
		REST_Controller::stats_data( 7, self::NOW );
		$before  = count( $this->db->matching( 'GROUP BY bucket, status' ) );
		$max_id += $new_ids;
		$change();

		REST_Controller::stats_data( 7, self::NOW + $later );

		$this->assertSame( $counts, count( $this->db->matching( 'GROUP BY bucket, status' ) ) > $before );
	}

	public function test_custom_dates_are_never_cached() {
		$period = Period::resolve(
			array(
				'start' => '2026-10-01',
				'end'   => '2026-10-10',
			),
			365,
			self::NOW
		);

		REST_Controller::stats_data( $period, self::NOW );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second call should come from the cache.
		REST_Controller::stats_data( $period, self::NOW );

		$this->assertCount( 2, $this->db->matching( 'GROUP BY bucket, status' ) );
		$this->assertNull( REST_Controller::stats_data( $period, self::NOW )['range'] );
	}
}
