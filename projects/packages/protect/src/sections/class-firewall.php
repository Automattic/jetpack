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
use Automattic\Jetpack\Waf\Waf_Request;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
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
				'hasScan'     => Dashboard::has_scan_plan(),
				'currentIp'   => self::get_current_ip(),
				'manualRules' => self::get_manual_rules(),
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
	 * The IP lists the firewall enforces.
	 *
	 * @return array{blockList: string, blockListEnabled: bool, allowList: string, allowListEnabled: bool}
	 */
	public static function get_manual_rules() {
		if ( ! class_exists( Waf_Rules_Manager::class ) ) {
			return array(
				'blockList'        => '',
				'blockListEnabled' => false,
				'allowList'        => '',
				'allowListEnabled' => false,
			);
		}

		return array(
			'blockList'        => (string) get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME, '' ),
			'blockListEnabled' => (bool) Waf_Rules_Manager::ip_block_list_enabled(),
			'allowList'        => (string) get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '' ),
			'allowListEnabled' => (bool) Waf_Rules_Manager::ip_allow_list_enabled(),
		);
	}

	/**
	 * The last 10 blocked requests, newest first.
	 *
	 * @return array
	 */
	public static function get_recent_blocks() {
		if ( ! method_exists( Waf_Blocklog_Manager::class, 'get_recent_blocks' ) ) {
			return array();
		}

		return Waf_Blocklog_Manager::get_recent_blocks( 10 );
	}
}
