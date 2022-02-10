<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_MailChimp extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [mailchimp] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_mailchimp_exists() {
		$this->assertEquals( shortcode_exists( 'mailchimp_subscriber_popup' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_mailchimp() {
		$content = '[mailchimp_subscriber_popup]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Missing MailChimp baseUrl, uuid or lid -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a MailChimp image.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_mailchimp_form() {
		$uuid    = '1ca7856462585a934b8674c71';
		$lid     = '2d24f1898b';
		$content = "[mailchimp_subscriber_popup baseUrl=mc.us11.list-manage.com uuid=$uuid lid=$lid]";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<script type="text/javascript" data-dojo-config="usePlainJson: true, isDebug: false">jQuery.getScript( "//downloads.mailchimp.com/js/signup-forms/popup/unique-methods/embed.js", function( data, textStatus, jqxhr ) { window.dojoRequire(["mojo/signup-forms/Loader"], function(L) { L.start({"baseUrl":"mc.us11.list-manage.com","uuid":"' . $uuid . '","lid":"' . $lid . '","uniqueMethods":true}) });} );</script>', $shortcode_content );
	}
}
