<?php
/**
 * Tools to manage things related to "Jetpack Manage"
 * - Add Jetpack Manage menu item.
 * - Keep track of whether a user is an agency (used by the menu item and the banner)
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Utils;
use Automattic\Jetpack\Redirect;
use WP_Error;
use WP_Rest_Response;

/**
 * Jetpack Manage features in My Jetpack.
 */
class Jetpack_Manage {
	/**
	 * User meta holding the partner type WordPress.com last reported for that user.
	 *
	 * Keyed per user because the lookup is signed as one, and stored rather than cached because
	 * the sidebar needs an answer on every admin page load without waiting for a request.
	 *
	 * @var string
	 */
	const PARTNER_TYPE_USER_META_KEY = 'jetpack_partner_type';

	/**
	 * Cron hook that looks a user's partner type up and stores it.
	 *
	 * @var string
	 */
	const PARTNER_TYPE_REFRESH_HOOK = 'jetpack_manage_refresh_partner_type';

	/**
	 * Prefix of the transient that backs off after a lookup failed to produce an answer.
	 *
	 * The current user's ID completes the key, like the meta it guards.
	 *
	 * @var string
	 */
	const PARTNER_TYPE_RETRY_TRANSIENT_PREFIX = 'jetpack_partner_type_retry_';

	/**
	 * Key of the transient this class used before the answer moved to per-user meta.
	 *
	 * @deprecated $$next-version$$ Nothing reads it; the answer now lives in PARTNER_TYPE_USER_META_KEY.
	 *
	 * @var string
	 */
	const PARTNER_TYPE_TRANSIENT_KEY = 'jetpack_partner_type';

	/**
	 * Stored partner type when the lookup found that this user has no partner account.
	 *
	 * "No partner" is a real answer and needs a value of its own to be distinguishable from
	 * "never looked up", which is what an absent meta value means.
	 *
	 * @var string
	 */
	private const NO_PARTNER = 'none';

	/**
	 * How long a stored partner type is trusted before a refresh is scheduled.
	 *
	 * @var int
	 */
	private const PARTNER_TYPE_MAX_AGE = DAY_IN_SECONDS;

	/**
	 * How long after a session starts the refresh runs.
	 *
	 * Far enough out to stay clear of the login and the first page loads after it; the stored
	 * answer is what the sidebar reads in the meantime.
	 *
	 * @var int
	 */
	private const PARTNER_TYPE_REFRESH_DELAY = 5 * MINUTE_IN_SECONDS;

	/**
	 * How much random delay is added on top, so simultaneous logins do not all fire at once.
	 *
	 * WP-Cron runs every due event in one pass, and each of these can wait on WordPress.com for
	 * the Client's default timeout, so an unspread burst lands as one long serial run.
	 *
	 * @var int
	 */
	private const PARTNER_TYPE_REFRESH_JITTER = 5 * MINUTE_IN_SECONDS;

	/**
	 * How long to wait before asking again after a lookup that produced no answer.
	 *
	 * @var int
	 */
	private const PARTNER_TYPE_RETRY_DELAY = 15 * MINUTE_IN_SECONDS;

	/**
	 * Initialize the class and hooks needed.
	 */
	public static function init() {
		add_action( 'admin_menu', array( self::class, 'add_submenu_jetpack' ) );

		// Both only schedule; the request itself runs in cron. `admin_init` also catches sessions
		// that started before this shipped, and SSO, which logs in over a GET that skips wp_login.
		add_action( 'wp_login', array( self::class, 'schedule_partner_type_refresh_on_login' ), 10, 2 );
		add_action( 'admin_init', array( self::class, 'maybe_schedule_partner_type_refresh' ) );
		add_action( self::PARTNER_TYPE_REFRESH_HOOK, array( self::class, 'refresh_partner_type' ) );

		add_action( 'jetpack_unlinked_user', array( self::class, 'forget_partner_type' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'my-jetpack/v1',
			'jetpack-manage/data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_jetpack_manage_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'jetpack-manage/dismiss-banner',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::dismiss_banner',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capabilities to access historically active modules.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * The page to be added to submenu
	 *
	 * @return void|null|string The resulting page's hook_suffix
	 */
	public static function add_submenu_jetpack() {
		/*
		 * Jetpack Manage is an agency product, and anyone else following this link lands on its
		 * signup page. This runs first because it reads stored user meta, while the check below
		 * can call WordPress.com — so the sites that fail it, which is most of them, pay nothing.
		 */
		if ( ! self::is_agency_account() ) {
			return;
		}

		// Do not display the menu if the user has < 2 sites.
		if ( ! self::could_use_jp_manage( 2 ) ) {
			return;
		}

		$args = array();

		$blog_id = Connection_Manager::get_site_id( true );
		if ( $blog_id ) {
			$args = array( 'site' => $blog_id );
		}

		return Admin_Menu::add_menu(
			__( 'Jetpack Manage', 'jetpack-my-jetpack' ),
			_x( 'Jetpack Manage', 'product name shown in menu', 'jetpack-my-jetpack' ) . ' <span aria-hidden="true">↗</span>',
			'manage_options',
			esc_url( Redirect::get_url( 'cloud-manage-dashboard-wp-menu', $args ) ),
			null,
			Admin_Menu::POSITION_EXTERNAL,
			array( 'key' => 'jetpack-manage' )
		);
	}

	/**
	 * Check if the user has enough sites to be able to use Jetpack Manage.
	 *
	 * @param int $min_sites Minimum number of sites to be able to use Jetpack Manage.
	 *
	 * @return bool Return true if the user has enough sites to be able to use Jetpack Manage.
	 */
	public static function could_use_jp_manage( $min_sites = 2 ) {
		// Only proceed if the user is connected to WordPress.com.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return false;
		}

		// Do not display the menu if Jetpack plugin is not installed.
		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}

		// Do not display the menu on Multisite.
		if ( is_multisite() ) {
			return false;
		}

		// Check if the user has the minimum number of sites.
		$user_data = ( new Connection_Manager() )->get_connected_user_data( get_current_user_id() );
		if ( ! isset( $user_data['site_count'] ) || $user_data['site_count'] < $min_sites ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if the user is a partner/agency.
	 *
	 * Answers from what the last lookup stored and never makes a request, because the sidebar
	 * asks on every admin page load. A user nobody has looked up yet reads as not an agency.
	 *
	 * @return bool Return true if the user is a partner/agency, otherwise false.
	 */
	public static function is_agency_account() {
		// Only proceed if the user is connected to WordPress.com.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return false;
		}

		$stored = self::get_stored_partner_type( get_current_user_id() );

		return null !== $stored && 'agency' === $stored['type'];
	}

	/**
	 * Check if the user is a partner/agency, looking them up first if nobody has yet.
	 *
	 * For the surfaces that decide whether to offer an agency signup, where answering "not an
	 * agency" for a real agency is worse than the wait. Everything else wants is_agency_account().
	 *
	 * @return bool Return true if the user is a partner/agency, otherwise false.
	 */
	public static function is_agency_account_now() {
		self::refresh_partner_type_if_stale( get_current_user_id() );

		return self::is_agency_account();
	}

	/**
	 * Schedule a partner type refresh for the user who just logged in.
	 *
	 * @param string        $user_login Username, unused.
	 * @param \WP_User|null $user       The user who logged in.
	 * @return void
	 */
	public static function schedule_partner_type_refresh_on_login( $user_login, $user = null ) {
		if ( $user instanceof \WP_User ) {
			self::maybe_schedule_partner_type_refresh( $user->ID );
		}
	}

	/**
	 * Queue a partner type lookup, unless a fresh answer or a pending job makes it pointless.
	 *
	 * Every check here reads options or user meta, so this stays free to call on `admin_init`.
	 *
	 * @param int|string|null $user_id User to look up. Anything falsy means the current user,
	 *                                 which is what `admin_init` passes: `''`, not nothing.
	 * @return void
	 */
	public static function maybe_schedule_partner_type_refresh( $user_id = null ) {
		$user_id = $user_id ? (int) $user_id : get_current_user_id();

		// Nothing to ask WordPress.com about a user it does not know.
		if ( ! $user_id || ! ( new Connection_Manager() )->is_user_connected( $user_id ) ) {
			return;
		}

		if ( ! self::is_partner_type_stale( $user_id ) || self::is_backing_off( $user_id ) ) {
			return;
		}

		$args = array( $user_id );
		$next = wp_next_scheduled( self::PARTNER_TYPE_REFRESH_HOOK, $args );

		if ( $next > time() ) {
			return;
		}

		// An event still pending after its time means cron is not running it. Clearing it keeps
		// wp_next_scheduled() from reporting it forever, which would suppress every later attempt.
		if ( $next ) {
			wp_unschedule_event( $next, self::PARTNER_TYPE_REFRESH_HOOK, $args );
		}

		wp_schedule_single_event(
			time() + self::PARTNER_TYPE_REFRESH_DELAY + wp_rand( 0, self::PARTNER_TYPE_REFRESH_JITTER ),
			self::PARTNER_TYPE_REFRESH_HOOK,
			$args
		);
	}

	/**
	 * Look a user's partner type up at WordPress.com and store it.
	 *
	 * Signs as `$user_id` explicitly rather than through `wpcom_json_api_request_as_user()`,
	 * which signs as the current user — and a cron request has none.
	 *
	 * @param int $user_id User to look up.
	 * @return void
	 */
	public static function refresh_partner_type( $user_id ) {
		$user_id = (int) $user_id;

		if ( ! $user_id || ! ( new Connection_Manager() )->is_user_connected( $user_id ) ) {
			return;
		}

		$request_args            = Client::validate_args_for_wpcom_json_api_request( '/jetpack-partners', '2', array( 'method' => 'GET' ) );
		$request_args['user_id'] = $user_id;

		$wpcom_response = Client::remote_request( $request_args );
		$response_code  = (int) wp_remote_retrieve_response_code( $wpcom_response );

		/*
		 * Only these two settle the question: 200 carries the partner record, and 403 is how the
		 * endpoint reports a user with no partner account, which is most of them. Anything else —
		 * a transport failure, a rejected token, a rate limit, a 5xx — says nothing about this
		 * user, and storing it would mean answering "not an agency" until the age limit runs out.
		 */
		if ( is_wp_error( $wpcom_response ) || ! in_array( $response_code, array( 200, 403 ), true ) ) {
			self::back_off( $user_id );
			return;
		}

		$partner_data = 200 === $response_code
			? json_decode( wp_remote_retrieve_body( $wpcom_response ) )
			: array();

		// A 200 that did not parse is a truncated body or an error page, not an empty answer.
		if ( ! is_array( $partner_data ) ) {
			self::back_off( $user_id );
			return;
		}

		// The endpoint returns a single-element array; it uses Jetpack_Partner::find_by_owner.
		$partner_type = count( $partner_data ) === 1 && isset( $partner_data[0]->partner_type )
			? $partner_data[0]->partner_type
			: self::NO_PARTNER;

		delete_transient( self::retry_transient_key( $user_id ) );

		update_user_meta(
			$user_id,
			self::PARTNER_TYPE_USER_META_KEY,
			array(
				'type'          => $partner_type,
				'time'          => time(),
				'wpcom_user_id' => Utils::get_wpcom_user_id( $user_id ),
			)
		);
	}

	/**
	 * Drop a user's stored partner type when they disconnect from WordPress.com.
	 *
	 * @param int $user_id Disconnected user.
	 * @return void
	 */
	public static function forget_partner_type( $user_id ) {
		$user_id = (int) $user_id;

		delete_user_meta( $user_id, self::PARTNER_TYPE_USER_META_KEY );
		delete_transient( self::retry_transient_key( $user_id ) );

		// A queued refresh would outlive the reason it was queued for.
		wp_clear_scheduled_hook( self::PARTNER_TYPE_REFRESH_HOOK, array( $user_id ) );
	}

	/**
	 * The partner type stored for a user, if a lookup has ever completed for them.
	 *
	 * The answer describes a WordPress.com account, so it is discarded once this local user is
	 * bound to a different one. A site disconnect leaves the meta behind, and the binding is
	 * cleared whenever tokens are rewritten, so without this a reconnect under another account
	 * would be answered by the previous one.
	 *
	 * @param int $user_id User to read.
	 * @return array{type: string, time: int, wpcom_user_id: int}|null Null when nothing usable is stored.
	 */
	private static function get_stored_partner_type( $user_id ) {
		$user_id = (int) $user_id;
		$stored  = $user_id ? get_user_meta( $user_id, self::PARTNER_TYPE_USER_META_KEY, true ) : '';

		if ( ! is_array( $stored ) || ! isset( $stored['type'] ) || ! isset( $stored['time'] ) ) {
			return null;
		}

		$bound = Utils::get_wpcom_user_id( $user_id );

		// Answers written before this field existed carry 0, as does an unbound user; neither is
		// a mismatch to act on, so only a known binding that disagrees discards the answer.
		if ( $bound && ! empty( $stored['wpcom_user_id'] ) && (int) $stored['wpcom_user_id'] !== $bound ) {
			return null;
		}

		return $stored;
	}

	/**
	 * Whether a user's stored partner type is missing or old enough to ask again.
	 *
	 * @param int $user_id User to check.
	 * @return bool
	 */
	private static function is_partner_type_stale( $user_id ) {
		$stored = self::get_stored_partner_type( $user_id );

		return null === $stored || $stored['time'] <= time() - self::PARTNER_TYPE_MAX_AGE;
	}

	/**
	 * Look a user's partner type up now, unless a fresh answer or a recent failure says not to.
	 *
	 * The scheduled refresh is the normal path. This is the one for a site whose cron never runs,
	 * so it belongs only to callers that can afford to wait for WordPress.com.
	 *
	 * @param int $user_id User to look up.
	 * @return void
	 */
	public static function refresh_partner_type_if_stale( $user_id ) {
		if ( self::is_partner_type_stale( $user_id ) && ! self::is_backing_off( $user_id ) ) {
			self::refresh_partner_type( $user_id );
		}
	}

	/**
	 * Wait before asking about this user again.
	 *
	 * A lookup that produced no answer stores nothing, so without this every later caller would
	 * repeat it — once per My Jetpack page load for as long as WordPress.com is unreachable.
	 *
	 * @param int $user_id User whose lookup failed.
	 * @return void
	 */
	private static function back_off( $user_id ) {
		set_transient( self::retry_transient_key( $user_id ), time(), self::PARTNER_TYPE_RETRY_DELAY );
	}

	/**
	 * Whether a recent lookup for this user failed to produce an answer.
	 *
	 * @param int $user_id User to check.
	 * @return bool
	 */
	private static function is_backing_off( $user_id ) {
		return (bool) get_transient( self::retry_transient_key( $user_id ) );
	}

	/**
	 * The transient key backing off further lookups for a user.
	 *
	 * @param int $user_id User to key by.
	 * @return string
	 */
	private static function retry_transient_key( $user_id ) {
		return self::PARTNER_TYPE_RETRY_TRANSIENT_PREFIX . (int) $user_id;
	}

	/**
	 * Check whether the Automattic for Agencies banner has been dismissed on this site.
	 *
	 * The dismissal is stored per site rather than per user: whether the people running this site
	 * want an agency partnership is a property of the site, not of an individual login, so one
	 * admin dismissing the banner settles it for everyone.
	 *
	 * The trade-off is worth stating, because the rest of this payload does not work that way.
	 * `could_use_jp_manage()` and `is_agency_account()` are both computed from the *current*
	 * admin's WordPress.com account, so a second admin who would have been shown the banner
	 * cannot bring it back once someone else has dismissed it.
	 *
	 * @return bool True if the banner has been dismissed.
	 */
	public static function is_banner_dismissed() {
		return (bool) \Jetpack_Options::get_option( 'dismissed_a4a_banner', false );
	}

	/**
	 * Dismiss the Automattic for Agencies banner.
	 *
	 * @return WP_REST_Response
	 */
	public static function dismiss_banner() {
		\Jetpack_Options::update_option( 'dismissed_a4a_banner', true );

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get Jetpack Manage data for REST API.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public static function get_jetpack_manage_data() {
		$is_enabled        = self::could_use_jp_manage();
		$is_agency_account = self::is_agency_account_now();

		return rest_ensure_response(
			array(
				'isEnabled'       => $is_enabled,
				'isAgencyAccount' => $is_agency_account,
				'isDismissed'     => self::is_banner_dismissed(),
			)
		);
	}
}
