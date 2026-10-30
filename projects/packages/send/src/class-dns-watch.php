<?php
/**
 * Background check that keeps watching the domain's records after the user leaves.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Cron watch: checks the records on a backing-off schedule for up to 7 days, turns sending on
 * when they pass and sends one automatic test.
 */
class Dns_Watch {

	/**
	 * Cron hook.
	 *
	 * @var string
	 */
	const HOOK = 'jetpack_send_dns_watch';

	/**
	 * Option holding the watch's progress: `{started_at, runs, stalled_notified_at}` (Unix times).
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_send_dns_watch';

	/**
	 * How long the watch runs before it gives up, in seconds.
	 *
	 * @var int
	 */
	const MAX_AGE = 7 * DAY_IN_SECONDS;

	/**
	 * How long the records can stay unverified before the one reminder email goes out.
	 *
	 * @var int
	 */
	const STALL_AFTER = 2 * DAY_IN_SECONDS;

	/**
	 * Without every record found locally, ask the mail service only on every Nth run.
	 *
	 * @var int
	 */
	const SERVICE_CHECK_EVERY = 5;

	/**
	 * Option used as a lock so overlapping cron runs can't send two tests.
	 *
	 * @var string
	 */
	const LOCK_OPTION = 'jetpack_send_dns_watch_lock';

	/**
	 * Seconds after which a lock left by a crashed run is ignored.
	 *
	 * @var int
	 */
	const LOCK_TTL = 10 * MINUTE_IN_SECONDS;

	/**
	 * Hook the cron callback.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( self::HOOK, array( __CLASS__, 'run' ) );
		add_action( 'admin_init', array( __CLASS__, 'ensure_scheduled' ) );
	}

	/**
	 * Start (or restart) watching the stored account's domain. Called after setup.
	 *
	 * @return void
	 */
	public static function start() {
		self::unschedule();
		update_option(
			self::OPTION,
			array(
				'started_at'          => time(),
				'runs'                => 0,
				'stalled_notified_at' => null,
			),
			false
		);
		wp_schedule_single_event( time() + (int) self::next_delay( 0 ), self::HOOK );
	}

	/**
	 * Stop watching and clear the schedule. Called on reset, uninstall and once sending is on.
	 *
	 * @return void
	 */
	public static function stop() {
		self::unschedule();
		delete_option( self::OPTION );
		delete_option( self::LOCK_OPTION );
	}

	/**
	 * Clear the scheduled run but keep the progress, so the watch can pick up again (plugin deactivation).
	 *
	 * @return void
	 */
	public static function unschedule() {
		wp_clear_scheduled_hook( self::HOOK );
	}

	/**
	 * Put a lost or paused schedule back while the watch is still running.
	 *
	 * @return void
	 */
	public static function ensure_scheduled() {
		$watch = self::progress();
		if ( ! $watch || wp_next_scheduled( self::HOOK ) ) {
			return;
		}
		$delay = self::next_delay( time() - $watch['started_at'] );
		if ( null === $delay ) {
			self::stop();
			return;
		}
		wp_schedule_single_event( time() + $delay, self::HOOK );
	}

	/**
	 * One cron run: local lookup first, the mail-service check only when every record is found
	 * or every 5th run; on pass, Onboarding::maybe_auto_enable() and the automatic test.
	 *
	 * @return void
	 */
	public static function run() {
		$watch   = self::progress();
		$account = Account::get();
		if ( ! $watch || ! $account ) {
			self::stop();
			return;
		}
		if ( ! self::lock() ) {
			return;
		}

		try {
			++$watch['runs'];
			update_option( self::OPTION, $watch, false );

			$elapsed = time() - $watch['started_at'];
			if ( self::passes( $account ) ) {
				self::note_run( $watch['runs'], 'passed', $elapsed );
				self::finish();
				return;
			}

			$lookup = Dns_Lookup::check( $account );
			if ( ! empty( $lookup['all_found'] ) || 0 === $watch['runs'] % self::SERVICE_CHECK_EVERY ) {
				$account = self::check_with_mail_service( $account );
				if ( self::passes( $account ) ) {
					self::note_run( $watch['runs'], 'passed', $elapsed );
					self::finish();
					return;
				}
			}

			if ( $elapsed >= self::STALL_AFTER && empty( $watch['stalled_notified_at'] ) ) {
				$watch['stalled_notified_at'] = time();
				update_option( self::OPTION, $watch, false );
				self::send_stall_email( $account, $lookup, $watch['started_at'] );
			}

			$delay = self::next_delay( $elapsed );
			self::note_run( $watch['runs'], null === $delay ? 'gave_up' : ( empty( $lookup['all_found'] ) ? 'waiting' : 'found' ), $elapsed, $delay );
			if ( null === $delay ) {
				self::stop();
				return;
			}
			wp_schedule_single_event( time() + $delay, self::HOOK );
		} finally {
			delete_option( self::LOCK_OPTION );
		}
	}

	/**
	 * Note one background check in the debug log.
	 *
	 * @param int      $run     Which run it was.
	 * @param string   $outcome `passed`, `found`, `waiting` or `gave_up`.
	 * @param int      $elapsed Seconds since the watch started.
	 * @param int|null $next    Seconds until the next run, or null for none.
	 * @return void
	 */
	private static function note_run( $run, $outcome, $elapsed, $next = null ) {
		Debug_Log::add(
			'gave_up' === $outcome ? 'warning' : ( 'passed' === $outcome ? 'info' : 'debug' ),
			'domain',
			'dns.watch',
			/* translators: 1: which background check it was, 2: what it found, e.g. waiting. */
			sprintf( __( 'Background check %1$d: %2$s.', 'jetpack-send-pkg' ), $run, $outcome ),
			array(
				'run'     => (int) $run,
				'outcome' => $outcome,
				'elapsed' => (int) $elapsed,
				'next'    => $next,
			)
		);
	}

	/**
	 * Seconds until the next run: 15 minutes for 2 hours, hourly to 48 hours, then daily.
	 *
	 * @param int $elapsed Seconds since the watch started.
	 * @return int|null Delay, or null once MAX_AGE has passed.
	 */
	public static function next_delay( $elapsed ) {
		$elapsed   = max( 0, (int) $elapsed );
		$remaining = self::MAX_AGE - $elapsed;
		if ( $remaining <= 0 ) {
			return null;
		}

		if ( $elapsed < 2 * HOUR_IN_SECONDS ) {
			$delay = 15 * MINUTE_IN_SECONDS;
		} elseif ( $elapsed < self::STALL_AFTER ) {
			$delay = HOUR_IN_SECONDS;
		} else {
			$delay = DAY_IN_SECONDS;
		}
		// The last run lands on day 7 rather than after it.
		return min( $delay, $remaining );
	}

	/**
	 * When the next run is scheduled, for the status payload.
	 *
	 * @return string|null ISO 8601 time, or null when not watching.
	 */
	public static function next_check_at() {
		if ( ! self::progress() ) {
			return null;
		}
		$next = wp_next_scheduled( self::HOOK );
		return $next ? gmdate( 'c', (int) $next ) : null;
	}

	/**
	 * The stored progress, or null when not watching.
	 *
	 * @return array{started_at: int, runs: int, stalled_notified_at: int|null}|null
	 */
	private static function progress() {
		$watch = get_option( self::OPTION );
		if ( ! is_array( $watch ) || empty( $watch['started_at'] ) ) {
			return null;
		}
		return array(
			'started_at'          => (int) $watch['started_at'],
			'runs'                => (int) ( $watch['runs'] ?? 0 ),
			'stalled_notified_at' => empty( $watch['stalled_notified_at'] ) ? null : (int) $watch['stalled_notified_at'],
		);
	}

	/**
	 * Take the run lock; false when another run holds a fresh one.
	 *
	 * @return bool
	 */
	private static function lock() {
		if ( add_option( self::LOCK_OPTION, time(), '', false ) ) {
			return true;
		}
		if ( time() - (int) get_option( self::LOCK_OPTION ) < self::LOCK_TTL ) {
			return false;
		}
		update_option( self::LOCK_OPTION, time(), false );
		return true;
	}

	/**
	 * Whether the account's last mail-service check passes every required record.
	 *
	 * @param array $account Stored account.
	 * @return bool
	 */
	private static function passes( array $account ) {
		return array() === REST_Controller::enable_blockers( $account );
	}

	/**
	 * Ask the mail service to check the domain and store its verdicts.
	 *
	 * @param array $account Stored account.
	 * @return array The account, updated when the check answered.
	 */
	private static function check_with_mail_service( array $account ) {
		$response = ( new MailChannels_Client( $account['api_key'] ) )->check_domain( $account['domain'], (string) ( $account['dkim_selector'] ?? '' ) );
		if ( is_wp_error( $response ) || ! is_array( $response ) ) {
			return $account;
		}

		$check = Dns_Check::normalize( $response, self::existing_spf( $account ) );
		Account::update( array( 'dns_check' => $check ) );
		REST_Controller::note_dns_check( (string) $account['domain'], $check );
		$updated = Account::get();
		return $updated ? $updated : $account;
	}

	/**
	 * The domain's SPF record, looked up through Dns_Lookup; the last known one when the lookup fails.
	 *
	 * @param array $account Stored account.
	 * @return string
	 */
	private static function existing_spf( array $account ) {
		$values = Dns_Lookup::txt_values( (string) $account['domain'] );
		if ( false === $values ) {
			$check = $account['dns_check'] ?? null;
			return (string) ( is_array( $check ) && isset( $check['existing_spf'] ) ? $check['existing_spf'] : ( $account['existing_spf'] ?? '' ) );
		}
		foreach ( $values as $txt ) {
			if ( 0 === stripos( $txt, 'v=spf1' ) ) {
				return $txt;
			}
		}
		return '';
	}

	/**
	 * The records passed: turn sending on, send the one automatic test, stop watching.
	 *
	 * @return void
	 */
	private static function finish() {
		Onboarding::maybe_auto_enable();

		$settings = Settings::get();
		$state    = Onboarding::state();
		// Someone checked from the Send screen in the last minute, so they see it's ready and send their own test.
		$watching = false !== get_transient( REST_Controller::CHECK_DNS_THROTTLE );
		if ( ! $watching && ! empty( $settings['enabled'] ) && empty( $state['test_sent_at'] ) && empty( $state['auto_test_log_id'] ) ) {
			$to = (string) ( $state['test_to'] ?? '' );
			if ( self::can_receive_test( $to ) ) {
				$result = Mailer::send_test( $to, 'auto' );
				$log_id = is_wp_error( $result ) ? ( $result->get_error_data()['log_id'] ?? '' ) : ( $result['log_id'] ?? '' );
				if ( '' !== (string) $log_id ) {
					Onboarding::record( array( 'auto_test_log_id' => (string) $log_id ) );
				}
			}
		}

		self::stop();
	}

	/**
	 * Whether the address belongs to a user who can still manage Send.
	 *
	 * @param string $email Address captured at setup.
	 * @return bool
	 */
	private static function can_receive_test( $email ) {
		if ( ! is_email( $email ) ) {
			return false;
		}
		$user = get_user_by( 'email', $email );
		return $user && user_can( $user, 'manage_options' );
	}

	/**
	 * Email the person who ran setup once, through the host's mail, when the records still aren't there.
	 *
	 * @param array $account    Stored account.
	 * @param array $lookup     Local lookup, for naming what's missing.
	 * @param int   $started_at When the watch started.
	 * @return void
	 */
	private static function send_stall_email( array $account, $lookup, $started_at ) {
		$state = Onboarding::state();
		$to    = (string) ( $state['test_to'] ?? '' );
		if ( ! is_email( $to ) ) {
			$to = (string) get_option( 'admin_email' );
		}
		if ( ! is_email( $to ) ) {
			return;
		}

		$user            = get_user_by( 'email', $to );
		$switched_locale = $user && function_exists( 'switch_to_user_locale' ) && switch_to_user_locale( $user->ID );

		$domain = (string) $account['domain'];
		/* translators: %s: the domain email is sent from, e.g. example.com. */
		$subject = sprintf( __( '%s isn’t connected to Jetpack Send yet', 'jetpack-send-pkg' ), $domain );

		$all_found = is_array( $lookup ) && ! empty( $lookup['all_found'] );
		$lines     = array(
			$all_found
				/* translators: %s: the domain email is sent from, e.g. example.com. */
				? sprintf( __( 'We can see both records for %s. Jetpack Send is still waiting for the mail service to confirm them. We’ve been checking for two days.', 'jetpack-send-pkg' ), $domain )
				/* translators: %s: the domain email is sent from, e.g. example.com. */
				: sprintf( __( 'Jetpack Send is still waiting for the records for %s. We’ve been checking for two days.', 'jetpack-send-pkg' ), $domain ),
		);
		$missing   = self::missing_lines( $lookup, $domain );
		if ( $missing ) {
			$lines[] = '';
			$lines[] = __( 'Still to do:', 'jetpack-send-pkg' );
			foreach ( $missing as $line ) {
				$lines[] = '- ' . $line;
			}
		}
		if ( ! $all_found ) {
			$lines[] = '';
			$lines[] = __( 'Check both records are saved where your domain is managed. Some providers take up to a day.', 'jetpack-send-pkg' );
		}
		$lines[] = '';
		/* translators: %s: link to the Jetpack Send screen in wp-admin. */
		$lines[] = sprintf( __( 'See the records and what to change: %s', 'jetpack-send-pkg' ), add_query_arg( 'welcome', '1', Admin_Page::dashboard_url() ) );
		$lines[] = '';
		$lines[] = sprintf(
			/* translators: %s: date the automatic checks stop, e.g. October 25, 2026. */
			__( 'We’ll keep checking until %s. Until then, your site’s emails go out through your host as usual.', 'jetpack-send-pkg' ),
			wp_date( (string) get_option( 'date_format', 'F j, Y' ), $started_at + self::MAX_AGE )
		);

		// Send isn't sending for this site yet, so the host delivers this and it stays out of Send's log.
		$priority = has_filter( 'pre_wp_mail', array( Mailer::class, 'pre_wp_mail' ) );
		if ( false !== $priority ) {
			remove_filter( 'pre_wp_mail', array( Mailer::class, 'pre_wp_mail' ), $priority );
		}
		try {
			wp_mail( $to, $subject, implode( "\n", $lines ) );
		} finally {
			if ( false !== $priority ) {
				add_filter( 'pre_wp_mail', array( Mailer::class, 'pre_wp_mail' ), $priority, 2 );
			}
			if ( $switched_locale ) {
				restore_previous_locale();
			}
		}
	}

	/**
	 * One plain line for each record that isn't there yet.
	 *
	 * @param array  $lookup Local lookup.
	 * @param string $domain Sending domain.
	 * @return string[]
	 */
	private static function missing_lines( $lookup, $domain ) {
		$lines = array();
		foreach ( (array) ( $lookup['records'] ?? array() ) as $record ) {
			$state = (string) ( $record['state'] ?? '' );
			if ( in_array( $state, array( 'found', 'verified' ), true ) ) {
				continue;
			}
			$purpose = (string) ( $record['purpose'] ?? '' );
			if ( 'sender_domain' === $purpose ) {
				/* translators: %s: the domain email is sent from, e.g. example.com. */
				$lines[] = sprintf( __( '%s isn’t pointing at a website or mailbox yet.', 'jetpack-send-pkg' ), $domain );
				continue;
			}
			$label = self::record_label( $purpose, $domain );
			if ( '' === $label ) {
				continue;
			}
			$lines[] = 'needs_fix' === $state
				? self::fix_line( $label, (string) ( $record['problem'] ?? '' ) )
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				: sprintf( __( '%s: not found yet', 'jetpack-send-pkg' ), $label );
		}
		return $lines;
	}

	/**
	 * One plain line naming what's wrong with a record, in the setup screen's words.
	 *
	 * @param string $label   What the record does.
	 * @param string $problem Problem code from the lookup.
	 * @return string
	 */
	private static function fix_line( $label, $problem ) {
		switch ( $problem ) {
			case 'wrong_value':
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				return sprintf( __( '%s: doesn’t match', 'jetpack-send-pkg' ), $label );
			case 'doubled':
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				return sprintf( __( '%s: name doubled', 'jetpack-send-pkg' ), $label );
			case 'conflict':
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				return sprintf( __( '%s: old record in the way', 'jetpack-send-pkg' ), $label );
			case 'proxied':
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				return sprintf( __( '%s: proxy on', 'jetpack-send-pkg' ), $label );
			case 'not_live':
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				return sprintf( __( '%s: not live yet', 'jetpack-send-pkg' ), $label );
			default:
				/* translators: %s: what the record does, e.g. "Signs your emails so inboxes trust them". */
				return sprintf( __( '%s: needs a change', 'jetpack-send-pkg' ), $label );
		}
	}

	/**
	 * The plain name of a record, as the setup screens show it.
	 *
	 * @param string $purpose `lockdown`, `dkim` or `spf`.
	 * @param string $domain  Sending domain.
	 * @return string
	 */
	private static function record_label( $purpose, $domain ) {
		switch ( $purpose ) {
			case 'lockdown':
				/* translators: %s: the domain email is sent from, e.g. example.com. */
				return sprintf( __( 'Lets Jetpack send for %s', 'jetpack-send-pkg' ), $domain );
			case 'dkim':
				return __( 'Signs your emails so inboxes trust them', 'jetpack-send-pkg' );
			case 'spf':
				return __( 'Lists Jetpack as an approved sender', 'jetpack-send-pkg' );
			default:
				return '';
		}
	}
}
