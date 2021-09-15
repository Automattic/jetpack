<?php
/**
 * Unit tests for smartframe embedding
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * @covers ::shortcode_smartframe
 */
class WP_Test_Jetpack_Shortcodes_SmartFrame extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	const SMARTFRAME_IDENTIFIER = 'mantymetsa_1630927773870';
	const SMARTFRAME_SCRIPT_ID  = '6ae67829d1264ee0ea6071a788940eae';

	const SMARTFRAME_SHORTCODE  = '[smartframe script-id="6ae67829d1264ee0ea6071a788940eae" image-id="mantymetsa_1630927773870" width="100%" max-width="1412px"]';
	const SMARTFRAME_EMBED      = '<script src="https://embed.smartframe.io/6ae67829d1264ee0ea6071a788940eae.js" data-image-id="mantymetsa_1630927773870" data-width="100%" data-max-width="1412px"></script>';

	/**
	 * Check for external HTTP requests and register filter
	 */
	public function setUp() {
		parent::setUp();

		if ( in_array( 'external-http', $this->getGroups(), true ) ) {
			// Used by WordPress.com - does nothing in Jetpack.
			add_filter( 'tests_allow_http_request', '__return_true' );
		} else {
			/*
			 * We normally make an HTTP request to SmartFrame's oEmbed endpoint to generate
			 * the shortcode output.
			 * This filter bypasses that HTTP request for these tests
			 */
			add_filter( 'pre_oembed_result', array( $this, 'smartframe_oembed_response' ), 10, 3 );
		}
	}

	/**
	 * Mocks matching HTML for an embedded smartframe item
	 * 
	 * @since  9.3.3
	 */
	public function smartframe_oembed_response( $html, $url ) {
		if ( 0 !== strpos( $url, 'smartframe.io' ) ) {
			return $html;
		}
		return self::SMARTFRAME_EMBED;
	}

	/**
	 * Verify that [smartframe] exists.
	 *
	 * @since  9.3.3
	 */
	public function test_shortcodes_smartframe_exists() {
		$this->assertEquals( shortcode_exists( 'smartframe' ), true );
	}

	/**
	 * See if the shortcode is converted to valid embedding code
	 * 
	 * @since  9.3.3
	 */
	public function test_smartframe_shortcode() {
		$parsed = do_shortcode( self::SMARTFRAME_SHORTCODE );

		$doc = new DOMDocument();
		$doc->loadHTML( $parsed );
		$links = $doc->getElementsByTagName( 'script' );

		foreach( $links as $link ) {
			$this->assertTrue( $link->hasAttribute( 'data-image-id' ) );
			$this->assertContains( self::SMARTFRAME_IDENTIFIER, $link->getAttribute( 'data-image-id' ) );
		}
	}

	/**
	 * Verify that embedding code is reversed into a valid shortcode
	 *
	 * @since 9.3.3
	 */
	public function test_smartframe_reverse_shortcode() {
		$shortcode = wpcom_shortcodereverse_smartframe( self::SMARTFRAME_EMBED );
		$this->assertEquals( self::SMARTFRAME_SHORTCODE, $shortcode );
	}

	/**
	 * Verify that rendering the shortcode returns a SmartFrame image.
	 *
	 * @since 9.3.3
	 */
	public function test_shortcodes_smartframe_image() {
		$image_id          = self::SMARTFRAME_IDENTIFIER;
		$content           = "[smartframe src='$image_id']";
		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $image_id, $shortcode_content );
	}

	/**
	 * Uses a real HTTP request to SmartFrame's oEmbed endpoint to
	 * verify that rendering the shortcode returns a SmartFrame image.
	 *
	 * @group external-http
	 *
	 * @since 9.3.3
	 */
	public function test_shortcodes_smartframe_image_via_oembed_http_request() {
		$image_id = self::SMARTFRAME_IDENTIFIER;
		$content  = "[smartframe src='$image_id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $image_id, $shortcode_content );
	}
}
