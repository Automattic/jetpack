<?php
/**
 * Represents a request to generate a pair of speed scores.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Speed_Score;

use Automattic\Jetpack_Boost\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Cacheable;
use Automattic\Jetpack_Boost\Lib\Url;

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
	 * Active Jetpack Boost modules.
	 *
	 * @var array $active_modules Active modules.
	 */
	private $active_modules;

	/**
	 * When the Speed Scores request was created, in seconds since epoch.
	 *
	 * @var float $created Speed Scores request creation timestamp.
	 */
	private $created;

	/**
	 * Current status of the Speed Score request.
	 *
	 * @var string $status Speed Scores request status.
	 */
	private $status;

	/**
	 * Number of retries attempted.
	 *
	 * @var int $retry_count Number of times this Speed Score request has been retried.
	 */
	private $retry_count;

	/**
	 * The error returned
	 *
	 * @var array $error Speed Scores error.
	 */
	private $error;

	/**
	 * Constructor.
	 *
	 * @param string $url The URL to get the Speed Scores for.
	 * @param array  $active_modules Active modules.
	 * @param null   $created When the Speed Scores request was created, in seconds since epoch.
	 * @param string $status Status of the Speed Scores request.
	 * @param null   $error The Speed Scores error.
	 */
	public function __construct( $url, $active_modules = array(), $created = null, $status = 'pending', $error = null ) {
		$this->set_cache_id( self::generate_cache_id_from_url( $url ) );

		$this->url            = $url;
		$this->active_modules = $active_modules;
		$this->created        = $created === null ? microtime( true ) : $created;
		$this->status         = $status;
		$this->error          = $error;
		$this->retry_count    = 0;
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
	 */
	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return array(
			'id'             => $this->get_cache_id(),
			'url'            => $this->url,
			'active_modules' => $this->active_modules,
			'created'        => $this->created,
			'status'         => $this->status,
			'error'          => $this->error,
			'retry_count'    => $this->retry_count,
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
			$data['active_modules'],
			$data['created'],
			$data['status'],
			$data['error']
		);

		if ( ! empty( $data['id'] ) ) {
			$object->set_cache_id( $data['id'] );
		}

		if ( ! empty( $data['retry_count'] ) ) {
			$object->retry_count = intval( $data['retry_count'] );
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
		$response = $this->get_client()->post(
			'speed-scores',
			array(
				'request_id'     => $this->get_cache_id(),
				'url'            => Url::normalize( $this->url ),
				'active_modules' => $this->active_modules,
			)
		);

		if ( is_wp_error( $response ) ) {
			$this->status = 'error';
			$this->error  = $response->get_error_message();
			$this->store();

			return $response;
		}

		return true;
	}

	/**
	 * Is this request pending?
	 */
	public function is_pending() {
		return 'pending' === $this->status;
	}

	/**
	 * Did the request fail?
	 */
	public function is_error() {
		return 'error' === $this->status;
	}

	/**
	 * Did the request succeed?
	 */
	public function is_success() {
		return 'success' === $this->status;
	}

	/**
	 * Poll for updates to this Speed Scores request.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function poll_update() {
		$response = $this->get_client()->get(
			sprintf(
				'speed-scores/%s',
				$this->get_cache_id()
			)
		);

		if ( is_wp_error( $response ) ) {
			// Special case: If the request is not found, restart it.
			if ( 'not_found' === $response->get_error_code() ) {
				return $this->restart();
			}

			return $response;
		}

		switch ( $response->status ) {
			case 'pending':
				// The initial job probably failed, dispatch again if so.
				if ( $this->created <= strtotime( '-15 mins' ) ) {
					return $this->restart();
				}
				break;

			case 'error':
				$this->status = 'error';
				$this->error  = $response->error;
				$this->store();
				break;

			case 'success':
				$this->status = 'success';
				$this->store();
				$this->record_history( $response );

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

	/**
	 * Restart this request; useful when WPCOM doesn't recognize the request or it times out.
	 */
	private function restart() {
		// Enforce a maximum number of restarts.
		if ( $this->retry_count > 2 ) {
			$this->status = 'error';
			$this->error  = 'Maximum number of retries exceeded';
			$this->store();

			return new \WP_Error(
				'error',
				$this->error
			);
		}

		$result = $this->execute();
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$this->created = time();
		++$this->retry_count;
		$this->store();

		return true;
	}

	/**
	 * Save the speed score record to history.
	 *
	 * @param object $response Response from api.
	 */
	private function record_history( $response ) {
		$history       = new Speed_Score_History( $this->url );
		$last_history  = $history->latest();
		$last_scores   = $last_history ? $last_history['scores'] : null;
		$last_theme    = $last_history ? $last_history['theme'] : null;
		$current_theme = wp_get_theme()->get( 'Name' );

		// Only change if there is a difference from last score or the theme changed.
		if ( $last_scores !== $response->scores || $current_theme !== $last_theme ) {
			$history->push(
				array(
					'timestamp' => time(),
					'scores'    => $response->scores,
					'theme'     => $current_theme,
				)
			);
		}
	}

	private function get_client() {
		return Boost_API::get_client();
	}
}
