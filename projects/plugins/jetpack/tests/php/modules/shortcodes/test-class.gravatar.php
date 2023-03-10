<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Gravatar extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [gravatar] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_gravatar_exists() {
		$this->assertEquals( shortcode_exists( 'gravatar' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_gravatar() {
		$content = '[gravatar]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertSame( '', $shortcode_content );
	}

	/**
	 * Verify that rendering the Gravatar shortcode returns an avatar image.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_gravatar_image() {
		$content = "[gravatar email='user@example.org' size='48']";

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( "<img alt='' src='http://2.gravatar.com/avatar/572c3489ea700045927076136a969e27?s=48&#038;d=mm&#038;r=g'", $shortcode_content );
		$this->assertStringContainsString( "class='avatar avatar-48 photo' height='48' width='48'", $shortcode_content );
	}

	/**
	 * Verify that rendering the Gravatar profile shortcode returns a profile.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_gravatar_profile() {
		$email   = 'user@example.org';
		$content = "[gravatar_profile who='$email']";
		$user    = self::factory()->user->create_and_get(
			array(
				'user_email' => $email,
			)
		);
		wp_set_current_user( $user->ID );

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div class="grofile vcard" id="grofile-embed-0">', $shortcode_content );
		$this->assertStringContainsString( '<img src="http://2.gravatar.com/avatar/572c3489ea700045927076136a969e27?s=96&#038;d=mm&#038;r=g" width="96" height="96" class="no-grav gravatar photo"', $shortcode_content );
	}
}
