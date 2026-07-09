<?php
/**
 * Controller double for exercising Report_Data_Fetcher request handling.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Records fetcher requests and returns canned results.
 */
class Fetcher_Spy_Controller extends Fake_Report_Controller {

	/**
	 * Requests passed to fetch_data().
	 *
	 * @var array[]
	 */
	public $requests = array();

	/**
	 * Results returned from fetch_data(), in call order.
	 *
	 * @var array
	 */
	public $results = array();

	/**
	 * Optional matching field for comparison tests.
	 *
	 * @var string|null
	 */
	public $matching_field = null;

	/**
	 * Additional params merged into requests.
	 *
	 * @return array
	 */
	public function get_additional_params(): array {
		return array(
			'max'        => 100,
			'overridden' => 'default',
		);
	}

	/**
	 * Fields requested from the data source.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array( 'bucket', 'count' );
	}

	/**
	 * Transform request params immediately before fetching.
	 *
	 * @param array $params Request params.
	 * @return array
	 */
	public function prepare_request_params( array $params ): array {
		$params['prepared'] = true;
		return $params;
	}

	/**
	 * Optional custom data fetcher hook.
	 *
	 * @param string $endpoint Endpoint.
	 * @param array  $params   Request params.
	 * @return mixed
	 */
	public function fetch_data( string $endpoint, array $params ) {
		$this->requests[] = array(
			'endpoint' => $endpoint,
			'params'   => $params,
		);

		if ( ! empty( $this->results ) ) {
			return array_shift( $this->results );
		}

		return array(
			'data' => array(
				array(
					'bucket' => 'A',
					'count'  => 10,
				),
			),
		);
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return $this->matching_field;
	}
}
