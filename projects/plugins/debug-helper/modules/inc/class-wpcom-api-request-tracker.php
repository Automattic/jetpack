<?php
/**
 * The WPCOM_API_Request_Tracker class
 *
 * @package automattic/jetpack-debug-helper.
 */

/**
 * WPCOM_API_Request_Tracker.
 *
 * Tracks requests to WPCOM public API.
 */
class WPCOM_API_Request_Tracker {

	/**
	 * Singleton WPCOM_API_Request_Tracker instance.
	 *
	 * @var WPCOM_API_Request_Tracker
	 **/
	private static $instance = null;

	/**
	 * Holds requests to WPCOM public API.
	 *
	 * @var array
	 */
	protected $requests = array();

	/**
	 * Private WPCOM_API_Request_Tracker constructor.
	 *
	 * Use the WPCOM_API_Request_Tracker::init() method to get an instance.
	 */
	private function __construct() {
		add_action( 'requests-requests.before_request', array( $this, 'store_requests' ), 1, 1 );
	}

	/**
	 * Initialize class and get back a singleton instance.
	 *
	 * @return WPCOM_API_Request_Tracker
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new WPCOM_API_Request_Tracker();
		}

		return self::$instance;
	}

	/**
	 * Tracks request count to WPCOM public API.
	 *
	 * Attached to the `requests-requests.before_request` filter.
	 *
	 * @param string $url URL of request about to be made.
	 * @return void
	 */
	public function store_requests( $url ) {
		$url_host = wp_parse_url( $url, PHP_URL_HOST );

		if ( 'public-api.wordpress.com' === $url_host ) {
			$this->requests[ $url ] = array_key_exists( $url, $this->requests ) ? $this->requests[ $url ]++ : 1;
		}
	}

	/**
	 * Returns the stored requests.
	 *
	 * @return array Stored URLs array as URL => request count.
	 */
	public function get_requests() {
		return $this->requests;
	}
}
