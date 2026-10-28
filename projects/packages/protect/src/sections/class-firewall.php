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
use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Request;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;
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
	 * Today and the last 30 days are UTC days, as the firewall records them.
	 *
	 * @return array
	 */
	public static function get_blocks() {
		$counts = class_exists( Waf_Stats::class ) ? Waf_Stats::get_blocked_requests() : array();

		return array(
			'recentBlocks'      => self::get_recent_blocks(),
			'blockedCount'      => isset( $counts['all_time'] ) ? (int) $counts['all_time'] : null,
			'blockedToday'      => isset( $counts['current_day'] ) ? (int) $counts['current_day'] : null,
			'blockedLast30Days' => isset( $counts['thirty_days'] ) ? (int) $counts['thirty_days'] : null,
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
	 * Whether the firewall keeps its request log, the "Share basic data" setting.
	 *
	 * @return bool
	 */
	private static function shares_data() {
		return class_exists( Waf_Runner::class ) && (bool) get_option( Waf_Runner::SHARE_DATA_OPTION_NAME );
	}

	/**
	 * The last 10 blocked requests, newest first, with their request details when the request log has them.
	 *
	 * @return array
	 */
	private static function get_recent_blocks() {
		if ( ! method_exists( Waf_Blocklog_Manager::class, 'get_recent_blocks' ) ) {
			return array();
		}

		$blocks = Waf_Blocklog_Manager::get_recent_blocks( 10 );

		if ( ! $blocks || ! self::shares_data() ) {
			return $blocks;
		}

		$oldest = end( $blocks )['timestamp'];

		return self::add_request_details( $blocks, self::read_request_log( $oldest ) );
	}

	/**
	 * Match each block to its entry in the request log, by second and rule.
	 *
	 * @param array $blocks  Blocks from the blocklog table, newest first.
	 * @param array $entries Decoded request log entries, oldest first.
	 * @return array The blocks, with `uri` and `userAgent` where an entry matched.
	 */
	public static function add_request_details( array $blocks, array $entries ) {
		$by_key = array();
		foreach ( $entries as $entry ) {
			if ( isset( $entry['rule_id'] ) && is_string( $entry['timestamp'] ?? null ) ) {
				$by_key[ str_replace( ' ', 'T', $entry['timestamp'] ) . 'Z|' . (int) $entry['rule_id'] ][] = $entry;
			}
		}

		foreach ( $blocks as &$block ) {
			$key = $block['timestamp'] . '|' . $block['ruleId'];
			// Several blocks in one second: the newest block takes the newest entry.
			$entry = empty( $by_key[ $key ] ) ? null : array_pop( $by_key[ $key ] );
			if ( ! $entry ) {
				continue;
			}
			if ( ! empty( $entry['request_uri'] ) && is_string( $entry['request_uri'] ) ) {
				$block['uri'] = self::truncate( $entry['request_uri'], 2048 );
			}
			if ( ! empty( $entry['user_agent'] ) && is_string( $entry['user_agent'] ) ) {
				$block['userAgent'] = self::truncate( $entry['user_agent'], 512 );
			}
		}
		unset( $block );

		return $blocks;
	}

	/**
	 * A string cut to a byte length, without splitting a multibyte character.
	 *
	 * @param string $value  The string.
	 * @param int    $length The most bytes to keep.
	 * @return string
	 */
	private static function truncate( $value, $length ) {
		return function_exists( 'mb_strcut' ) ? mb_strcut( $value, 0, $length, 'UTF-8' ) : substr( $value, 0, $length );
	}

	/**
	 * The firewall's request log entries since a block, oldest first.
	 *
	 * @param string $since The oldest block's timestamp, as `get_recent_blocks()` formats it.
	 * @return array
	 */
	private static function read_request_log( $since ) {
		if ( ! class_exists( Waf_Constants::class ) ) {
			return array();
		}
		Waf_Constants::define_waf_directory();

		$path = Waf_Blocklog_Manager::get_blocklog_file_path();
		$size = is_readable( $path ) ? filesize( $path ) : 0;
		if ( ! $size ) {
			return array();
		}

		// The log can grow to 100 MB; its tail holds the last 10 blocks.
		$tail_size = 256 * 1024;
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- Read-only, from an offset.
		$handle = fopen( $path, 'rb' );
		if ( ! $handle ) {
			return array();
		}
		fseek( $handle, max( 0, $size - $tail_size ) );
		$tail = (string) fread( $handle, $tail_size ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fread
		fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

		$lines = explode( "\n", $tail );
		if ( $size > $tail_size ) {
			array_shift( $lines ); // Starts mid-entry.
		}

		// The log's timestamps are `Y-m-d H:i:s`, which sort as text.
		$since   = str_replace( array( 'T', 'Z' ), array( ' ', '' ), $since );
		$entries = array();
		foreach ( array_reverse( $lines ) as $line ) {
			$entry = json_decode( $line, true );
			if ( ! is_array( $entry ) ) {
				continue;
			}
			if ( is_string( $entry['timestamp'] ?? null ) && $entry['timestamp'] < $since ) {
				break;
			}
			$entries[] = $entry;
		}

		return array_reverse( $entries );
	}
}
