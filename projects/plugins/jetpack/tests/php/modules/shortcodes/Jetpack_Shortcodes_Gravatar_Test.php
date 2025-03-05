<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class Jetpack_Shortcodes_Gravatar_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [gravatar] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_gravatar_exists() {
		$this->assertTrue( shortcode_exists( 'gravatar' ) );
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
		$email   = 'user@example.org';
		$size    = 48;
		$content = "[gravatar email='$email' size='$size']";

		$shortcode_content = do_shortcode( $content );
		$avatar_url        = wptexturize( get_avatar_url( $email, array( 'size' => $size ) ) );
		$this->assertStringContainsString( "<img alt='' src='$avatar_url'", $shortcode_content );
		$this->assertStringContainsString( "class='avatar avatar-$size photo' height='$size' width='$size'", $shortcode_content );
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

		$http_request_filter = function () {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'entry' => array(
							array(
								'currentLocation' => 'San Francisco',
								'displayName'     => 'Gravatar',
								'aboutMe'         => 'Gravatar is a free service for providing globally-unique avatars.',
							),
						),
					)
				),
			);
		};

		add_filter( 'pre_http_request', $http_request_filter, 10, 1 );

		$shortcode_content = do_shortcode( $content );
		$avatar_url        = wptexturize( get_avatar_url( $email, array( 'size' => 96 ) ) );
		$this->assertStringContainsString( '<div class="grofile vcard" id="grofile-embed-0">', $shortcode_content );
		$this->assertStringContainsString( "<img src=\"$avatar_url\" width=\"96\" height=\"96\" class=\"no-grav gravatar photo\"", $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10 );
	}

	/**
	 * Verify that rendering the Gravatar profile shortcode returns a profile using user id
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_gravatar_user_id() {
		$email   = 'user@example.org';
		$user    = self::factory()->user->create_and_get( array( 'user_email' => 'user@example.org' ) );
		$content = "[gravatar_profile who='$user->ID']";
		wp_set_current_user( $user->ID );

		$http_request_filter = function () {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'entry' => array( array( 'displayName' => 'Gravatar' ) ),
					)
				),
			);
		};

		add_filter( 'pre_http_request', $http_request_filter, 10, 1 );

		$shortcode_content = do_shortcode( $content );
		$avatar_url        = wptexturize( get_avatar_url( $email, array( 'size' => 96 ) ) );
		$this->assertStringContainsString( "<img src=\"$avatar_url\" width=\"96\" height=\"96\" class=\"no-grav gravatar photo\"", $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10 );
	}

	/**
	 * Verify that rendering the Gravatar profile shortcode returns a profile using user id
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_gravatar_no_profile() {
		$user    = self::factory()->user->create_and_get( array( 'user_email' => 'user@example.org' ) );
		$content = "[gravatar_profile who='$user->ID']";
		wp_set_current_user( $user->ID );

		$http_request_filter = function () {
			return array(
				'response' => array( 'code' => 404 ),
			);
		};

		add_filter( 'pre_http_request', $http_request_filter, 10, 1 );

		$shortcode_content = do_shortcode( $content );
		$this->assertSame( '', $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10 );
	}
}
