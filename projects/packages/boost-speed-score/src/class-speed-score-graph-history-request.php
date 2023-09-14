<?php
/**
 * Represents a request to generate an array of speed scores history.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Cacheable;

/**
 * Class Speed_Score_Graph_History_Request
 */
class Speed_Score_Graph_History_Request extends Cacheable {
	/**
	 * Algorithm to use when defining a hash for the cache.
	 */
	const CACHE_KEY_HASH_ALGO = 'md5';

	/**
	 * The timestamp start windown in ms.
	 *
	 * @var number $start timestamp start windown in ms.
	 */
	private $start;

	/**
	 * The timestamp end windown in ms.
	 *
	 * @var number $end timestamp end windown in ms.
	 */
	private $end;

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
	 * @param number $start timestamp start windown in ms.
	 * @param number $end timestamp end windown in ms.
	 * @param array  $error Speed Scores error.
	 */
	public function __construct( $start, $end, $error ) {
		$this->start       = $start;
		$this->end         = $end;
		$this->error       = $error;
		$this->retry_count = 0;
	}

		/**
	 * Convert this object to a plain array for JSON serialization.
	 */
	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return array(
			'start'       => $this->start,
			'end'         => $this->end,
			'error'       => $this->error,
			'retry_count' => $this->retry_count,
		);
	}

	/**
	 * This is intended to be the reverse of JsonSerializable->jsonSerialize.
	 *
	 * @param mixed $data The data to turn into an object.
	 *
	 * @return Speed_Score_Graph_History_Request
	 */
	public static function jsonUnserialize( $data ) {
		$object = new Speed_Score_Graph_History_Request(
			$data['start'],
			$data['end'],
			$data['error']
		);

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
		return 'jetpack_boost_speed_scores_graph_history_';
	}

	/**
	 * Send a Speed History request to the API.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function execute() {
		$response = $this->get_client()->get(
			'speed-scores-history',
			array(
				'start' => $this->start,
				'end'   => $this->end,
			)
		);

		if ( is_wp_error( $response ) ) {
			$this->status = 'error';
			$this->error  = $response->get_error_message();
			$this->store();

			return $response;
		}

		return $response;
	}

	/**
	 * Instantiate the API client.
	 *
	 * @return Boost_API_Client
	 */
	private function get_client() {
		return Boost_API::get_client();
	}
}
