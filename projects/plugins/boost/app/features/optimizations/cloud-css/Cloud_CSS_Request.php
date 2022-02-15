<?php
/**
 * Cloud CSS state.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;

/**
 * Cloud CSS State
 */
class Cloud_CSS_Request {

	/**
	 * @var Critical_CSS_State
	 */
	private $cloud_css_state;

	/**
	 * @var Source_Providers
	 */
	private $source_providers;

	public function __construct() {
		$this->source_providers = new Source_Providers();
		$this->cloud_css_state  = new Critical_CSS_State();
	}

	public function request_generate() {
		$this->cloud_css_state->create_request( $this->source_providers->get_providers() );
		$sources = $this->cloud_css_state->get_provider_urls();

		$client               = Boost_API::get_client();
		$payload              = array( 'providers' => $sources );
		$payload['requestId'] = md5( wp_json_encode( $payload ) );

		$response = $client->post( 'cloud-css', $payload );
		return array( $response, $sources );
	}
}
