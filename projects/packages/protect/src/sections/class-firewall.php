<?php
/**
 * Protect dashboard: the Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;
use Automattic\Jetpack\Waf\Waf_Request;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Self_Check;
use Automattic\Jetpack\Waf\Waf_Stats;
use WP_Error;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The firewall's on/off state, blocked requests, IP lists and a one-time request to test it with.
 *
 * @since 0.2.0
 */
class Firewall implements Dashboard_Section {

	/**
	 * The rule ID the firewall logs its own test under; matches `Waf_Self_Check::RULE_ID`.
	 */
	const SELF_CHECK_RULE_ID = -2;

	/**
	 * Headers a proxy names the visitor in. One that disagrees with the firewall's address means that address is the proxy's.
	 */
	const FORWARDING_HEADERS = array(
		'HTTP_X_FORWARDED_FOR',
		'HTTP_X_REAL_IP',
		'HTTP_CF_CONNECTING_IP',
		'HTTP_TRUE_CLIENT_IP',
		'HTTP_CLIENT_IP',
	);

	/**
	 * The key the section's state is printed under.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'firewall';
	}

	/**
	 * The firewall module's state, its blocked requests and whether a Scan plan is active.
	 *
	 * @return array
	 */
	public function get_state() {
		// The block counts persist while the firewall is off, so they are sent either way.
		return array_merge(
			Dashboard::get_module_state( 'waf' ),
			self::get_blocks(),
			array(
				'hasScan'        => Dashboard::has_scan_plan(),
				'upgradeUrl'     => Dashboard::get_scan_upgrade_url(),
				'currentIp'      => self::get_current_ip(),
				'ipRules'        => self::get_ip_rules(),
				'rulesUpdatedAt' => self::get_rules_updated_at(),
				'providedByHost' => method_exists( Waf_Runner::class, 'is_provided_by_host' ) && Waf_Runner::is_provided_by_host(),
			)
		);
	}

	/**
	 * Register `jetpack/v4/protect-dashboard/firewall/test` and `…/firewall/blocks`.
	 *
	 * The firewall's settings are saved through existing endpoints.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/firewall/test',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'start_test' ),
				'permission_callback' => array( Dashboard::class, 'can_manage' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/firewall/blocks',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_blocks' ),
				'permission_callback' => array( Dashboard::class, 'can_manage' ),
			)
		);
	}

	/**
	 * A one-time URL the firewall blocks, for the browser to request.
	 *
	 * @return array|WP_Error
	 */
	public static function start_test() {
		// The WAF package bundled by another plugin can predate the self-check.
		if ( ! class_exists( Waf_Self_Check::class ) ) {
			return new WP_Error(
				'firewall_test_unavailable',
				__( 'Update Jetpack to test the firewall.', 'jetpack-protect-pkg' ),
				array( 'status' => 501 )
			);
		}

		$token = Waf_Self_Check::create_token();
		if ( ! $token ) {
			return new WP_Error(
				'firewall_test_failed',
				__( 'The firewall test couldn’t start.', 'jetpack-protect-pkg' ),
				array( 'status' => 500 )
			);
		}

		return array( 'url' => add_query_arg( Waf_Self_Check::QUERY_PARAM, $token, home_url( '/' ) ) );
	}

	/**
	 * The recent blocks and the block counts, refreshed after a test.
	 *
	 * The last 30 days are UTC days, as the firewall records them.
	 *
	 * @return array
	 */
	public static function get_blocks() {
		$counts = class_exists( Waf_Stats::class ) ? Waf_Stats::get_blocked_requests() : array();
		$daily  = self::get_daily_blocks();
		$all    = isset( $counts['all_time'] ) ? (int) $counts['all_time'] : null;

		return array_merge(
			array(
				'recentBlocks'      => self::get_recent_blocks(),
				'blockedCount'      => $all,
				// Not `Waf_Stats`' `thirty_days`, which spans 31 dates.
				'blockedLast30Days' => $daily ? array_sum( array_column( $daily, 'count' ) ) : null,
			),
			self::get_test_summary( (int) $all )
		);
	}

	/**
	 * Blocked requests on each of the last 30 UTC days, oldest first, with 0 for a day without any.
	 *
	 * @return array<int, array{date: string, count: int}> Empty when the WAF package isn't loaded.
	 */
	private static function get_daily_blocks() {
		global $wpdb;

		if ( ! class_exists( Waf_Blocklog_Manager::class ) ) {
			return array();
		}

		// Uncached, like `Waf_Blocklog_Manager::get_stored_option()`.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$stored = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->base_prefix}options WHERE option_name = %s", Waf_Blocklog_Manager::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY ) );
		$counts = null === $stored ? array() : maybe_unserialize( $stored );
		$counts = is_array( $counts ) ? $counts : array();

		$days = array();
		for ( $ago = 29; $ago >= 0; $ago-- ) {
			$date   = gmdate( 'Y-m-d', strtotime( "-$ago days" ) );
			$days[] = array(
				'date'  => $date,
				'count' => isset( $counts[ $date ] ) ? (int) $counts[ $date ] : 0,
			);
		}

		return $days;
	}

	/**
	 * Whether the firewall has blocked anything besides its own tests, and when it was last tested.
	 *
	 * The block log keeps about the last 100 rows, so an all-time count above that means real traffic was pruned.
	 *
	 * @param int $all_time All-time blocked requests.
	 * @return array{hasBlocked: bool, lastTestAt: string|null}
	 */
	private static function get_test_summary( $all_time ) {
		global $wpdb;

		// The table doesn't exist until the firewall is first turned on.
		$suppress = $wpdb->suppress_errors();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- A custom table.
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT COUNT(*) AS total, SUM(rule_id = %d) AS tests, MAX(CASE WHEN rule_id = %d THEN timestamp END) AS last_test FROM {$wpdb->base_prefix}jetpack_waf_blocklog", self::SELF_CHECK_RULE_ID, self::SELF_CHECK_RULE_ID ) );
		$wpdb->suppress_errors( $suppress );

		$total = $row ? (int) $row->total : 0;
		$tests = $row ? (int) $row->tests : 0;

		return array(
			'hasBlocked' => $total > $tests || $all_time > $total,
			'lastTestAt' => $row && $row->last_test ? gmdate( 'Y-m-d\TH:i:s\Z', strtotime( $row->last_test . ' UTC' ) ) : null,
		);
	}

	/**
	 * When the automatic rules were last downloaded, as a Unix timestamp, or null while they're off or never were.
	 *
	 * @return int|null
	 */
	public static function get_rules_updated_at() {
		if ( ! class_exists( Waf_Stats::class ) || ! Waf_Rules_Manager::automatic_rules_enabled() ) {
			return null;
		}

		$timestamp = (int) Waf_Stats::get_automatic_rules_last_updated();

		return $timestamp > 0 ? $timestamp : null;
	}

	/**
	 * The visitor's IP address as the firewall sees it, to offer on the allow list and keep off the block list.
	 *
	 * Empty when it may be a proxy's: allowing that address would let every visitor behind the proxy past the rules.
	 *
	 * @return string
	 */
	public static function get_current_ip() {
		if ( ! class_exists( Waf_Request::class ) ) {
			return '';
		}

		$ip = (string) ( new Waf_Request() )->get_real_user_ip_address();
		if ( ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
			return '';
		}

		foreach ( self::FORWARDING_HEADERS as $header ) {
			if ( empty( $_SERVER[ $header ] ) ) {
				continue;
			}

			$forwarded = trim( explode( ',', wp_unslash( $_SERVER[ $header ] ) )[0] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Validated as an IP address below.
			if ( ! filter_var( $forwarded, FILTER_VALIDATE_IP ) || inet_pton( $forwarded ) !== inet_pton( $ip ) ) {
				return '';
			}
		}

		return $ip;
	}

	/**
	 * Refuse a block list that covers the visitor's own address, which would lock them out of the site.
	 *
	 * A list is allowed when the address is unknown, so a wrong guess can't stop a legitimate save.
	 *
	 * @param string $list The block list being saved: addresses, ranges or CIDR blocks.
	 * @return true|WP_Error
	 */
	public static function validate_ip_block_list( $list ) {
		$ip = self::get_current_ip();
		if ( '' === $ip ) {
			return true;
		}

		if ( ! self::ip_list_covers( $list, $ip ) ) {
			return true;
		}

		// The firewall checks the allow list first, so this address would never actually be blocked.
		if (
			class_exists( Waf_Rules_Manager::class )
			&& Waf_Rules_Manager::ip_allow_list_enabled()
			&& self::ip_list_covers( (string) get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '' ), $ip )
		) {
			return new WP_Error(
				'ip_block_list_includes_allowed_ip',
				sprintf(
					/* translators: %s is the visitor's IP address. */
					__( 'Your IP address (%s) is on your allow list, so it can\'t be added to the block list. Remove it, or the range that includes it, from the block list and try again.', 'jetpack-protect-pkg' ),
					$ip
				)
			);
		}

		return new WP_Error(
			'ip_block_list_includes_current_ip',
			sprintf(
				/* translators: %s is the visitor's IP address. */
				__( 'Your IP address (%s) is on the block list, so saving it would block you from your own site. Remove it, or the range that includes it, and try again.', 'jetpack-protect-pkg' ),
				$ip
			)
		);
	}

	/**
	 * Whether an IP list includes an address, through the address itself, a range or a CIDR block.
	 *
	 * @param string $list Addresses, ranges or CIDR blocks.
	 * @param string $ip   The address to look for.
	 * @return bool
	 */
	private static function ip_list_covers( $list, $ip ) {
		foreach ( IP_Utils::get_ip_addresses_from_string( $list ) as $entry ) {
			// Split as the firewall does: a CIDR block, a hyphenated range or a single address.
			$range    = strpos( $entry, '/' ) !== false ? array( $entry, null ) : explode( '-', $entry );
			$is_match = count( $range ) === 2
				? IP_Utils::ip_address_is_in_range( $ip, $range[0], $range[1] )
				: inet_pton( $entry ) === inet_pton( $ip );

			if ( $is_match ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * The firewall's IP lists, keyed like the Jetpack settings that hold them.
	 *
	 * @return array<string, string|bool>|object An empty object when the WAF package isn't loaded, so it's `{}` in JSON.
	 */
	private static function get_ip_rules() {
		if ( ! class_exists( Waf_Rules_Manager::class ) ) {
			return (object) array();
		}

		return array(
			Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME => (string) get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME, '' ),
			Waf_Rules_Manager::IP_BLOCK_LIST_ENABLED_OPTION_NAME => (bool) Waf_Rules_Manager::ip_block_list_enabled(),
			Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME => (string) get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '' ),
			Waf_Rules_Manager::IP_ALLOW_LIST_ENABLED_OPTION_NAME => (bool) Waf_Rules_Manager::ip_allow_list_enabled(),
		);
	}

	/**
	 * Returns the blocks unchanged, since the card no longer reads the request log.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param array $blocks  Blocks from the blocklog table, newest first.
	 * @param array $entries Decoded request log entries, oldest first.
	 * @return array The blocks, unchanged.
	 */
	public static function add_request_details( array $blocks, array $entries ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Kept for callers.
		_deprecated_function( __METHOD__, 'package-$$next-version$$' );
		return $blocks;
	}

	/**
	 * The last 10 blocked requests, newest first.
	 *
	 * @return array
	 */
	private static function get_recent_blocks() {
		if ( ! method_exists( Waf_Blocklog_Manager::class, 'get_recent_blocks' ) ) {
			return array();
		}

		return Waf_Blocklog_Manager::get_recent_blocks( 10 );
	}
}
