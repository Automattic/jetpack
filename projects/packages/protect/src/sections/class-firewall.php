<?php
/**
 * Protect dashboard: the Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;
use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Request;
use Automattic\Jetpack\Waf\Waf_Runner;
use Automattic\Jetpack\Waf\Waf_Self_Check;
use WP_Error;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The firewall's on/off state, blocked request counts and a request it always blocks, to test it.
 *
 * @since $$next-version$$
 */
class Firewall implements Dashboard_Section {

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
				'hasScan'    => Dashboard::has_scan_plan(),
				'currentIp'  => self::get_current_ip(),
				'sharesData' => self::shares_data(),
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
	 * The recent blocks and the all-time count, refreshed after a test.
	 *
	 * @return array
	 */
	public static function get_blocks() {
		return array(
			'recentBlocks' => self::get_recent_blocks(),
			'blockedCount' => class_exists( Waf_Blocklog_Manager::class )
				? Waf_Blocklog_Manager::get_all_time_block_count()
				: null,
		);
	}

	/**
	 * The visitor's IP address as the firewall sees it, for "Add my IP address" on the always-allowed list.
	 *
	 * Behind a proxy, `X-Forwarded-For` can name the proxy for every visitor; allowing it would exempt all traffic.
	 *
	 * @return string Empty when the WAF package isn't loaded.
	 */
	public static function get_current_ip() {
		if ( ! class_exists( Waf_Request::class ) ) {
			return '';
		}

		return (string) ( new Waf_Request() )->get_real_user_ip_address();
	}

	/**
	 * Whether the firewall keeps its request log, the "Share basic data" setting.
	 *
	 * @return bool
	 */
	public static function shares_data() {
		return class_exists( Waf_Runner::class ) && (bool) get_option( Waf_Runner::SHARE_DATA_OPTION_NAME );
	}

	/**
	 * The last 10 blocked requests, newest first, with their request details when the request log has them.
	 *
	 * @return array
	 */
	public static function get_recent_blocks() {
		if ( ! method_exists( Waf_Blocklog_Manager::class, 'get_recent_blocks' ) ) {
			return array();
		}

		$blocks = Waf_Blocklog_Manager::get_recent_blocks( 10 );

		return self::shares_data() ? self::add_request_details( $blocks, self::read_request_log() ) : $blocks;
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
				$block['uri'] = substr( $entry['request_uri'], 0, 2048 );
			}
			if ( ! empty( $entry['user_agent'] ) && is_string( $entry['user_agent'] ) ) {
				$block['userAgent'] = substr( $entry['user_agent'], 0, 512 );
			}
		}

		return $blocks;
	}

	/**
	 * The newest entries of the firewall's request log, oldest first.
	 *
	 * @return array
	 */
	private static function read_request_log() {
		if ( ! class_exists( Waf_Constants::class ) ) {
			return array();
		}
		Waf_Constants::define_waf_directory();

		$path = JETPACK_WAF_DIR . '/waf-blocklog';
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

		$entries = array();
		foreach ( $lines as $line ) {
			$entry = json_decode( $line, true );
			if ( is_array( $entry ) ) {
				$entries[] = $entry;
			}
		}

		return $entries;
	}
}
