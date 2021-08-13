<?php
/**
 * Represents a request to generate a pair of speed scores.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Speed_Score_Request
 */
class Speed_Score_Request extends Cacheable {
	/**
	 * Algorithm to use when defining a hash for the cache.
	 */
	const CACHE_KEY_HASH_ALGO = 'md5';

	/**
	 * The URL to get the Speed Scores for.
	 *
	 * @var string $url Url to get the Speed Scores for.
	 */
	private $url;

	/**
	 * When the Speed Scores request was created, in seconds since epoch.
	 *
	 * @var float $created Speed Scores request creation timestamp.
	 */
	private $created;

	/**
	 * The speed scores result, as an associative array.
	 *
	 * @var array $scores
	 */
	private $scores;

	/**
	 * The error returned
	 *
	 * @var array $error Speed Scores error.
	 */
	private $error;

	/**
	 * Constructor.
	 *
	 * @param string $url     The URL to get the Speed Scores for.
	 * @param float  $created When the Speed Scores request was created, in seconds since epoch.
	 * @param array  $scores  The Speed Scores result.
	 * @param string $error   The Speed Scores error.
	 */
	public function __construct( $url, $created = null, $scores = null, $error = null ) {
		$this->set_cache_id( self::generate_cache_id_from_url( $url ) );

		$this->url     = Url::normalize( $url );
		$this->created = is_null( $created ) ? microtime( true ) : $created;
		$this->scores  = $scores;
		$this->error   = $error;
	}

	/**
	 * Generate the cache ID from the URL.
	 *
	 * @param string $url The URL to get the Speed Scores for.
	 *
	 * @return string
	 */
	public static function generate_cache_id_from_url( $url ) {
		return hash( self::CACHE_KEY_HASH_ALGO, $url );
	}

	/**
	 * Convert this object to a plain array for JSON serialization.
	 *
	 * @return array The object as an array.
	 */
	public function jsonSerialize() {
		return array(
			'id'      => $this->get_cache_id(),
			'url'     => $this->url,
			'created' => $this->created,
			'scores'  => $this->scores,
			'error'   => $this->error,
		);
	}

	/**
	 * This is intended to be the reverse of JsonSerializable->jsonSerialize.
	 *
	 * @param mixed $data The data to turn into an object.
	 *
	 * @return Speed_Score_Request
	 */
	public static function jsonUnserialize( $data ) {
		$object = new Speed_Score_Request(
			$data['url'],
			$data['created'],
			$data['scores'],
			$data['error']
		);

		if ( ! empty( $data['id'] ) ) {
			$object->set_cache_id( $data['id'] );
		}

		return $object;
	}

	/**
	 * Return the cache prefix.
	 *
	 * @return string
	 */
	protected static function cache_prefix() {
		return 'jetpack_boost_speed_scores_';
	}

	/**
	 * Send a Speed Scores request to the API.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function execute() {
		$blog_id = (int) \Jetpack_Options::get_option( 'id' );

		$response = Utils::send_wpcom_request(
			'POST',
			sprintf( '/sites/%d/jetpack-boost/speed-scores', $blog_id ),
			null,
			array(
				'request_id' => $this->get_cache_id(),
				'url'        => $this->url,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return true;
	}

	/**
	 * Is this request pending?
	 */
	public function is_pending() {
		return empty( $this->error ) && empty( $this->score );
	}

	/**
	 * Poll for updates to this Speed Scores request.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function poll_update() {
		$blog_id = (int) \Jetpack_Options::get_option( 'id' );

		$response = Utils::send_wpcom_request(
			'GET',
			sprintf(
				'/sites/%d/jetpack-boost/speed-scores/%s',
				$blog_id,
				$this->get_cache_id()
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		switch ( $response->status ) {
			case 'pending':
				break;

			case 'error':
				$this->error = $response->error;
				$this->store();
				break;

			case 'success':
				$this->scores = $response->scores;
				$this->store();
				break;

			default:
				return new \WP_Error(
					'invalid_response',
					__(
						'Invalid response from WPCOM API while polling for speed scores',
						'jetpack-boost'
					),
					$response
				);
		}

		return true;
	}
}
