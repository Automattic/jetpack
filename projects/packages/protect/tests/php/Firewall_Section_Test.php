<?php
/**
 * Tests for the Protect dashboard's Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Firewall;
use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;
use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Firewall
 */
#[CoversClass( Firewall::class )]
class Firewall_Section_Test extends BaseTestCase {

	/**
	 * Offering a proxy's address for the allow list would exempt every visitor behind it.
	 *
	 * @dataProvider provide_addresses
	 *
	 * @param array  $server   The request's `$_SERVER` entries.
	 * @param string $expected The address offered, or empty for none.
	 */
	#[DataProvider( 'provide_addresses' )]
	public function test_current_ip_is_only_offered_when_it_is_the_visitors( $server, $expected ) {
		$original = $_SERVER;
		$_SERVER  = array_merge( $_SERVER, $server );

		$ip = Firewall::get_current_ip();

		$_SERVER = $original;
		$this->assertSame( $expected, $ip );
	}

	/**
	 * Data provider for test_current_ip_is_only_offered_when_it_is_the_visitors.
	 *
	 * @return array
	 */
	public static function provide_addresses() {
		return array(
			'a direct visitor'                           => array( array( 'REMOTE_ADDR' => '203.0.113.7' ), '203.0.113.7' ),
			'a proxy that rewrote the address'           => array(
				array(
					'REMOTE_ADDR'          => '203.0.113.7',
					'HTTP_X_FORWARDED_FOR' => '203.0.113.7, 198.51.100.2',
				),
				'203.0.113.7',
			),
			'a proxy that forwards someone else'         => array(
				array(
					'REMOTE_ADDR'          => '198.51.100.2',
					'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
				),
				'',
			),
			'a proxy on the same private network'        => array( array( 'REMOTE_ADDR' => '10.0.0.5' ), '' ),
			'a proxy on the same machine'                => array( array( 'REMOTE_ADDR' => '127.0.0.1' ), '' ),
			// Not 2001:db8::/32, which PHP before 8.3 rejects as reserved.
			'the same IPv6 address written longer'       => array(
				array(
					'REMOTE_ADDR'          => '2606:4700:4700::1111',
					'HTTP_X_FORWARDED_FOR' => '2606:4700:4700:0000:0000:0000:0000:1111',
				),
				'2606:4700:4700::1111',
			),
			'a forwarding header that isn\'t an address' => array(
				array(
					'REMOTE_ADDR'    => '203.0.113.7',
					'HTTP_X_REAL_IP' => 'unknown',
				),
				'',
			),
			'one of several headers disagreeing'         => array(
				array(
					'REMOTE_ADDR'           => '203.0.113.7',
					'HTTP_X_FORWARDED_FOR'  => '203.0.113.7',
					'HTTP_CF_CONNECTING_IP' => '198.51.100.9',
				),
				'',
			),
		);
	}

	/**
	 * A wrong guess at the visitor's address must not stop a save.
	 *
	 * @dataProvider provide_block_lists
	 *
	 * @param array  $server  The request's `$_SERVER` entries.
	 * @param string $list    The block list being saved.
	 * @param bool   $refused Whether the save is refused.
	 */
	#[DataProvider( 'provide_block_lists' )]
	public function test_block_list_is_refused_only_when_it_covers_the_known_visitor( $server, $list, $refused ) {
		$original = $_SERVER;
		$_SERVER  = array_merge( $_SERVER, $server );

		$result = Firewall::validate_ip_block_list( $list );

		$_SERVER = $original;
		$this->assertSame( $refused, is_wp_error( $result ) );
	}

	/**
	 * Data provider for test_block_list_is_refused_only_when_it_covers_the_known_visitor.
	 *
	 * @return array
	 */
	public static function provide_block_lists() {
		$visitor = array( 'REMOTE_ADDR' => '203.0.113.7' );

		return array(
			'the address itself'                   => array( $visitor, "198.51.100.1\n203.0.113.7", true ),
			'a range that includes it'             => array( $visitor, '203.0.113.1-203.0.113.100', true ),
			'a CIDR block that includes it'        => array( $visitor, '203.0.113.0/24', true ),
			'only other addresses'                 => array( $visitor, '203.0.113.70, 203.0.113.8-203.0.113.9, 203.0.114.0/24', false ),
			'its IPv6 address written longer'      => array( array( 'REMOTE_ADDR' => '2606:4700:4700::1111' ), '2606:4700:4700:0000:0000:0000:0000:1111', true ),
			'an address behind an untrusted proxy' => array(
				array(
					'REMOTE_ADDR'          => '198.51.100.2',
					'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
				),
				'198.51.100.2',
				false,
			),
		);
	}

	/**
	 * An address the allow list exempts gets its own reason, since blocking it would never lock anyone out.
	 *
	 * @dataProvider provide_allow_list_states
	 *
	 * @param bool   $allow_list_enabled Whether the allow list is on.
	 * @param string $code               The expected error code.
	 */
	#[DataProvider( 'provide_allow_list_states' )]
	public function test_block_list_refusal_names_the_allow_list_only_when_it_applies( $allow_list_enabled, $code ) {
		$original               = $_SERVER;
		$_SERVER['REMOTE_ADDR'] = '203.0.113.7';
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '203.0.113.0/24' );
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_ENABLED_OPTION_NAME, $allow_list_enabled );

		$result = Firewall::validate_ip_block_list( '203.0.113.7' );

		$_SERVER = $original;
		$this->assertSame( $code, $result->get_error_code() );
	}

	/**
	 * Data provider for test_block_list_refusal_names_the_allow_list_only_when_it_applies.
	 *
	 * @return array
	 */
	public static function provide_allow_list_states() {
		return array(
			'allow list on'  => array( true, 'ip_block_list_includes_allowed_ip' ),
			'allow list off' => array( false, 'ip_block_list_includes_current_ip' ),
		);
	}

	public function test_each_block_count_comes_from_its_own_stored_period() {
		$stored  = array(
			Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY        => serialize(
				array(
					gmdate( 'Y-m-d' ) => 2,
					gmdate( 'Y-m-d', strtotime( '-3 days' ) ) => 5,
				)
			),
			Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT => '40',
		);
		$options = static function ( $rows, $query ) use ( $stored ) {
			foreach ( $stored as $name => $value ) {
				if ( false !== strpos( $query, "option_name = '$name'" ) ) {
					return array( (object) array( 'option_value' => $value ) );
				}
			}
			return $rows;
		};
		add_filter( 'wordbless_wpdb_query_results', $options, 10, 2 );

		$blocks = Firewall::get_blocks();

		remove_filter( 'wordbless_wpdb_query_results', $options, 10 );
		$this->assertSame( 2, $blocks['blockedToday'], 'today' );
		$this->assertSame( 7, $blocks['blockedLast30Days'], 'last 30 days' );
		$this->assertSame( 40, $blocks['blockedCount'], 'all time' );
	}

	/**
	 * A date for rules the firewall isn't loading would claim protection the site doesn't have.
	 *
	 * @dataProvider provide_rules_states
	 *
	 * @param bool     $enabled   Whether the automatic rules are on.
	 * @param int|null $timestamp The stored last-updated timestamp, or null for none.
	 * @param int|null $expected  The timestamp the card gets.
	 */
	#[DataProvider( 'provide_rules_states' )]
	public function test_rules_date_is_only_sent_while_the_rules_are_on( $enabled, $timestamp, $expected ) {
		update_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME, $enabled );
		if ( null !== $timestamp ) {
			update_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME, $timestamp );
		}

		$this->assertSame( $expected, Firewall::get_rules_updated_at() );
	}

	/**
	 * Data provider for test_rules_date_is_only_sent_while_the_rules_are_on.
	 *
	 * @return array
	 */
	public static function provide_rules_states() {
		return array(
			'on and downloaded' => array( true, 1760000000, 1760000000 ),
			'off'               => array( false, 1760000000, null ),
			'on, never fetched' => array( true, null, null ),
		);
	}

	public function test_request_details_join_the_block_they_were_logged_with() {
		$blocks  = array(
			array(
				'id'        => 3,
				'timestamp' => '2026-10-09T16:54:03Z',
				'ruleId'    => -2,
			),
			array(
				'id'        => 2,
				'timestamp' => '2026-10-09T16:54:03Z',
				'ruleId'    => -2,
			),
			array(
				'id'        => 1,
				'timestamp' => '2026-10-09T16:07:51Z',
				'ruleId'    => -1,
			),
		);
		$entries = array(
			array(
				'timestamp'   => '2026-10-09 16:54:03',
				'rule_id'     => '-2',
				'request_uri' => '/?first',
				'user_agent'  => 'curl/8.14.1',
			),
			array(
				'timestamp'   => '2026-10-09 16:54:03',
				'rule_id'     => -2,
				'request_uri' => '/?second',
				'user_agent'  => '',
			),
		);

		$result = Firewall::add_request_details( $blocks, $entries );

		$this->assertSame( '/?second', $result[0]['uri'] );
		$this->assertArrayNotHasKey( 'userAgent', $result[0] );
		$this->assertSame( '/?first', $result[1]['uri'] );
		$this->assertSame( 'curl/8.14.1', $result[1]['userAgent'] );
		$this->assertSame( $blocks[2], $result[2] );
	}

	/**
	 * The request log holds visitors' URLs and user agents, which only "Share basic data" opts in to showing.
	 *
	 * @dataProvider provide_share_data
	 *
	 * @param bool $shares_data Whether "Share basic data" is on.
	 */
	#[DataProvider( 'provide_share_data' )]
	public function test_blocks_carry_request_details_only_when_sharing_is_on( $shares_data ) {
		update_option( Waf_Runner::SHARE_DATA_OPTION_NAME, $shares_data );
		Waf_Constants::define_waf_directory();
		$log = Waf_Blocklog_Manager::get_blocklog_file_path();
		if ( ! is_dir( dirname( $log ) ) ) {
			mkdir( dirname( $log ), 0755, true );
		}
		$entry = array(
			'timestamp'   => '2026-10-09 16:54:03',
			'rule_id'     => -2,
			'request_uri' => '/?probe',
			'user_agent'  => 'curl/8.14.1',
		);
		file_put_contents( $log, wp_json_encode( $entry, JSON_UNESCAPED_SLASHES ) . "\n" );
		$blocklog = static function ( $rows, $query ) {
			if ( false === strpos( $query, 'jetpack_waf_blocklog ORDER BY log_id DESC LIMIT 10' ) ) {
				return $rows;
			}
			return array(
				(object) array(
					'log_id'    => '1',
					'timestamp' => '2026-10-09 16:54:03',
					'rule_id'   => '-2',
					'reason'    => 'firewall test',
				),
			);
		};
		add_filter( 'wordbless_wpdb_query_results', $blocklog, 10, 2 );

		$blocks = Firewall::get_blocks()['recentBlocks'];

		remove_filter( 'wordbless_wpdb_query_results', $blocklog, 10 );
		unlink( $log );
		delete_option( Waf_Runner::SHARE_DATA_OPTION_NAME );
		$this->assertCount( 1, $blocks );
		$this->assertSame( $shares_data, isset( $blocks[0]['uri'] ), 'uri' );
		$this->assertSame( $shares_data, isset( $blocks[0]['userAgent'] ), 'userAgent' );
	}

	/**
	 * Data provider for test_blocks_carry_request_details_only_when_sharing_is_on.
	 *
	 * @return array
	 */
	public static function provide_share_data() {
		return array(
			'sharing off' => array( false ),
			'sharing on'  => array( true ),
		);
	}
}
