<?php
/**
 * WPCOMSH Log file.
 *
 * @package wpcomsh
 */

/**
 * Class WPCOMSH_Log
 *
 * This is an interface for logging arbitrary data to wpcom logstash cluster.
 * This auto-initializes and provides a hook to log data:
 * ```
 * do_action( 'wpcomsh_log', "test" );
 * ```
 *
 * You can see logs in Kibana, log2logstash index, under `feature:automated_transfer`
 * by default. Records sent via `unsafe_direct_log_logstash()` land under the
 * caller-supplied `feature:` bucket instead.
 *
 * Note that logging must be enabled for the site for the logs to be sent,
 * which involves enabling the `at_options_logging_on` site option on the
 * Jetpack site.
 */
class WPCOMSH_Log {
	/**
	 * Logging Endpoint URL.
	 *
	 * @var string
	 */
	protected static $log_endpoint = 'https://public-api.wordpress.com/rest/v1.1/automated-transfers/log';

	/**
	 * Logstash endpoint URL — drained by `unsafe_direct_log_logstash()`,
	 * which lets each record land under its own Kibana `feature` bucket
	 * instead of the default `feature:automated_transfer` stream.
	 *
	 * @var string
	 */
	protected static $logstash_endpoint = 'https://public-api.wordpress.com/rest/v1.1/logstash';

	/**
	 * Class instance.
	 *
	 * @var WPCOMSH_Log
	 */
	private static $instance;

	/**
	 * Queue of log messages bound for /automated-transfers/log.
	 *
	 * @var array
	 */
	private $log_queue = array();

	/**
	 * Queue of log messages bound for /logstash. Each entry carries its own
	 * feature/severity so the receiver can bucket records distinctly.
	 *
	 * @var array
	 */
	private $logstash_queue = array();

	/**
	 * Whether it has a shutdown hook.
	 *
	 * @var bool
	 */
	private $has_shutdown_hook = false;

	/**
	 * Site URL.
	 *
	 * @var string
	 */
	private $siteurl;

	/**
	 * This instantiates the logging system. Because constructor is private, it can be only set up with `init` or `unsafe_direct_log`.
	 * `init` respects `at_options_logging_on` option. This essentially turns logging on/off so that we don't flood
	 * endpoint with too many requests.
	 * This is to be hooked into wp `init` hook.
	 */
	public static function init() {
		if ( ! get_option( 'at_options_logging_on' ) ) {
			return;
		}

		if ( self::$instance ) {
			return;
		}

		self::$instance = new self();
		self::$instance->add_hooks();
	}

	/**
	 * This method bypasses `at_options_logging_on` check.
	 * It is intended to be used when we are sure we want to send logs to logstash and
	 * we are sure that we don't fire it off frequently. Good example of when we want to use this
	 * is during the site setup process
	 *
	 * @param string $message Log message.
	 * @param array  $extra   Optional. Additional log data. Defaults to empty array.
	 */
	public static function unsafe_direct_log( $message, $extra = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		self::$instance->log( $message, $extra );
	}

	/**
	 * Direct counterpart to `unsafe_direct_log()` for records that should
	 * land on the public `/logstash` endpoint under their own
	 * `feature` bucket instead of the default `feature:automated_transfer`
	 * stream that `/automated-transfers/log` writes into.
	 *
	 * Use this when the record needs to be alertable / dashboarded
	 * independently from the automated-transfer telemetry firehose.
	 * Like `unsafe_direct_log()`, this bypasses the
	 * `at_options_logging_on` site option, so callers must ensure they
	 * don't fire it off frequently.
	 *
	 * @param string $feature Logstash `feature` bucket.
	 * @param string $message Log message.
	 * @param array  $options {
	 *     Optional. Per-record options.
	 *
	 *     @type array  $properties Structured key-value data, indexed under `properties.*` in Kibana for filtering / sorting / aggregation.
	 *     @type string $severity   Severity tag (e.g. 'critical', 'error', 'warning', 'info').
	 *     @type array  $extra      Unstructured context — preserved on the record but not intended for term-aggregation.
	 * }
	 */
	public static function unsafe_direct_log_logstash( $feature, $message, $options = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		self::$instance->log_to_logstash( $feature, $message, $options );
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->siteurl = get_site_url();
	}

	/**
	 * Adds the log action.
	 */
	private function add_hooks() {
		add_action( 'wpcomsh_log', array( $this, 'log' ), 1 );
	}

	/**
	 * Logs a log message.
	 *
	 * @param string $message Log message.
	 * @param array  $extra   Optional. Additional log data. Defaults to empty array.
	 */
	public function log( $message, $extra = array() ) {
		$this->log_queue[] = array(
			'message' => $message,
			'extra'   => $extra,
		);
		$this->ensure_shutdown_hook();
	}

	/**
	 * Queue a record for the `/logstash` endpoint. Drained on shutdown by
	 * `send_to_api()` alongside the `/automated-transfers/log` queue.
	 *
	 * @param string $feature Logstash `feature` bucket.
	 * @param string $message Log message.
	 * @param array  $options Optional per-record options: `properties`, `severity`, `extra`.
	 *                        See `unsafe_direct_log_logstash()` for details.
	 */
	public function log_to_logstash( $feature, $message, $options = array() ) {
		$entry = array(
			'feature' => $feature,
			'message' => $message,
		);
		if ( ! empty( $options['properties'] ) ) {
			$entry['properties'] = (array) $options['properties'];
		}
		if ( ! empty( $options['severity'] ) ) {
			$entry['severity'] = (string) $options['severity'];
		}
		if ( ! empty( $options['extra'] ) ) {
			$entry['extra'] = (array) $options['extra'];
		}
		$this->logstash_queue[] = $entry;
		$this->ensure_shutdown_hook();
	}

	/**
	 * Register the shared shutdown drain on first enqueue.
	 */
	private function ensure_shutdown_hook() {
		if ( $this->has_shutdown_hook ) {
			return;
		}
		register_shutdown_function( array( $this, 'send_to_api' ) );
		$this->has_shutdown_hook = true;
	}

	/**
	 * Sends log messages to the API endpoint.
	 */
	public function send_to_api() {
		if ( count( $this->log_queue ) > 0 ) {
			$payload = array(
				'siteurl'  => $this->siteurl,
				'messages' => $this->log_queue,
			);

			wp_remote_post( self::$log_endpoint, array( 'body' => array( 'error' => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ) ) ) );
		}

		foreach ( $this->logstash_queue as $entry ) {
			wp_remote_post( self::$logstash_endpoint, array( 'body' => array( 'params' => wp_json_encode( $entry, JSON_UNESCAPED_SLASHES ) ) ) );
		}
	}
}
add_action( 'init', array( 'WPCOMSH_Log', 'init' ) );
