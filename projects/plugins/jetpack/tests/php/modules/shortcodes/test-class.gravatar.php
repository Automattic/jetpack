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
		$this->assertStringContainsString( '<div class="grofile vcard" id="grofile-embed-0">', $shortcode_content );
		$this->assertStringContainsString( '<img src="http://2.gravatar.com/avatar/572c3489ea700045927076136a969e27?s=96&#038;d=mm&#038;r=g" width="96" height="96" class="no-grav gravatar photo"', $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10, 1 );
	}

	/**
	 * Verify that rendering the Gravatar profile shortcode returns a profile using user id
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_gravatar_user_id() {
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
		$this->assertStringContainsString( '<img src="http://2.gravatar.com/avatar/572c3489ea700045927076136a969e27?s=96&#038;d=mm&#038;r=g" width="96" height="96" class="no-grav gravatar photo"', $shortcode_content );

		remove_filter( 'pre_http_request', $http_request_filter, 10, 1 );
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

		remove_filter( 'pre_http_request', $http_request_filter, 10, 1 );
	}
}
