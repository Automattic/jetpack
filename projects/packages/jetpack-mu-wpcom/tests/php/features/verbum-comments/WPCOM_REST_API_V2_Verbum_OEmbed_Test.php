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
	 * The oEmbed data the fake provider returns.
	 *
	 * @var array
	 */
	private $provider_data = array();

	/**
	 * URLs requested during the test.
	 *
	 * @var string[]
	 */
	private $requested_urls = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'pre_http_request', array( $this, 'fake_provider' ), 10, 3 );
	}

	/**
	 * Serve the provider's page, which advertises an oEmbed endpoint, and the endpoint itself.
	 *
	 * @param false|array $response Short-circuit response.
	 * @param array       $args     Request arguments.
	 * @param string      $url      Request URL.
	 * @return array
	 */
	public function fake_provider( $response, $args, $url ) {
		$this->requested_urls[] = $url;

		if ( str_starts_with( $url, 'https://provider.example/oembed' ) ) {
			$body = wp_json_encode( $this->provider_data, JSON_UNESCAPED_SLASHES );
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
	 * Add the fake provider to the oEmbed provider list.
	 *
	 * @param array $providers oEmbed providers.
	 * @return array
	 */
	public function list_provider( $providers ) {
		$providers['#https?://provider\.example/post/.*#i'] = array( 'https://provider.example/oembed', true );
		return $providers;
	}

	/**
	 * Fetch embed data for EMBED_URL through the endpoint.
	 *
	 * @return object|WP_Error
	 */
	private function get_embed_data() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/verbum/embed' );
		$request->set_param( 'embed_url', self::EMBED_URL );

		return ( new WPCOM_REST_API_V2_Verbum_OEmbed() )->get_embed_data( $request );
	}

	/**
	 * A provider that isn't on the list is never discovered or fetched.
	 */
	public function test_unlisted_provider_is_not_discovered() {
		$data = $this->get_embed_data();

		$this->assertInstanceOf( WP_Error::class, $data );
		$this->assertSame( 'oembed_invalid_url', $data->get_error_code() );
		$this->assertSame( array(), $this->requested_urls );
	}

	/**
	 * The response HTML is built by data2html() instead of passed through from the provider.
	 */
	public function test_listed_provider_html_is_built_by_core() {
		add_filter( 'oembed_providers', array( $this, 'list_provider' ) );
		$this->provider_data = array(
			'version' => '1.0',
			'type'    => 'photo',
			'url'     => 'https://provider.example/photo.jpg',
			'width'   => 100,
			'height'  => 100,
			'html'    => '<svg onload="alert(document.domain)"></svg>',
		);

		$data = $this->get_embed_data();

		$this->assertStringNotContainsString( 'onload', $data->html );
		$this->assertStringContainsString( '<img src="https://provider.example/photo.jpg"', $data->html );
	}
}
