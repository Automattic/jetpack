<?php
/**
 * Tests for the Post Like From Email feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/post-like-from-email/post-like-from-email.php';
require_once __DIR__ . '/class-post-like-from-email-redirected.php';

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Tests for wpcom_handle_post_like_from_email()'s wpcom/v2/email-like endpoint call.
 *
 * @covers ::wpcom_handle_post_like_from_email
 */
#[CoversFunction( 'wpcom_handle_post_like_from_email' )]
class Post_Like_From_Email_Test extends \WorDBless\BaseTestCase {

	/**
	 * The handler POSTs the expected body to the site-scoped wpcom/v2/email-like
	 * endpoint and redirects to the post permalink.
	 *
	 * Regression guard for the path and body shape — catches `postid` vs `post_id`
	 * drift and `/email-like` vs `/sites/<id>/email-like` drift against wpcom#211090.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_calls_wpcom_endpoint_and_redirects_on_happy_path(): void {
		define( 'IS_ATOMIC', true );

		require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/post-like-from-email/post-like-from-email.php';
		require_once __DIR__ . '/class-post-like-from-email-redirected.php';

		// Fake enough of a Jetpack connection that Client::wpcom_json_api_request_as_blog
		// can build and dispatch a signed request.
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'blog_token', 'fake.blog.token' );
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Like-from-email test post',
				'post_content' => 'Hello.',
				'post_status'  => 'publish',
			)
		);
		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );

		$_GET = array(
			'like'       => '1',
			'postid'     => (string) $post_id,
			'like_actor' => '212986353',
			'like_hmac'  => 'deadbeef',
		);

		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $response, $args, $url ) use ( &$captured_request ) {
				$captured_request = array(
					'url'  => $url,
					'args' => $args,
				);
				return array(
					'body'     => '{}',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				);
			},
			10,
			3
		);

		// Throw inside the wp_redirect filter so we escape the handler before reaching exit;
		add_filter(
			'wp_redirect',
			function ( $location ) {
				throw new Post_Like_From_Email_Redirected( (string) $location );
			},
			10,
			1
		);

		$redirect_location = null;
		try {
			wpcom_handle_post_like_from_email();
			$this->fail( 'Handler should have called wp_safe_redirect() and thrown.' );
		} catch ( Post_Like_From_Email_Redirected $e ) {
			$redirect_location = $e->getMessage();
		}

		$this->assertNotNull( $captured_request, 'Handler should have dispatched an HTTP request to wpcom.' );
		$this->assertStringContainsString(
			'/wpcom/v2/sites/12345/email-like',
			$captured_request['url'],
			'Endpoint path should be site-scoped.'
		);
		$this->assertSame( 'POST', strtoupper( (string) ( $captured_request['args']['method'] ?? '' ) ) );

		$body = json_decode( (string) ( $captured_request['args']['body'] ?? '' ), true );
		$this->assertIsArray( $body );
		$this->assertSame( $post_id, $body['post_id'], 'Body must use post_id, not postid.' );
		$this->assertSame( '212986353', $body['like_actor'] );
		$this->assertSame( 'deadbeef', $body['like_hmac'] );

		$this->assertSame(
			get_permalink( $post_id ),
			$redirect_location,
			'Handler should redirect to the post permalink.'
		);
	}
}
