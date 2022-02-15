<?php
/**
 * Cloud CSS state.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Source_Providers\Source_Providers;

/**
 * Cloud CSS State
 */
class Cloud_CSS_Request {

	/**
	 * @var Cloud_CSS_State
	 */
	private $cloud_css_state;

	/**
	 * @var Source_Providers
	 */
	private $source_providers;

	public function __construct() {
		$this->source_providers = new Source_Providers();
		$this->cloud_css_state = new Cloud_CSS_State();
	}

	public function request_generate() {
		$this->cloud_css_state->create_request( $this->source_providers->get_providers() );
		$sources = $this->cloud_css_state->get_provider_urls();

		$response = wp_remote_post( 'http://hydra-api:1982/v1/action/critical-css', [
			'body' => wp_json_encode( [ 'providers' => $sources ] ),
			'timeout' => 30,
			'headers' => [
				'Content-Type' => 'application/json',
			],
		] );

		return [ $response, $sources ];
	}
}
