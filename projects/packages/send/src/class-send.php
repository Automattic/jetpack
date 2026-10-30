<?php
/**
 * Jetpack Send bootstrap.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Wires Jetpack Send's hooks.
 */
class Send {

	/**
	 * Package version, bumped at release through composer.json `version-constants`.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether init() already ran.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the hooks once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		Admin_Page::init();
		Email_Log::init();
		Dns_Watch::init();
		Ready_Notice::init();
		add_action( 'rest_api_init', array( REST_Controller::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( Dns_REST_Controller::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( Cloudflare_REST_Controller::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( Debug_REST_Controller::class, 'register_routes' ) );
		add_filter( 'pre_wp_mail', array( Mailer::class, 'pre_wp_mail' ), 10, 2 );
		// What the host's mail did with an email Send handed it.
		add_action( 'wp_mail_succeeded', array( Mailer::class, 'host_succeeded' ) );
		add_action( 'wp_mail_failed', array( Mailer::class, 'host_failed' ) );
		add_action( 'shutdown', array( Mailer::class, 'clear_pending' ) );
		// Background work that only adds, on admin pages; deleting is left to the hourly job.
		add_action( 'admin_init', array( Stats::class, 'backfill_batch' ), 10, 0 );
		add_action( 'admin_init', array( Email_Log::class, 'backfill_batch' ), 10, 0 );
		add_action( 'admin_init', array( Debug_Log::class, 'expire_if_due' ), 10, 0 );
	}

	/**
	 * Remove everything Send stored on the site: the log, counts and debug tables and their options too.
	 *
	 * @return void
	 */
	public static function uninstall() {
		Dns_Watch::stop();
		Onboarding::delete();
		Onboarding::delete_test_history();
		Email_Log::drop_table();
		Settings::delete();
		Account::delete();
		delete_transient( REST_Controller::CHECK_DNS_THROTTLE );
	}
}
