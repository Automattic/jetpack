<?php
/**
 * Test class for WPCOM_REST_API_V2_Verbum_OEmbed.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/verbum-comments/assets/class-wpcom-rest-api-v2-verbum-oembed.php';

/**
 * Test class for WPCOM_REST_API_V2_Verbum_OEmbed.
 *
 * @covers \WPCOM_REST_API_V2_Verbum_OEmbed
 */
#[CoversClass( WPCOM_REST_API_V2_Verbum_OEmbed::class )]
class WPCOM_REST_API_V2_Verbum_OEmbed_Test extends \WorDBless\BaseTestCase {

	const EMBED_URL = 'https://provider.example/post/1';

	/**
	 * The HTML the fake oEmbed provider returns.
	 *
	 * @var string
	 */
	private $provider_html = '';

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );
		parent::tear_down();
	}

	/**
	 * Serve a discoverable oEmbed provider without hitting the network.
	 *
	 * @param false|array $response Short-circuit response.
	 * @param array       $args     Request arguments.
	 * @param string      $url      Request URL.
	 * @return array
	 */
	public function fake_provider( $response, $args, $url ) {
		if ( str_starts_with( $url, 'https://provider.example/oembed' ) ) {
			$body = wp_json_encode(
				array(
					'version' => '1.0',
					'type'    => 'rich',
					'html'    => $this->provider_html,
				),
				JSON_UNESCAPED_SLASHES
			);
		} else {
			$body = '<html><head><link rel="alternate" type="application/json+oembed" href="https://provider.example/oembed?url=' . rawurlencode( self::EMBED_URL ) . '" /></head></html>';
		}

		return array(
			'headers'  => array(),
			'body'     => $body,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
		);
	}

	/**
	 * Fetch embed data for EMBED_URL through the endpoint.
	 *
	 * @param string $provider_html HTML the provider returns.
	 * @return object|WP_Error
	 */
	private function get_embed_data( $provider_html ) {
		$this->provider_html = $provider_html;
		add_filter( 'pre_http_request', array( $this, 'fake_provider' ), 10, 3 );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/verbum/embed' );
		$request->set_param( 'embed_url', self::EMBED_URL );

		return ( new WPCOM_REST_API_V2_Verbum_OEmbed() )->get_embed_data( $request );
	}

	/**
	 * An untrusted provider that returns only markup, with no iframe, gets no HTML through.
	 */
	public function test_untrusted_provider_markup_without_iframe_is_dropped() {
		$data = $this->get_embed_data( '<svg width="1" height="1" onload="alert(document.domain)"></svg>' );

		$this->assertFalse( $data->html );
	}

	/**
	 * An untrusted provider's iframe is kept, sandboxed, and stripped of other markup.
	 */
	public function test_untrusted_provider_html_is_sanitized() {
		$data = $this->get_embed_data( '<svg onload="alert(1)"></svg><iframe src="https://provider.example/frame" onload="alert(2)"></iframe>' );

		$this->assertStringNotContainsString( 'onload', $data->html );
		$this->assertStringNotContainsString( '<svg', $data->html );
		$this->assertStringContainsString( 'sandbox="allow-scripts"', $data->html );
		$this->assertStringContainsString( 'src="https://provider.example/frame', $data->html );
	}
}
