<?php
/**
 * Class WPCOMSH_Log
 * This is an interface for logging arbitrary data to wpcom logstash cluster.
 * This auto-initializes and provides a hook to log data:
 * ```
 * do_action(  'wpcomsh_log', "test" );
 * ```
 * You can see logs in Kibana, log2logstash index, `feature:automated-transfer`
 */
class WPCOMSH_Log {
	static protected $log_endpoint = 'https://public-api.wordpress.com/rest/v1.1/automated-transfers/log';
	private static $instance;
	private $log_queue = array();
	private $logging_on = false;
	private $siteurl;

	private function __construct() {
		$this->logging_on = get_option( 'at_options_logging_on' );
		if( $this->logging_on ) {
			// Hook to more hooks if needed.
			add_action( 'wpcomsh_log', array( $this, 'log' ), 1 );
			register_shutdown_function( array( $this, 'send_to_api' ) );
			$this->siteurl = get_site_url();
		}
	}

	public static function init() {
		if ( self::$instance ) {
			return;
		} else {
			self::$instance = new self();
		}
	}

	public function is_logging_on() {
		return $this->logging_on;
	}

	public function log( $message ) {
		if ( ! $this->is_logging_on() ) {
			return;
		}
		$this->log_queue[] = array( "message" => $message );
	}

	public function send_to_api() {
		if ( $this->is_logging_on() && count( $this->log_queue ) > 0 ) {
			$payload = array(
				'siteurl' => $this->siteurl,
				'messages' =>$this->log_queue
			);

			wp_remote_post( self::$log_endpoint, array( 'body' => array( 'error' => json_encode( $payload ) ) ) );
		}
	}
}
add_action( 'init', array( 'WPCOMSH_Log', 'init' ) );
