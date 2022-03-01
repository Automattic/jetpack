<?php
/**
 * WP_Test_Jetpack_Shortcodes_Mixcloud class
 *
 * @package automattic/jetpack
 */

// Dummy comment so phpcs sees the above as a file doc comment.
require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Test class for the Mixcloud shortcode.
 */
class WP_Test_Jetpack_Shortcodes_Mixcloud extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Runs before every test
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		$this->invalid_markup = '<!-- mixcloud error: invalid mixcloud resource -->';

	}

	/**
	 * Test that the shortcode is added.
	 *
	 * @return void
	 */
	public function test_shortcodes_mixcloud_exists() {
		$this->assertEquals( shortcode_exists( 'mixcloud' ), true );
	}

	/**
	 * Test the Mixcloud shortcode when content and $atts[0] are empty
	 *
	 * @return void
	 */
	public function test_shortcodes_mixcloud_content_empty() {
		$content = '[mixcloud id="" attr="1"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $this->invalid_markup, $shortcode_content );

		$content = '[mixcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $this->invalid_markup, $shortcode_content );
	}

	/**
	 * Test the Mixcloud shortcode when content and $atts[0] are not a mixcloud link
	 *
	 * @return void
	 */
	public function test_shortcodes_mixcloud_content_is_not_mixcloud_link() {
		$content = '[mixcloud id="test.com"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $this->invalid_markup, $shortcode_content );
	}

	/**
	 * Test the Mixcloud shortcode when wp_remote_get returns a WP_Error object.
	 *
	 * @return void
	 */
	public function test_shortcodes_mixcloud_remote_get_wp_error() {

		$http_request_filter = function () {
			return new WP_Error( 'error' );
		};

		add_filter( 'pre_http_request', $http_request_filter, 10, 1 );

		$content = '[mixcloud width=500 height 100 mini="true" hide_followers="true" hide_artwork="true" light="true"]https://www.mixcloud.com/DJOneF/djonef-mashup-mix-june-2020/[/mixcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( $this->invalid_markup, $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10, 1 );
	}

	/**
	 * Test the Mixcloud shortcode when the iframe returned doesn't have the sandbox param.
	 *
	 * @return void
	 */
	public function test_shortcodes_mixcloud_no_sandbox() {

		$http_request_filter = function () {

			$body_object = array(
				'html' => '<iframe width="500" height="60" src="https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2FDJOneF%2Fdjonef-mashup-mix-june-2020%2F&amp;hide_artwork=1&amp;hide_cover=1&amp;light=1&amp;mini=1" frameborder="0" sandbox="allow-popups"></iframe>',
			);

			return array(
				'response' => array(
					'code' => 200,
				),
				'body'     => wp_json_encode( $body_object ),
			);
		};

		add_filter( 'pre_http_request', $http_request_filter, 10, 1 );

		$content = '[mixcloud width=500 height 100 mini="true" hide_followers="true" hide_artwork="true" light="true"]https://www.mixcloud.com/DJOneF/djonef-mashup-mix-june-2020/[/mixcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( '<iframe width="500" height="60" src="https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2FDJOneF%2Fdjonef-mashup-mix-june-2020%2F&amp;hide_artwork=1&amp;hide_cover=1&amp;light=1&amp;mini=1" frameborder="0" sandbox="allow-popups allow-scripts allow-same-origin allow-presentation"></iframe>', $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10, 1 );
	}

	/**
	 * Test the Mixcloud shortcode when the iframe returned has a sandbox attribute with
	 * allow-popups in there value
	 *
	 * @return void
	 */
	public function test_shortcodes_mixcloud_sandbox_have_allow_popups() {

		$http_request_filter = function () {

			$body_object = array(
				'html' => '<iframe width="500" height="60" src="https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2FDJOneF%2Fdjonef-mashup-mix-june-2020%2F&amp;hide_artwork=1&amp;hide_cover=1&amp;light=1&amp;mini=1" frameborder="0" sandbox="allow-popups"></iframe>',
			);

			return array(
				'response' => array(
					'code' => 200,
				),
				'body'     => wp_json_encode( $body_object ),
			);
		};

		add_filter( 'pre_http_request', $http_request_filter, 10, 1 );

		$content = '[mixcloud width=500 height 100 mini="true" hide_followers="true" hide_artwork="true" light="true"]https://www.mixcloud.com/DJOneF/djonef-mashup-mix-june-2020/[/mixcloud]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( '<iframe width="500" height="60" src="https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2FDJOneF%2Fdjonef-mashup-mix-june-2020%2F&amp;hide_artwork=1&amp;hide_cover=1&amp;light=1&amp;mini=1" frameborder="0" sandbox="allow-popups allow-scripts allow-same-origin allow-presentation"></iframe>', $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10, 1 );
	}
}
