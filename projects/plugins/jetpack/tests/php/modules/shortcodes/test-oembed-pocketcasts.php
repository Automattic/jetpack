<?php
/**
 * Tests PocketCasts oEmbed.
 *
 * @todo Remove when WordPress 6.1 is the minimum version.
 */

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_PocketCasts extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	const POCKETCASTS_TEST_URL      = 'https://pca.st/6934i7iw';
	const POCKETCASTS_BETA_TEST_URL = 'https://pcast.pocketcasts.net/drtlaf9s';

	/**
	 * Set up.tail
	 */
	public function set_up() {
		parent::set_up();

		if ( in_array( 'external-http', $this->getGroups(), true ) ) {
			// Used by WordPress.com - does nothing in Jetpack.
			add_filter( 'tests_allow_http_request', '__return_true' );
		} else {
			/**
			 * We normally make an HTTP request to PocketCasts's oEmbed endpoint.
			 * This filter bypasses that HTTP request for these tests.
			 */
			add_filter( 'pre_http_request', array( $this, 'pre_http_request' ), 10, 3 );
		}
	}

	public function pre_http_request( $response, $args, $url ) {

		if ( ! ( wp_startswith( $url, 'https://pca.st/oembed.json' ) ||
			wp_startswith( $url, 'https://pcast.pocketcasts.net/oembed.json' ) ) ) {
			return $response;
		}

		$response = array(
			'response' => array(
				'code' => 200,
			),
		);

		$api_query      = wp_parse_url( $url, PHP_URL_QUERY );
		$api_query_args = null;
		wp_parse_str( $api_query, $api_query_args );

		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		switch ( $api_query_args['url'] ) {
			case self::POCKETCASTS_TEST_URL:
				$response['body'] = '{"type":"rich","version":"1.0","provider_name":"Pocket Casts","provider_url":"https://pocketcasts.com/","title":"Episode 29: Dylan Field, Figma Co-founder, Talks Design, Digital Economy, and Remote Culture with Host Connie Yang - Distributed, with Matt Mullenweg","author_name":"Distributed, with Matt Mullenweg","author_url":"https://distributed.blog","html":"\u003cdiv style=\"width: 100%; max-width: 1200px; max-height: 100%; position: relative;\"\u003e\n    \u003cdiv style=\"padding-bottom: 42.857142857142854%;\"\u003e\u003c/div\u003e\n    \u003ciframe src=\"https://pca.st/embed/6934i7iw\" width=\"1200\" height=\"514.2857142857142\" style=\"border: 0; border-radius: 8px; position: absolute; top: 0; left: 0; width: 100%; height: 100%;\"\u003e\u003c/iframe\u003e\n\u003c/div\u003e","width":1200,"height":514.2857142857142}';
				break;

			case self::POCKETCASTS_BETA_TEST_URL:
				$response['body'] = '{"type":"rich","version":"1.0","provider_name":"Pocket Casts","provider_url":"https://pocketcasts.com/","title":"Tom - Dead Eyes","author_name":"Dead Eyes","author_url":"https://art19.com/shows/dead-eyes","html":"\u003cdiv style=\"width: 100%; max-width: 1200px; max-height: 100%; position: relative;\"\u003e\n    \u003cdiv style=\"padding-bottom: 42.857142857142854%;\"\u003e\u003c/div\u003e\n    \u003ciframe src=\"https://pcast.pocketcasts.net/embed/drtlaf9s\" width=\"1200\" height=\"514.2857142857142\" style=\"border: 0; border-radius: 8px; position: absolute; top: 0; left: 0; width: 100%; height: 100%;\" allowfullscreen=\"true\" frameborder=\"0\" sandbox=\"allow-scripts allow-same-origin allow-presentation\"\u003e\u003c/iframe\u003e\n\u003c/div\u003e\n","width":1200,"height":514.2857142857142}';
				break;
			default:
				return new WP_Error( 'unexpected-http-request', 'Test is making an unexpected HTTP request.' );
		}
		// phpcs:enable

		return $response;
	}

	/**
	 * Test Pocket Casts oEmbed endpoint.
	 */
	public function test_pocketcasts_oembed_fetch_url() {

		$wp_embed = new WP_Embed();
		$actual   = $wp_embed->autoembed( self::POCKETCASTS_TEST_URL );

		/*
			$actual contains this:
			<div style="width: 100%; max-width: 1200px; max-height: 100%; position: relative;">    <div style="padding-bottom: 42.857142857142854%;"></div>    <iframe title="Episode 29: Dylan Field, Figma Co-founder, Talks Design, Digital Economy, and Remote Culture with Host Connie Yang - Distributed, with Matt Mullenweg" src="https://pca.st/embed/6934i7iw" width="1200" height="514.2857142857142" style="border: 0; border-radius: 8px; position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>
		*/

		$this->assertStringContainsString(
			'src="https://pca.st/embed/6934i7iw"',
			$actual
		);
	}

	/**
	 * Test Pocket Casts beta oEmbed endpoint.
	 */
	public function test_pocketcasts_beta_oembed_fetch_url() {

		$wp_embed = new WP_Embed();
		$actual   = $wp_embed->autoembed( self::POCKETCASTS_BETA_TEST_URL );

		/*
			$actual contains this:
			<div style="width: 100%; max-width: 1200px; max-height: 100%; position: relative;">    <div style="padding-bottom: 42.857142857142854%;"></div>    <iframe title="Tom - Dead Eyes" src="https://pcast.pocketcasts.net/embed/drtlaf9s" width="1200" height="514.2857142857142" style="border: 0; border-radius: 8px; position: absolute; top: 0; left: 0; width: 100%; height: 100%;" allowfullscreen="true" frameborder="0" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe></div>
		*/

		// When added to trusted list of oEmbed providers, the sandbox attribute should not be stripped.
		$this->assertStringContainsString(
			'sandbox="',
			$actual
		);
	}
}
