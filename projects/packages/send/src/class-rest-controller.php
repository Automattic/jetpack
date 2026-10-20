<?php
/**
 * REST routes for the Send dashboard.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * `jetpack-send/v1` routes; all require `manage_options`.
 */
class REST_Controller {

	const API_NAMESPACE = 'jetpack-send/v1';
	const STATUS_PATH   = '/jetpack-send/v1/status';

	/**
	 * Transient that throttles POST /check-dns to one mail-service check per window.
	 *
	 * @var string
	 */
	const CHECK_DNS_THROTTLE = 'jetpack_send_check_dns';

	/**
	 * Seconds between mail-service checks from POST /check-dns.
	 *
	 * @var int
	 */
	const CHECK_DNS_WINDOW = 60;

	/**
	 * The widest `days` or `range` filter GET /log takes, about a hundred years.
	 *
	 * @var int
	 */
	const MAX_LOG_DAYS = 36500;

	/**
	 * The longest custom range GET /stats takes, in days.
	 *
	 * @var int
	 */
	const MAX_STATS_DAYS = 365;

	/**
	 * How the Source filter's values look: a kind of WordPress email, a plugin's folder or a theme's slug.
	 *
	 * @var string
	 */
	const ORIGIN_PATTERN = '/^(core(:[a-z_]+)?|plugin:[A-Za-z0-9._-]+|theme:[A-Za-z0-9._-]+)$/';

	/**
	 * The most rows POST /log/delete takes at once: one page of GET /log at its largest.
	 *
	 * @var int
	 */
	const MAX_DELETE_IDS = 100;

	/**
	 * Avatar size asked for, in pixels: three times the largest round avatar on the page.
	 *
	 * @var int
	 */
	const AVATAR_SIZE = 120;

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		$id_arg   = array(
			'id' => array(
				'type'    => 'integer',
				'minimum' => 1,
			),
		);
		$day      = array(
			'type'    => 'string',
			'pattern' => '^\\d{4}-\\d{2}-\\d{2}$',
		);
		$day_args = array(
			'start' => $day,
			'end'   => $day,
		);
		$routes   = array(
			'/status'                 => array( WP_REST_Server::READABLE, 'get_status', array() ),
			'/setup'                  => array(
				WP_REST_Server::CREATABLE,
				'setup',
				array(
					'domain' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			),
			'/check-dns'              => array( WP_REST_Server::CREATABLE, 'check_dns', array() ),
			'/settings'               => array(
				WP_REST_Server::CREATABLE,
				'update_settings',
				array(
					'enabled'            => array( 'type' => 'boolean' ),
					'fallback'           => array( 'type' => 'boolean' ),
					'auto_enable'        => array( 'type' => 'boolean' ),
					'from_name'          => array( 'type' => 'string' ),
					'from_local_part'    => array( 'type' => 'string' ),
					'reply_to'           => array( 'type' => 'string' ),
					'onboarding'         => array( 'type' => 'object' ),
					'log_retention_days' => array(
						'type' => 'integer',
						'enum' => Settings::RETENTION_DAYS,
					),
					'debug_log'          => array( 'type' => 'boolean' ),
					'debug_log_days'     => array(
						'type' => 'integer',
						'enum' => Settings::DEBUG_DAYS,
					),
				),
			),
			'/test'                   => array(
				WP_REST_Server::CREATABLE,
				'send_test',
				array(
					'to' => array( 'type' => 'string' ),
				),
			),
			'/usage'                  => array( WP_REST_Server::READABLE, 'get_usage', array() ),
			'/stats'                  => array(
				WP_REST_Server::READABLE,
				'get_stats',
				array(
					'range' => array(
						'type'    => 'integer',
						'enum'    => Period::PRESETS,
						'default' => 90,
					),
				) + $day_args,
			),
			'/log'                    => array(
				WP_REST_Server::READABLE,
				'get_log',
				array(
					'page'     => array(
						'type'    => 'integer',
						'minimum' => 1,
						'default' => 1,
					),
					'per_page' => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 100,
						'default' => 20,
					),
					'search'   => array(
						'type'    => 'string',
						'default' => '',
					),
					// Lists come as arrays, comma strings or one value; each matches any of its values.
					'status'   => self::list_arg( array( Email_Log::STATUS_SENT, Email_Log::STATUS_FALLBACK, Email_Log::STATUS_FAILED ) ),
					'origin'   => self::list_arg( array(), self::ORIGIN_PATTERN ),
					'source'   => self::list_arg( array( 'wp_mail', 'test', 'resend' ) ),
					// 1 is the last 24 hours, N the last N site-local days, counted as GET /stats counts them.
					'range'    => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => self::MAX_LOG_DAYS,
					),
					// Older links: 1 is today, N the same as `range`; 0 for any date.
					'days'     => array(
						'type'    => 'integer',
						'minimum' => 0,
						'maximum' => self::MAX_LOG_DAYS,
						'default' => 0,
					),
				) + $day_args,
			),
			'/log/origins'            => array( WP_REST_Server::READABLE, 'get_log_origins', array() ),
			'/log/summary'            => array( WP_REST_Server::READABLE, 'get_log_summary', array() ),
			'/log/(?P<id>\d+)'        => array(
				array( WP_REST_Server::READABLE, 'get_log_entry', $id_arg ),
				array( WP_REST_Server::DELETABLE, 'delete_log_entry', $id_arg ),
			),
			'/log/(?P<id>\d+)/resend' => array(
				WP_REST_Server::CREATABLE,
				'resend_log_entry',
				$id_arg + array(
					'to'  => array(
						'type'     => 'array',
						'required' => true,
						'minItems' => 1,
						'maxItems' => 100,
						'items'    => array( 'type' => 'string' ),
					),
					'cc'  => array(
						'type'     => 'array',
						'default'  => array(),
						'maxItems' => 100,
						'items'    => array( 'type' => 'string' ),
					),
					'bcc' => array(
						'type'     => 'array',
						'default'  => array(),
						'maxItems' => 100,
						'items'    => array( 'type' => 'string' ),
					),
				),
			),
			'/log/delete'             => array(
				WP_REST_Server::CREATABLE,
				'delete_log_entries',
				array(
					'ids' => array(
						'type'     => 'array',
						'required' => true,
						'minItems' => 1,
						'maxItems' => self::MAX_DELETE_IDS,
						'items'    => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
					),
				),
			),
			'/reset'                  => array( WP_REST_Server::CREATABLE, 'reset', array() ),
		);

		foreach ( $routes as $route => $definition ) {
			// A route with more than one method lists one definition per method.
			$endpoints = array();
			foreach ( is_array( $definition[0] ) ? $definition : array( $definition ) as $endpoint ) {
				list( $methods, $callback, $args ) = $endpoint;
				$endpoints[]                       = array(
					'methods'             => $methods,
					'callback'            => array( __CLASS__, $callback ),
					'permission_callback' => array( __CLASS__, 'can_manage' ),
					'args'                => $args,
				);
			}
			register_rest_route( self::API_NAMESPACE, $route, $endpoints );
		}
	}

	/**
	 * Permission check.
	 *
	 * @return bool
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * A list argument: an array (`status[0]=a`), a comma string (`status=a,b`) or one value, as a clean list.
	 * Older clients send '' for any.
	 *
	 * @since $$next-version$$
	 *
	 * @param string[] $allowed Values allowed; empty for any that match the pattern.
	 * @param string   $pattern Regular expression each value must match; '' for none.
	 * @return array The argument's definition.
	 */
	public static function list_arg( array $allowed = array(), $pattern = '' ) {
		return array(
			'default'           => array(),
			'validate_callback' => static function ( $value ) use ( $allowed, $pattern ) {
				foreach ( self::to_list( $value ) as $item ) {
					if ( ( $allowed && ! in_array( $item, $allowed, true ) ) || ( '' !== $pattern && ! preg_match( $pattern, $item ) ) ) {
						/* translators: %s: a filter value. */
						return new WP_Error( 'rest_invalid_param', sprintf( __( 'Unknown value: %s', 'jetpack-send-pkg' ), $item ), array( 'status' => 400 ) );
					}
				}
				return true;
			},
			'sanitize_callback' => array( __CLASS__, 'to_list' ),
		);
	}

	/**
	 * A list argument's values, without blanks or repeats.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $value Array, comma string or one value.
	 * @return string[]
	 */
	public static function to_list( $value ) {
		$items = is_array( $value ) ? $value : explode( ',', is_scalar( $value ) ? (string) $value : '' );
		$items = array_map( fn( $item ) => is_scalar( $item ) ? trim( (string) $item ) : '', $items );
		return array_values( array_unique( array_filter( $items, 'strlen' ) ) );
	}

	/**
	 * GET /status.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_status() {
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * The dashboard's status payload.
	 *
	 * @return array
	 */
	public static function status_data() {
		$provisioner = Provisioner_Factory::get();
		$account     = Account::get();
		$blockers    = self::enable_blockers( $account );

		$settings                       = Settings::get();
		$settings['log_retention_days'] = Email_Log::retention_setting();
		$covers_from                    = Email_Log::oldest_created_at();
		unset( $settings['debug_log_until'] );

		return array(
			'provisioner'          => $provisioner ? $provisioner->get_type() : null,
			'account'              => Account::to_public( $account ),
			'settings'             => $settings,
			'can_enable'           => array() === $blockers,
			'enable_blockers'      => $blockers,
			'suggested_domain'     => self::suggested_domain(),
			'site_title'           => wp_specialchars_decode( (string) get_bloginfo( 'name' ), ENT_QUOTES ),
			'admin_email'          => (string) get_option( 'admin_email' ),
			'current_user_email'   => (string) wp_get_current_user()->user_email,
			'connect_url'          => class_exists( '\Automattic\Jetpack\My_Jetpack\Initializer' ) ? admin_url( 'admin.php?page=my-jetpack#/connection' ) : '',
			'spf_suggestion'       => $account ? Dns_Check::spf_suggestion( self::known_spf( $account ) ) : null,
			'onboarding'           => Onboarding::state(),
			'next_check_at'        => Dns_Watch::next_check_at(),
			'sender_avatar'        => self::sender_avatar( $account ),
			'site_icon_url'        => self::site_icon_url(),
			'log_retention_days'   => Email_Log::retention_days(),
			'log_retention_locked' => Email_Log::retention_locked(),
			'log_covers_from'      => null === $covers_from ? null : Email_Log::iso( $covers_from ),
			'log_trimmed_before'   => self::trimmed_before( $covers_from ),
			'debug_log'            => Debug_Log::state(),
			'has_history'          => Stats::has_history(),
		);
	}

	/**
	 * The oldest email still in the log, when older ones were deleted from it: the counts reach an
	 * earlier site-local day. A new site's counts start the day its log does, so it gets null.
	 *
	 * @param string|null $covers_from The oldest row's UTC `Y-m-d H:i:s`.
	 * @return string|null ISO 8601 UTC.
	 */
	private static function trimmed_before( $covers_from ) {
		$since = Stats::since();
		if ( null === $covers_from || null === $since ) {
			return null;
		}
		$oldest = Period::local( (int) strtotime( $covers_from . ' UTC' ) )->format( 'Y-m-d' );
		return Period::local( $since )->format( 'Y-m-d' ) < $oldest ? Email_Log::iso( $covers_from ) : null;
	}

	/**
	 * The From address's avatar, keyed by that address so the page uses it only while it shows the same one.
	 * Before setup the address is the one setup suggests: the admin's mailbox on the domain, else `wordpress@`.
	 *
	 * @param array|null $account Stored account.
	 * @return array{email: string, url: string}|null Null with avatars off or no valid address.
	 */
	private static function sender_avatar( $account ) {
		$settings = Settings::get();
		$domain   = $account ? (string) $account['domain'] : self::suggested_domain();
		$local    = (string) $settings['from_local_part'];
		if ( ! $account && in_array( $local, array( '', 'wordpress' ), true ) ) {
			$admin = explode( '@', strtolower( (string) get_option( 'admin_email' ) ) );
			if ( 2 === count( $admin ) && $admin[1] === $domain && '' !== $admin[0] ) {
				$local = $admin[0];
			}
		}
		$email = is_email( $local . '@' . $domain );
		$url   = is_string( $email ) ? self::avatar_for_email( $email ) : null;
		return null === $url ? null : array(
			'email' => $email,
			'url'   => $url,
		);
	}

	/**
	 * The site icon, which stands in for the sender when the From address has no avatar.
	 *
	 * @return string|null Null when the site has none.
	 */
	private static function site_icon_url() {
		$url = get_site_icon_url( self::AVATAR_SIZE );
		return is_string( $url ) && '' !== $url ? $url : null;
	}

	/**
	 * The domain to suggest for sending: the site's host without `www.`.
	 *
	 * @return string
	 */
	public static function suggested_domain() {
		$domain = preg_replace( '/^www\./', '', strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ) );

		/**
		 * Filters the domain Send suggests for sending, e.g. for a site whose address is not the domain it sends from.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $domain Lowercased host of the site address, without `www.`.
		 */
		return strtolower( trim( (string) apply_filters( 'jetpack_send_suggested_domain', (string) $domain ) ) );
	}

	/**
	 * The domain's SPF record as last seen: by the latest DNS check, else at setup.
	 *
	 * @param array $account Stored account.
	 * @return string
	 */
	private static function known_spf( array $account ) {
		$check = $account['dns_check'] ?? null;
		if ( is_array( $check ) && isset( $check['existing_spf'] ) ) {
			return (string) $check['existing_spf'];
		}
		return (string) ( $account['existing_spf'] ?? '' );
	}

	/**
	 * Why sending can't be turned on yet; empty when it can.
	 *
	 * @param array|null $account Stored account.
	 * @return string[]
	 */
	public static function enable_blockers( $account ) {
		if ( ! $account ) {
			return array( 'not_set_up' );
		}
		$check = $account['dns_check'] ?? null;
		if ( ! is_array( $check ) ) {
			return array( 'dns_not_checked' );
		}

		// DMARC needs one aligned record: DKIM when the domain has a key, otherwise SPF, which is optional only then.
		$has_dkim = in_array( 'dkim', array_column( (array) ( $account['dns_records'] ?? array() ), 'purpose' ), true );
		$required = array( 'domain_lockdown', 'sender_domain', $has_dkim ? 'dkim' : 'spf' );

		$blockers = array();
		foreach ( $required as $key ) {
			if ( 'passed' !== ( $check[ $key ] ?? '' ) ) {
				$blockers[] = $key;
			}
		}
		return $blockers;
	}

	/**
	 * POST /setup.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function setup( WP_REST_Request $request ) {
		$provisioner = Provisioner_Factory::get();
		if ( ! $provisioner ) {
			return new WP_Error( 'jetpack_send_no_provisioner', __( 'Connect Jetpack before setting up Send.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$domain = self::sanitize_domain( (string) $request->get_param( 'domain' ) );
		if ( '' === $domain ) {
			return new WP_Error( 'jetpack_send_invalid_domain', __( 'Enter a domain you own, like example.com.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$result  = $provisioner->provision( $domain );
		$account = is_wp_error( $result ) ? $result : Account::from_provision( $result, $domain, $provisioner->get_type() );
		if ( is_wp_error( $account ) ) {
			return self::error_response( $account );
		}

		$account['existing_spf'] = Dns_Check::existing_spf( $domain );
		Account::save( $account );
		Settings::update( array( 'enabled' => false ) );
		delete_transient( self::CHECK_DNS_THROTTLE );
		Onboarding::restart( (string) wp_get_current_user()->user_email );
		Dns_Watch::start();
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * POST /check-dns.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function check_dns() {
		$account = Account::get();
		if ( ! $account ) {
			return self::not_set_up();
		}

		// Inside the window, answer from the last check rather than asking the mail service again.
		if ( false === get_transient( self::CHECK_DNS_THROTTLE ) ) {
			$response = ( new MailChannels_Client( $account['api_key'] ) )->check_domain( $account['domain'], (string) $account['dkim_selector'] );
			if ( is_wp_error( $response ) ) {
				return self::error_response( $response );
			}
			// Throttle only after a real answer, so a failed call doesn't hide behind a stale result.
			set_transient( self::CHECK_DNS_THROTTLE, time(), self::CHECK_DNS_WINDOW );
			$check = Dns_Check::normalize( $response, Dns_Check::existing_spf( $account['domain'] ) );
			Account::update( array( 'dns_check' => $check ) );
			self::note_dns_check( (string) $account['domain'], $check );
		}

		// The user is watching, so no automatic test: they send one themselves.
		if ( Onboarding::maybe_auto_enable() ) {
			Dns_Watch::stop();
		}
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * Note a domain check's verdicts in the debug log.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $domain The sending domain.
	 * @param array  $check  Dns_Check::normalize()'s result.
	 * @return void
	 */
	public static function note_dns_check( $domain, array $check ) {
		Debug_Log::add(
			'info',
			'domain',
			'dns.check',
			/* translators: 1: the sending permission record's verdict, 2: the signing record's, 3: the sender list's; e.g. passed. */
			sprintf( __( 'Checked the domain: permission %1$s, signing %2$s, sender list %3$s.', 'jetpack-send-pkg' ), $check['domain_lockdown'] ?? '', $check['dkim'] ?? '', $check['spf'] ?? '' ),
			array(
				'domain'        => $domain,
				'lockdown'      => $check['domain_lockdown'] ?? '',
				'dkim'          => $check['dkim'] ?? '',
				'spf'           => $check['spf'] ?? '',
				'sender_domain' => $check['sender_domain'] ?? '',
			)
		);
	}

	/**
	 * POST /settings.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function update_settings( WP_REST_Request $request ) {
		$changes = array();
		foreach ( array( 'enabled', 'fallback', 'auto_enable', 'from_name', 'from_local_part', 'reply_to', 'log_retention_days', 'debug_log_days' ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$changes[ $key ] = $request->get_param( $key );
			}
		}
		$onboarding = $request->has_param( 'onboarding' ) ? $request->get_param( 'onboarding' ) : null;
		$debug      = $request->has_param( 'debug_log' ) ? (bool) $request->get_param( 'debug_log' ) : null;

		if ( isset( $changes['log_retention_days'] ) && Email_Log::retention_locked() ) {
			return new WP_Error( 'jetpack_send_retention_locked', __( 'Your site’s code sets how long emails are kept.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		if ( ! empty( $changes['enabled'] ) ) {
			$blockers = self::enable_blockers( Account::get() );
			if ( $blockers ) {
				return new WP_Error(
					'jetpack_send_cannot_enable',
					__( 'Finish setting up your domain before turning on sending.', 'jetpack-send-pkg' ),
					array(
						'status'   => 400,
						'blockers' => $blockers,
					)
				);
			}
		}
		if ( isset( $changes['from_local_part'] ) && ! is_email( $changes['from_local_part'] . '@example.com' ) ) {
			return new WP_Error( 'jetpack_send_invalid_from', __( 'Use letters, numbers, dots or dashes.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}
		if ( isset( $changes['reply_to'] ) && '' !== trim( (string) $changes['reply_to'] ) && ! is_email( trim( (string) $changes['reply_to'] ) ) ) {
			return new WP_Error( 'jetpack_send_invalid_reply_to', __( 'Enter an email address for replies, like you@example.com.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}
		if ( null !== $onboarding ) {
			$invalid = Onboarding::validate_client( $onboarding );
			if ( $invalid ) {
				return $invalid;
			}
		}

		$kept_before = Email_Log::retention_days();
		$debug_days  = (int) Settings::get()['debug_log_days'];
		Settings::update( $changes );
		if ( ! empty( $changes['enabled'] ) ) {
			Onboarding::note_enabled();
		}
		if ( null !== $onboarding ) {
			Onboarding::update_from_client( array_intersect_key( $onboarding, array_flip( Onboarding::CLIENT_KEYS ) ) );
		}
		self::apply_debug_change( $debug, isset( $changes['debug_log_days'] ) && (int) $changes['debug_log_days'] !== $debug_days );
		if ( $changes || null !== $debug ) {
			$keys = array_keys( $changes + ( null === $debug ? array() : array( 'debug_log' => $debug ) ) );
			// The switch sends its days with it, so one change isn't named twice.
			if ( null !== $debug ) {
				$keys = array_values( array_diff( $keys, array( 'debug_log_days' ) ) );
			}
			/* translators: %s: the settings that changed, e.g. "backup mail, how long the log keeps emails". */
			Debug_Log::add( 'info', 'settings', 'settings.changed', sprintf( __( 'Changed %s.', 'jetpack-send-pkg' ), implode( ', ', array_map( array( __CLASS__, 'setting_name' ), $keys ) ) ), array( 'keys' => $keys ) );
		}

		$data = self::status_data();
		// A shorter retention deletes older emails now, and the rest in the background if there are many.
		$kept_now = Email_Log::retention_days();
		if ( isset( $changes['log_retention_days'] ) && $kept_now > 0 && ( 0 === $kept_before || $kept_now < $kept_before ) ) {
			$data['pruned'] = Email_Log::prune( 10 );
			if ( $data['pruned']['remaining'] > 0 ) {
				wp_schedule_single_event( time(), Email_Log::PRUNE_HOOK );
			}
			$data = array_merge( self::status_data(), array( 'pruned' => $data['pruned'] ) );
		}
		return rest_ensure_response( $data );
	}

	/**
	 * A setting's plain name for the debug log; its key when it has none.
	 *
	 * @param string $key Setting key.
	 * @return string
	 */
	private static function setting_name( $key ) {
		$names = array(
			'enabled'            => __( 'sending', 'jetpack-send-pkg' ),
			'fallback'           => __( 'backup mail', 'jetpack-send-pkg' ),
			'auto_enable'        => __( 'turning sending on by itself', 'jetpack-send-pkg' ),
			'from_name'          => __( 'the sender name', 'jetpack-send-pkg' ),
			'log_retention_days' => __( 'how long the log keeps emails', 'jetpack-send-pkg' ),
			'debug_log'          => __( 'the debug log', 'jetpack-send-pkg' ),
			'debug_log_days'     => __( 'how long the debug log records', 'jetpack-send-pkg' ),
		);
		return $names[ $key ] ?? (string) $key;
	}

	/**
	 * Turn the debug log on or off, or restart it when its days changed while it's on.
	 *
	 * @param bool|null $turn_on      True or false from the request; null when it wasn't sent.
	 * @param bool      $days_changed Whether `debug_log_days` changed.
	 * @return void
	 */
	private static function apply_debug_change( $turn_on, $days_changed ) {
		$days = (int) Settings::get()['debug_log_days'];
		if ( true === $turn_on && ( ! Debug_Log::enabled() || $days_changed ) ) {
			Debug_Log::turn_on( $days );
		} elseif ( false === $turn_on && ! empty( Settings::get()['debug_log'] ) ) {
			Debug_Log::turn_off();
		} elseif ( null === $turn_on && $days_changed && Debug_Log::enabled() ) {
			Debug_Log::turn_on( $days );
		}
	}

	/**
	 * POST /test: one test email to the current user, once the domain is ready, rate-limited per site.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function send_test( WP_REST_Request $request ) {
		$account = Account::get();
		if ( ! $account ) {
			return self::not_set_up();
		}

		// Only ever the signed-in user's own address, so the route can't be used to relay mail.
		$me = (string) wp_get_current_user()->user_email;
		$to = $request->has_param( 'to' ) ? trim( (string) $request->get_param( 'to' ) ) : $me;
		if ( '' === $me || ! is_email( $me ) || strtolower( $to ) !== strtolower( $me ) ) {
			return new WP_Error( 'jetpack_send_bad_recipient', __( 'Test emails can only go to your own email address.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		if ( array() !== self::enable_blockers( $account ) ) {
			return new WP_Error(
				'jetpack_send_not_ready',
				/* translators: %s: the domain emails are sent from, e.g. example.com. */
				sprintf( __( 'Finish connecting %s first.', 'jetpack-send-pkg' ), $account['domain'] ),
				array( 'status' => 400 )
			);
		}

		if ( ! Onboarding::claim_test() ) {
			return new WP_Error(
				'jetpack_send_rate_limited',
				__( 'You’ve sent a few tests already. Try again in a few minutes.', 'jetpack-send-pkg' ),
				array(
					'status'      => 429,
					'retry_after' => Onboarding::test_retry_after(),
				)
			);
		}

		$result = Mailer::send_test( $me );
		if ( is_wp_error( $result ) ) {
			$data     = $result->get_error_data();
			$response = array(
				'success' => false,
				'error'   => $result->get_error_message(),
			);
			if ( is_array( $data ) && ! empty( $data['log_id'] ) ) {
				$response['log_id'] = (string) $data['log_id'];
			}
			if ( is_array( $data ) && ! empty( $data['reason'] ) ) {
				$response['reason'] = (string) $data['reason'];
			}
			return rest_ensure_response( $response );
		}

		$response = array(
			'success'    => true,
			'request_id' => $result['request_id'],
		);
		if ( '' !== $result['log_id'] ) {
			$response['log_id'] = $result['log_id'];
		}
		return rest_ensure_response( $response );
	}

	/**
	 * GET /usage.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_usage() {
		$account = Account::get();
		if ( ! $account ) {
			return self::not_set_up();
		}
		return rest_ensure_response( self::usage_data( $account ) );
	}

	/**
	 * This month's emails, from the dashboard's counts so deleting emails from the log doesn't lower it,
	 * plus the plan's limit when the mail service gives one. The service's own count isn't shown: it can
	 * lag behind sends that already went out.
	 *
	 * @param array    $account Stored account.
	 * @param int|null $now     Unix time; defaults to now.
	 * @return array{emails: int, tests: int, month_start: string, resets_on: string, monthly_limit: int, total_usage: int|null, period_start: string, period_end: string}
	 */
	public static function usage_data( array $account, $now = null ) {
		$month_start = self::site_moment( $now )->format( 'Y-m-01' );
		$counts      = Stats::sent_counts( Period::day_start( $month_start ) );
		$data        = array(
			'emails'        => $counts['emails'],
			'tests'         => $counts['tests'],
			'month_start'   => $month_start,
			'resets_on'     => ( new \DateTimeImmutable( $month_start, new \DateTimeZone( 'UTC' ) ) )->modify( 'first day of next month' )->format( 'Y-m-d' ),
			'monthly_limit' => (int) ( $account['monthly_limit'] ?? 0 ),
			'total_usage'   => null,
			'period_start'  => '',
			'period_end'    => '',
		);

		$provisioner = Provisioner_Factory::get();
		$usage       = $provisioner && $provisioner->get_type() === $account['provider'] ? $provisioner->get_usage( $account ) : null;
		if ( is_array( $usage ) ) {
			$data['monthly_limit'] = (int) ( $usage['monthly_limit'] ?? $data['monthly_limit'] );
			$data['total_usage']   = isset( $usage['total_usage'] ) ? (int) $usage['total_usage'] : null;
			$data['period_start']  = (string) ( $usage['period_start'] ?? '' );
			$data['period_end']    = (string) ( $usage['period_end'] ?? '' );
		}
		return $data;
	}

	/**
	 * GET /stats: email activity for a preset range or custom days, in the site's timezone, from the
	 * dashboard's counts. Tests are counted apart.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_stats( WP_REST_Request $request ) {
		if ( ! Account::get() ) {
			return self::not_set_up();
		}
		$custom = $request->has_param( 'start' ) || $request->has_param( 'end' );
		$period = Period::resolve(
			$custom
				? array(
					'start' => (string) $request->get_param( 'start' ),
					'end'   => (string) $request->get_param( 'end' ),
				)
				: array( 'range' => (int) $request->get_param( 'range' ) ),
			self::MAX_STATS_DAYS
		);
		if ( is_wp_error( $period ) ) {
			return $period;
		}
		// Counts go back KEEP_DAYS, so a custom range can't start before that.
		if ( $custom && $period['start'] < Period::add_days( Period::local( time() )->format( 'Y-m-d' ), 1 - Stats::KEEP_DAYS ) ) {
			/* translators: %s: how many days back the dashboard goes, e.g. 800. */
			return new WP_Error( 'jetpack_send_bad_period', sprintf( __( 'Pick a start date in the last %s days.', 'jetpack-send-pkg' ), number_format_i18n( Stats::KEEP_DAYS ) ), array( 'status' => 400 ) );
		}
		return rest_ensure_response( self::stats_data( $period ) );
	}

	/**
	 * The stats payload. A preset range is cached until a new row is logged, the counts change under
	 * the same rows (a delete, the prune, a moved count, a test's result), or the site's hour changes.
	 *
	 * @param int|array $period   A preset range in days, or Period::resolve()'s result.
	 * @param int|null  $now      Unix time to count back from; defaults to now.
	 * @return array
	 */
	public static function stats_data( $period, $now = null ) {
		$now = null === $now ? time() : (int) $now;
		if ( ! is_array( $period ) ) {
			$period = Period::resolve( array( 'range' => in_array( (int) $period, Period::PRESETS, true ) ? (int) $period : 90 ), 0, $now );
		}
		$preset = in_array( $period['range'], Period::PRESETS, true ) ? (int) $period['range'] : null;
		$moment = Period::local( $now );
		$check  = array(
			'gen'        => Email_Log::stats_gen(),
			'max_id'     => Email_Log::max_id(),
			'local_date' => $moment->format( 'Y-m-d' ),
			'local_hour' => $moment->format( 'H' ),
			// Zones like Kolkata and Kathmandu share a date and hour but not where the hour starts.
			'offset'     => $moment->format( 'P' ),
		);
		$key    = Email_Log::STATS_TRANSIENT . $preset;
		if ( null !== $preset ) {
			$cached = get_transient( $key );
			if ( is_array( $cached ) && isset( $cached['data'] ) && array_intersect_key( $cached, $check ) === $check ) {
				return $cached['data'];
			}
		}

		$statuses = Stats::STATUSES;
		$series   = Stats::series( $period['start_utc'], $period['end_utc'] );
		$totals   = array_fill_keys( $statuses, 0 );
		$tests    = 0;
		foreach ( Stats::totals_by_source( $period['start_utc'], $period['end_utc'] ) as $source => $counts ) {
			foreach ( $statuses as $status ) {
				if ( 'test' === $source ) {
					$tests += (int) ( $counts[ $status ] ?? 0 );
				} else {
					$totals[ $status ] += (int) ( $counts[ $status ] ?? 0 );
				}
			}
		}

		$days  = array();
		$hours = array();
		if ( 'hour' === $period['unit'] ) {
			for ( $hour = $period['start_utc']; $hour < $period['end_utc']; $hour += HOUR_IN_SECONDS ) {
				$hours[] = array( 'start' => gmdate( 'Y-m-d\\TH:i:s\\Z', $hour ) ) + array_fill_keys( $statuses, 0 );
			}
			// Each count is the site-local hour it was written in. After a move to or from a half-hour zone
			// those no longer start where these hours do, so each goes in the hour it starts in.
			foreach ( $series as $bucket => $counts ) {
				$slot = intdiv( (int) $bucket - $period['start_utc'], HOUR_IN_SECONDS );
				if ( (int) $bucket < $period['start_utc'] || ! isset( $hours[ $slot ] ) ) {
					continue;
				}
				foreach ( $statuses as $status ) {
					$hours[ $slot ][ $status ] += (int) ( $counts[ $status ] ?? 0 );
				}
			}
		} else {
			$by_day = array();
			foreach ( $series as $bucket => $counts ) {
				$date = Period::local( $bucket )->format( 'Y-m-d' );
				foreach ( $statuses as $status ) {
					$by_day[ $date ][ $status ] = ( $by_day[ $date ][ $status ] ?? 0 ) + $counts[ $status ];
				}
			}
			// Step through dates, not times: where the clocks go forward at midnight, a day starts at 01:00.
			$last = Period::local( $period['end_utc'] - 1 )->format( 'Y-m-d' );
			for ( $date = Period::local( $period['start_utc'] )->format( 'Y-m-d' ); $date <= $last; $date = Period::add_days( $date, 1 ) ) {
				$days[] = array( 'date' => $date ) + ( $by_day[ $date ] ?? array_fill_keys( $statuses, 0 ) );
			}
		}

		$last_email = Email_Log::last_email_at();
		$newest     = Stats::newest();
		$since      = Stats::since();
		$covers     = Email_Log::oldest_created_at();
		$data       = array(
			'range'           => $preset,
			'from'            => $period['start'],
			'to'              => $period['end'],
			'unit'            => $period['unit'],
			'totals'          => array( 'emails' => array_sum( $totals ) ) + $totals,
			'tests'           => $tests,
			'days'            => $days,
			'hours'           => $hours,
			'origins'         => self::top_origins( Stats::origins( $period['start_utc'], $period['end_utc'] ) ),
			'attention'       => Email_Log::attention( $period['start_utc'], $period['end_utc'] ),
			'last_email_at'   => null === $last_email ? null : Email_Log::iso( $last_email ),
			'last_email_day'  => null === $newest ? null : Period::local( $newest )->format( 'Y-m-d' ),
			'has_history'     => Stats::has_history(),
			'stats_since'     => null === $since ? null : Period::local( $since )->format( 'Y-m-d' ),
			'log_covers_from' => null === $covers ? null : Email_Log::iso( $covers ),
		);

		if ( null !== $preset ) {
			set_transient( $key, $check + array( 'data' => $data ), 10 * MINUTE_IN_SECONDS );
		}
		return $data;
	}

	/**
	 * The five busiest origins with plain names and plugin icons, plus one row for the rest.
	 *
	 * @param array $rows `origin` and `n` per origin, most first.
	 * @return array<int, array{key: string, label: string, count: int, icon_url: string|null}>
	 */
	private static function top_origins( array $rows ) {
		$top  = array();
		$rest = 0;
		foreach ( array_values( $rows ) as $index => $row ) {
			if ( $index < 5 ) {
				$top[] = array(
					'key'      => (string) $row['origin'],
					'label'    => Email_Origin::label( (string) $row['origin'] ),
					'count'    => (int) $row['n'],
					'icon_url' => Email_Origin::icon_url( (string) $row['origin'] ),
				);
			} else {
				$rest += (int) $row['n'];
			}
		}
		if ( $rest > 0 ) {
			$top[] = array(
				'key'      => 'other',
				'label'    => __( 'Everything else', 'jetpack-send-pkg' ),
				'count'    => $rest,
				'icon_url' => null,
			);
		}
		return $top;
	}

	/**
	 * Now, or a given Unix time, in the site's timezone.
	 *
	 * @param int|null $now Unix time; defaults to now.
	 * @return \DateTimeImmutable
	 */
	private static function site_moment( $now = null ) {
		return ( new \DateTimeImmutable( '@' . ( null === $now ? time() : (int) $now ) ) )->setTimezone( wp_timezone() );
	}

	/**
	 * GET /log: a page of emails, filtered and searched.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_log( WP_REST_Request $request ) {
		$args   = array(
			'page'     => (int) $request->get_param( 'page' ),
			'per_page' => (int) $request->get_param( 'per_page' ),
			'search'   => (string) $request->get_param( 'search' ),
			'status'   => (array) $request->get_param( 'status' ),
			'origin'   => (array) $request->get_param( 'origin' ),
			'source'   => (array) $request->get_param( 'source' ),
		);
		$window = self::log_window( $request );
		if ( is_wp_error( $window ) ) {
			return $window;
		}
		if ( null !== $window ) {
			$args['start_utc'] = $window['start_utc'];
			$args['end_utc']   = $window['end_utc'];
		}

		$page = Email_Log::query( $args );
		foreach ( $page['items'] as $index => $item ) {
			$page['items'][ $index ] = self::log_row( $item );
		}
		return rest_ensure_response( $page );
	}

	/**
	 * The dates GET /log filters by: custom days, a range, an older `days` link, or none.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array|WP_Error|null Period::resolve()'s result, or null for any date.
	 */
	private static function log_window( WP_REST_Request $request ) {
		if ( $request->has_param( 'start' ) || $request->has_param( 'end' ) ) {
			return Period::resolve(
				array(
					'start' => (string) $request->get_param( 'start' ),
					'end'   => (string) $request->get_param( 'end' ),
				)
			);
		}
		if ( $request->has_param( 'range' ) ) {
			return Period::resolve( array( 'range' => (int) $request->get_param( 'range' ) ) );
		}
		$days = (int) $request->get_param( 'days' );
		return $days > 0 ? Period::resolve( array( 'days' => $days ) ) : null;
	}

	/**
	 * A log row as GET /log returns it: ids as strings, the origin's name and icon, and the first recipient's avatar.
	 *
	 * @param array $item Row from Email_Log::query().
	 * @return array
	 */
	private static function log_row( array $item ) {
		$origin = (string) ( $item['origin'] ?? '' );
		$item   = array_merge(
			$item,
			array(
				'origin'          => $origin,
				'origin_label'    => '' === $origin ? '' : Email_Origin::label( $origin ),
				'origin_icon_url' => '' === $origin ? null : Email_Origin::icon_url( $origin ),
				'from_email'      => (string) ( $item['from_email'] ?? '' ),
				'reason'          => (string) ( $item['reason'] ?? '' ),
				'resend_of'       => (int) ( $item['resend_of'] ?? 0 ) > 0 ? (string) $item['resend_of'] : '',
				'avatar_url'      => self::avatar_url( (string) ( $item['recipients'] ?? '' ) ),
			)
		);
		return $item;
	}

	/**
	 * GET /log/origins: what sent the emails still in the log, most first, for the Source filter.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_log_origins() {
		$origins = array();
		foreach ( Email_Log::origins_in_log() as $row ) {
			$key       = (string) $row['origin'];
			$origins[] = array(
				'key'      => $key,
				'label'    => Email_Origin::label( $key ),
				'icon_url' => Email_Origin::icon_url( $key ),
				'count'    => (int) $row['n'],
			);
		}
		return rest_ensure_response( $origins );
	}

	/**
	 * GET /log/summary: how many emails the log holds, and how many each retention choice would delete.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_log_summary() {
		return rest_ensure_response( Email_Log::summary() );
	}

	/**
	 * The first recipient's avatar, or null when the site hides avatars or there's no address.
	 *
	 * @param string $recipients The logged recipients, comma-separated, maybe with names.
	 * @return string|null
	 */
	public static function avatar_url( $recipients ) {
		$email = self::first_recipient( $recipients );
		return '' === $email ? null : self::avatar_for_email( $email );
	}

	/**
	 * One address's avatar through core, so avatar plugins and privacy filters still apply.
	 * An address without one gets a transparent image, so the page's own initial shows through without an error.
	 *
	 * @param string $email Email address.
	 * @return string|null Null when the site hides avatars.
	 */
	public static function avatar_for_email( $email ) {
		if ( ! get_option( 'show_avatars' ) || '' === (string) $email ) {
			return null;
		}
		$url = get_avatar_url(
			(string) $email,
			array(
				'size'    => self::AVATAR_SIZE,
				'default' => 'blank',
			)
		);
		return is_string( $url ) && '' !== $url ? $url : null;
	}

	/**
	 * The first email address in a recipient list such as `"Desk, Help" <help@example.com>, sales@example.com`.
	 *
	 * @param string $recipients Recipients.
	 * @return string The address, or '' when there's no valid one.
	 */
	public static function first_recipient( $recipients ) {
		if ( ! preg_match( '/[^\s<>,;"\'()]+@[^\s<>,;"\'()]+/', (string) $recipients, $match ) ) {
			return '';
		}
		$email = is_email( $match[0] );
		return is_string( $email ) ? $email : '';
	}

	/**
	 * GET /log/{id}: one row with the content kept for previewing, why it failed, and what can be done.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_log_entry( WP_REST_Request $request ) {
		$id    = (int) $request->get_param( 'id' );
		$entry = Email_Log::get( $id );
		if ( ! $entry ) {
			return self::entry_not_found();
		}
		$from                     = is_array( $entry['message'] ?? null ) && is_array( $entry['message']['from'] ?? null ) ? $entry['message']['from'] : null;
		$entry['avatar_url']      = self::avatar_url( (string) ( $entry['recipients'] ?? '' ) );
		$entry['from_avatar_url'] = $from ? self::avatar_for_email( (string) ( $from['email'] ?? '' ) ) : null;
		$origin                   = (string) ( $entry['origin'] ?? '' );
		$entry['origin_label']    = '' === $origin ? '' : Email_Origin::label( $origin );
		$entry['origin_icon_url'] = '' === $origin ? null : Email_Origin::icon_url( $origin );

		$detail          = is_string( $entry['detail'] ?? null ) ? json_decode( $entry['detail'], true ) : null;
		$entry['reason'] = (string) ( $entry['reason'] ?? '' );
		$entry['detail'] = is_array( $detail ) ? $detail : null;
		$entry['resend'] = Resend::eligibility( $entry );

		$resends                  = Email_Log::resends_of( $id );
		$entry['resends']         = array_map(
			fn( $row ) => array(
				'id'         => (string) $row['id'],
				'status'     => (string) $row['status'],
				'created_at' => (string) $row['created_at'],
			),
			$resends['items']
		);
		$entry['resend_count']    = $resends['total'];
		$original                 = (int) ( $entry['resend_of'] ?? 0 );
		$original_row             = $original > 0 ? Email_Log::brief_of( $original ) : null;
		$entry['resend_of']       = $original > 0 ? (string) $original : '';
		$entry['resend_of_entry'] = $original > 0 ? array(
			'id'         => (string) $original,
			'exists'     => null !== $original_row,
			'created_at' => $original_row['created_at'] ?? null,
			'status'     => $original_row['status'] ?? null,
		) : null;
		$entry['resent_by']       = 'resend' === ( $entry['source'] ?? '' ) ? Email_Log::user_name( (int) ( $entry['user_id'] ?? 0 ) ) : '';
		$entry['debug_count']     = Debug_Log::count( $id );
		$entry['support_text']    = self::support_text( $entry );
		// Search columns and who resent it by id stay on the server.
		unset( $entry['body_text'], $entry['other_addresses'], $entry['user_id'] );
		return rest_ensure_response( $entry );
	}

	/**
	 * A plain report of one email for support: domains only, never the subject, body, full addresses or a key.
	 * English on purpose: support reads it.
	 *
	 * @param array $entry The entry, with `detail` decoded.
	 * @return string
	 */
	private static function support_text( array $entry ) {
		$detail   = is_array( $entry['detail'] ?? null ) ? $entry['detail'] : array();
		$message  = is_array( $entry['message'] ?? null ) ? $entry['message'] : array();
		$created  = Period::local( (int) strtotime( (string) $entry['created_at'] . ' UTC' ) );
		$domain   = fn( $email ) => strtolower( (string) substr( (string) strrchr( (string) $email, '@' ), 1 ) );
		$account  = Account::get();
		$from     = '' !== (string) ( $message['from']['email'] ?? '' ) ? $domain( $message['from']['email'] ) : ( $account ? (string) $account['domain'] : '' );
		$to       = isset( $message['to'] ) && is_array( $message['to'] ) ? array_column( $message['to'], 'email' ) : array_column( Message_Builder::parse_recipients( (string) ( $entry['recipients'] ?? '' ) ), 'email' );
		$words    = array_merge( (array) ( $detail['service_errors'] ?? array() ), isset( $detail['result']['reason'] ) ? array( $detail['result']['reason'] ) : array() );
		$host     = is_array( $detail['host'] ?? null ) ? $detail['host'] : null;
		$records  = is_array( $detail['records'] ?? null ) ? $detail['records'] : null;
		$or_dash  = fn( $value ) => '' === (string) $value ? '—' : (string) $value;
		$host_out = '—';
		if ( $host ) {
			$host_out = 'failed' === ( $host['result'] ?? '' ) ? 'failed (' . ( $host['reason'] ?? 'host_failed' ) . ')' : (string) ( $host['result'] ?? '' );
		}

		$lines = array(
			'Jetpack Send email report',
			sprintf( 'When: %s (%s)', $created->format( 'Y-m-d H:i:s' ), Period::zone_label( $created ) ),
			'Status: ' . $entry['status'] . ( '' !== $entry['reason'] ? ' (' . $entry['reason'] . ')' : '' ),
			'From domain: ' . $or_dash( $from ),
			'To domain: ' . $or_dash( implode( ', ', array_unique( array_filter( array_map( $domain, $to ) ) ) ) ),
			'What happened: ' . $or_dash( Failure_Reason::what_happened( (string) $entry['status'], $detail ? $detail : null ) ),
			'The service said: ' . $or_dash( Debug_Log::mask_emails( implode( ' ', array_filter( array_map( 'strval', $words ) ) ) ) ),
			sprintf( 'Request ID: %s  Message ID: %s', $or_dash( $entry['request_id'] ?? '' ), $or_dash( $detail['message_id'] ?? ( $detail['result']['message_id'] ?? '' ) ) ),
			'Time taken: ' . ( isset( $detail['timing']['ms'] ) ? (int) $detail['timing']['ms'] . ' ms' : '—' ),
			sprintf( 'Backup mail: %s   Your host\'s mail: %s', $or_dash( $detail['fallback'] ?? '' ), $host_out ),
		);
		if ( $records ) {
			$lines[] = sprintf(
				'Records at the time: permission %s, signing %s, sender list %s%s',
				$or_dash( $records['lockdown'] ?? '' ),
				$or_dash( $records['dkim'] ?? '' ),
				$or_dash( $records['spf'] ?? '' ),
				empty( $records['checked_at'] ) ? '' : ' (checked ' . Period::local( (int) strtotime( (string) $records['checked_at'] ) )->format( 'Y-m-d H:i' ) . ')'
			);
		}
		$lines[] = sprintf( 'Versions: Send %s, WordPress %s, PHP %s', Send::PACKAGE_VERSION, get_bloginfo( 'version' ), PHP_VERSION );
		return implode( "\n", $lines );
	}

	/**
	 * POST /log/{id}/resend: send a copy of a logged email, to the same people, the current user or others.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function resend_log_entry( WP_REST_Request $request ) {
		$id    = (int) $request->get_param( 'id' );
		$entry = Email_Log::get( $id );
		if ( ! $entry ) {
			return self::entry_not_found();
		}

		$eligibility = Resend::eligibility( $entry );
		if ( ! $eligibility['allowed'] ) {
			return self::resend_refused(
				$id,
				new WP_Error(
					'jetpack_send_not_resendable',
					__( 'This email can’t be sent again.', 'jetpack-send-pkg' ),
					array(
						'status' => 403,
						'reason' => $eligibility['reason'],
					)
				)
			);
		}
		$user  = wp_get_current_user();
		$lists = Resend::validate( $entry, (array) $request->get_param( 'to' ), (array) $request->get_param( 'cc' ), (array) $request->get_param( 'bcc' ), (string) $user->user_email );
		if ( is_wp_error( $lists ) ) {
			return self::resend_refused( $id, $lists );
		}

		// One send at a time per email, so a double click can't send two copies.
		if ( ! Lock::acquire( 'resend_' . $id, MINUTE_IN_SECONDS ) ) {
			return self::resend_refused( $id, new WP_Error( 'jetpack_send_resend_in_flight', __( 'This email is already being sent.', 'jetpack-send-pkg' ), array( 'status' => 409 ) ) );
		}
		try {
			if ( ! Resend::claim() ) {
				$minutes = max( 1, (int) ceil( Resend::retry_after() / MINUTE_IN_SECONDS ) );
				$limit   = Resend::limit();
				return self::resend_refused(
					$id,
					new WP_Error(
						'jetpack_send_resend_rate_limited',
						sprintf(
							/* translators: 1: how many emails were resent in the last hour, 2: the sentence saying how long to wait. */
							__( '%1$s %2$s', 'jetpack-send-pkg' ),
							sprintf(
								/* translators: %d: how many emails can be resent an hour. */
								_n( 'You’ve resent %d email in the last hour.', 'You’ve resent %d emails in the last hour.', $limit, 'jetpack-send-pkg' ),
								$limit
							),
							sprintf(
								/* translators: %d: minutes to wait. */
								_n( 'Try again in %d minute.', 'Try again in %d minutes.', $minutes, 'jetpack-send-pkg' ),
								$minutes
							)
						),
						array(
							'status'      => 429,
							'retry_after' => Resend::retry_after(),
						)
					)
				);
			}
			$result = Resend::send( $entry, $lists['to'], $lists['cc'], $lists['bcc'], (int) $user->ID );
			if ( is_wp_error( $result ) ) {
				return self::resend_refused( $id, $result );
			}
			return rest_ensure_response( array( 'success' => Email_Log::STATUS_SENT === $result['status'] ) + $result );
		} finally {
			Lock::release( 'resend_' . $id );
		}
	}

	/**
	 * Note a resend that never went out, and pass its error on.
	 *
	 * @param int      $id    The original's row id.
	 * @param WP_Error $error Why.
	 * @return WP_Error
	 */
	private static function resend_refused( $id, WP_Error $error ) {
		$data   = $error->get_error_data();
		$reason = is_array( $data ) && ! empty( $data['reason'] ) ? (string) $data['reason'] : (string) $error->get_error_code();
		Debug_Log::add(
			'warning',
			'sending',
			'resend.refused',
			/* translators: %s: why, e.g. jetpack_send_resend_rate_limited. */
			sprintf( __( 'Resend refused: %s.', 'jetpack-send-pkg' ), $reason ),
			array(
				'reason' => $reason,
				'code'   => $error->get_error_code(),
			),
			$id
		);
		return $error;
	}

	/**
	 * DELETE /log/{id}: remove one email from the log for good.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function delete_log_entry( WP_REST_Request $request ) {
		$result = Email_Log::delete( array( (int) $request->get_param( 'id' ) ) );
		if ( array() === $result['deleted'] ) {
			return self::entry_not_found();
		}
		return rest_ensure_response( array( 'deleted' => array_map( 'strval', $result['deleted'] ) ) );
	}

	/**
	 * POST /log/delete: remove up to 100 emails at once. Ids already gone come back as `missing`, so a stale selection still works.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function delete_log_entries( WP_REST_Request $request ) {
		$result = Email_Log::delete( (array) $request->get_param( 'ids' ) );
		return rest_ensure_response(
			array(
				'deleted' => array_map( 'strval', $result['deleted'] ),
				'missing' => array_map( 'strval', $result['missing'] ),
			)
		);
	}

	/**
	 * The error for a log row that isn't there.
	 *
	 * @return WP_Error
	 */
	private static function entry_not_found() {
		return new WP_Error( 'jetpack_send_log_entry_not_found', __( 'This email is no longer in the log.', 'jetpack-send-pkg' ), array( 'status' => 404 ) );
	}

	/**
	 * POST /reset: clears local state even if deprovisioning fails, so the site is never stuck.
	 *
	 * @return \WP_REST_Response
	 */
	public static function reset() {
		$account     = Account::get();
		$provisioner = Provisioner_Factory::get();
		$warning     = '';
		if ( $account && $provisioner && $provisioner->get_type() === $account['provider'] ) {
			$result = $provisioner->deprovision( $account );
			if ( is_wp_error( $result ) ) {
				$warning = $result->get_error_message();
			}
		}

		Account::delete();
		Settings::update( array( 'enabled' => false ) );
		Dns_Watch::stop();
		Onboarding::delete();
		delete_transient( self::CHECK_DNS_THROTTLE );
		// The log, its counts and the debug log stay: they're the site's history, not the account's.
		Email_Log::clear_stats_cache();
		Debug_Log::add( 'warning', 'settings', 'sending.reset', __( 'Started over: the sending account was removed.', 'jetpack-send-pkg' ) );

		$data                  = self::status_data();
		$data['reset_warning'] = $warning;
		return rest_ensure_response( $data );
	}

	/**
	 * Normalize user input to a bare lowercase domain, or '' when invalid.
	 *
	 * @param string $domain Input.
	 * @return string
	 */
	public static function sanitize_domain( $domain ) {
		$domain = strtolower( trim( $domain ) );
		$domain = (string) preg_replace( '#^[a-z]+://#', '', $domain );
		$domain = rtrim( explode( '/', $domain )[0], '.' );
		return preg_match( '/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $domain ) ? $domain : '';
	}

	/**
	 * The "not set up" error.
	 *
	 * @return WP_Error
	 */
	private static function not_set_up() {
		return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send first.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
	}

	/**
	 * Give an upstream error a valid REST status.
	 *
	 * @param WP_Error $error Error.
	 * @return WP_Error
	 */
	private static function error_response( WP_Error $error ) {
		$data   = $error->get_error_data();
		$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;
		return new WP_Error( $error->get_error_code(), $error->get_error_message(), array( 'status' => $status >= 400 ? $status : 502 ) );
	}
}
