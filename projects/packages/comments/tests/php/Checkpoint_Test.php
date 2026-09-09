<?php
/**
 * Tests for the checkpoint.
 *
 * @package automattic/jetpack-comments
 */

use Automattic\Jetpack\Comments\Checkpoint;
use Automattic\Jetpack\Comments\Checkpoint_Endpoint;
use Automattic\Jetpack\Comments\Passport;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Tests for the checkpoint.
 *
 * @covers \Automattic\Jetpack\Comments\Checkpoint
 */
#[CoversClass( Checkpoint::class )]
class Checkpoint_Test extends BaseTestCase {

	const SECRET = 'blogtoken.secret';

	/**
	 * The last request handed to the HTTP layer.
	 *
	 * @var array|null
	 */
	private $request = null;

	/**
	 * What the mocked exchange answers.
	 *
	 * @var array|WP_Error
	 */
	private $response;

	/**
	 * Comment meta written, keyed by comment ID then key. WorDBless has no comments table.
	 *
	 * @var array
	 */
	private $meta = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_comments_new_hotness', '__return_true' );
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', self::SECRET );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$this->response = $this->exchange_response( 200, $this->identity_body() );
		add_filter( 'pre_http_request', array( $this, 'capture_request' ), 10, 3 );
		add_filter( 'add_comment_metadata', array( $this, 'capture_meta' ), 10, 4 );

		Checkpoint::init()->reset();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'capture_request' ) );
		remove_filter( 'add_comment_metadata', array( $this, 'capture_meta' ) );
		remove_filter( 'pre_option_comment_registration', '__return_zero' );
		remove_filter( 'pre_option_require_name_email', '__return_zero' );
		unset( $_POST[ Checkpoint::CODE_FIELD ], $_POST[ Checkpoint::PASSPORT_FIELD ], $_COOKIE[ Passport::COOKIE ] );
		Checkpoint::init()->reset();
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'id' );
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Capture a comment meta write instead of storing it.
	 *
	 * @param mixed  $check      Short-circuit value.
	 * @param int    $comment_id Comment ID.
	 * @param string $key        Meta key.
	 * @param mixed  $value      Meta value.
	 * @return bool
	 */
	public function capture_meta( $check, $comment_id, $key, $value ) {
		$this->meta[ $comment_id ][ $key ] = $value;

		return true;
	}

	/**
	 * Capture the exchange request and answer for WordPress.com.
	 *
	 * @param mixed  $preempt Short-circuit value.
	 * @param array  $args    Request arguments.
	 * @param string $url     Request URL.
	 * @return array|WP_Error
	 */
	public function capture_request( $preempt, $args, $url ) {
		$this->request = array_merge( $args, array( 'url' => $url ) );

		return $this->response;
	}

	/**
	 * Build a mocked HTTP response.
	 *
	 * @param int   $status  HTTP status.
	 * @param array $body    JSON body.
	 * @param array $headers Response headers.
	 * @return array
	 */
	private function exchange_response( $status, array $body, array $headers = array() ) {
		return array(
			'response' => array(
				'code'    => $status,
				'message' => '',
			),
			'headers'  => $headers,
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	/**
	 * What a successful exchange answers.
	 *
	 * @return array
	 */
	private function identity_body() {
		return array(
			'site_commenter_id' => str_repeat( 'a', 64 ),
			'provider'          => 'google',
			'name'              => 'Ada Lovelace',
			'email'             => 'ada@example.com',
			'avatar'            => 'https://lh3.googleusercontent.com/a/photo',
			'expires_at'        => time() + DAY_IN_SECONDS,
		);
	}

	/**
	 * Post a comment as the admitted identity, through the same filters core runs.
	 *
	 * @return array The comment data after attribution.
	 */
	private function admit_and_attribute() {
		$checkpoint = Checkpoint::init();
		$checkpoint->admit(
			wp_insert_post(
				array(
					'post_title'  => 'Post',
					'post_status' => 'publish',
				)
			)
		);

		return $checkpoint->attribute(
			array(
				'comment_author'       => 'Guest',
				'comment_author_email' => 'guest@example.com',
				'comment_author_url'   => 'https://spam.example',
				'user_id'              => 0,
			)
		);
	}

	/**
	 * The popup URL carries the five signed params and an HMAC over them, keyed with the blog token.
	 */
	public function test_connect_url_is_signed_with_the_blog_token() {
		$challenge = Checkpoint::challenge();
		$connect   = Checkpoint::connect_url( 'wordpress', $challenge ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- the provider slug.

		$this->assertStringStartsWith( Checkpoint::CONNECT_URL . '?', $connect['url'] );
		parse_str( (string) wp_parse_url( $connect['url'], PHP_URL_QUERY ), $query );

		$this->assertSame( '1', $query['comment_identity'] );
		$this->assertSame( '12345', $query['blog_id'] );
		$this->assertSame( $challenge, $query['challenge'] );
		$this->assertSame( Checkpoint::origin(), $query['origin'] );
		// wpcom refuses anything past now + 600, so leave room for its clock to lag ours.
		$this->assertLessThanOrEqual( time() + 540, (int) $query['expires'] );

		// Sorted key=value lines, newline separated: the format Consulate::signing_payload() verifies.
		$payload = "blog_id=12345\nchallenge={$challenge}\nexpires={$query['expires']}\norigin=" . Checkpoint::origin() . "\nprovider=wordpress"; // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- the provider slug.
		$this->assertSame( hash_hmac( 'sha256', $payload, self::SECRET ), $query['signature'] );
	}

	/**
	 * Unknown providers and malformed challenges are not signed.
	 */
	public function test_connect_url_rejects_unknown_provider_and_bad_challenge() {
		$this->assertInstanceOf( WP_Error::class, Checkpoint::connect_url( 'twitter', Checkpoint::challenge() ) );
		$this->assertInstanceOf( WP_Error::class, Checkpoint::connect_url( 'google', 'short' ) );
	}

	/**
	 * Without a blog token there is nothing to sign with, so nothing is offered.
	 */
	public function test_not_available_without_a_blog_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		Checkpoint::init()->reset();

		$this->assertFalse( Checkpoint::is_available() );
		$this->assertInstanceOf( WP_Error::class, Checkpoint::connect_url( 'google', Checkpoint::challenge() ) );
	}

	/**
	 * The exchange is a blog-authenticated POST of the code, and its answer is what the comment gets.
	 */
	public function test_exchange_posts_the_code_as_the_blog() {
		$identity = Checkpoint::exchange( str_repeat( 'c', 64 ) );

		$this->assertSame( 'POST', $this->request['method'] );
		$this->assertStringContainsString( '/wpcom/v2/sites/12345/comments/identity/exchange', $this->request['url'] );
		$this->assertSame( array( 'code' => str_repeat( 'c', 64 ) ), json_decode( $this->request['body'], true ) );
		$this->assertSame( 'Ada Lovelace', $identity['name'] );
		$this->assertSame( 'ada@example.com', $identity['email'] );
	}

	/**
	 * Known error slugs come through with their status and Retry-After; anything else is a server error.
	 */
	public function test_exchange_maps_known_errors_and_retry_after() {
		$this->response = $this->exchange_response( 429, array( 'code' => 'rate_limited' ), array( 'retry-after' => '60' ) );

		$error = Checkpoint::exchange( str_repeat( 'c', 64 ) );

		$this->assertSame( 'rate_limited', $error->get_error_code() );
		$this->assertSame( 429, $error->get_error_data()['status'] );
		$this->assertSame( 60, $error->get_error_data()['retry_after'] );

		$this->response = new WP_Error( 'http_request_failed', 'down' );
		$this->assertSame( 'server_error', Checkpoint::exchange( str_repeat( 'c', 64 ) )->get_error_code() );
	}

	/**
	 * A posted code is redeemed, attributed, recorded, and lifts the registration and name requirements.
	 */
	public function test_a_posted_code_is_redeemed_and_attributed() {
		$_POST[ Checkpoint::CODE_FIELD ] = str_repeat( 'c', 64 );

		$commentdata = $this->admit_and_attribute();

		$this->assertSame( 'Ada Lovelace', $commentdata['comment_author'] );
		$this->assertSame( 'ada@example.com', $commentdata['comment_author_email'] );
		$this->assertSame( '', $commentdata['comment_author_url'] );
		$this->assertSame( 0, get_option( 'require_name_email' ) );
		$this->assertSame( 0, get_option( 'comment_registration' ) );

		Checkpoint::init()->record( 77 );
		$this->assertSame(
			array(
				Checkpoint::META_ID       => str_repeat( 'a', 64 ),
				Checkpoint::META_PROVIDER => 'google',
				Checkpoint::META_AVATAR   => 'https://lh3.googleusercontent.com/a/photo',
			),
			$this->meta[77]
		);
	}

	/**
	 * A passport the form posted as is admitted with no exchange.
	 */
	public function test_a_valid_passport_admits_without_an_exchange() {
		$_COOKIE[ Passport::COOKIE ]         = Passport::encode( $this->identity_body() );
		$_POST[ Checkpoint::PASSPORT_FIELD ] = '1';

		$this->assertSame( 'Ada Lovelace', $this->admit_and_attribute()['comment_author'] );
		$this->assertNull( $this->request );
	}

	/**
	 * A passport the form did not post as is left alone, and so is the comment.
	 */
	public function test_a_passport_without_the_marker_is_not_used() {
		$_COOKIE[ Passport::COOKIE ] = Passport::encode( $this->identity_body() );

		$this->assertSame( 'Guest', $this->admit_and_attribute()['comment_author'] );
		$this->assertFalse( has_filter( 'pre_option_require_name_email', '__return_zero' ) );

		Checkpoint::init()->record( 77 );
		$this->assertSame( array(), $this->meta );
	}

	/**
	 * A reader logged in to the site itself is never re-attributed from a passport.
	 */
	public function test_a_site_login_wins_over_a_passport() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'ada',
					'user_pass'  => 'pass',
					'user_email' => 'ada@site.example',
				)
			)
		);
		$_COOKIE[ Passport::COOKIE ]         = Passport::encode( $this->identity_body() );
		$_POST[ Checkpoint::PASSPORT_FIELD ] = '1';

		$this->assertSame( 'Guest', $this->admit_and_attribute()['comment_author'] );

		wp_set_current_user( 0 );
	}

	/**
	 * The connect route answers a signed URL, uncached.
	 */
	public function test_connect_route_answers_a_signed_url() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/' . Checkpoint_Endpoint::CONNECT_ROUTE );
		$request->set_param( 'provider', 'google' );
		$request->set_param( 'challenge', Checkpoint::challenge() );

		$response = ( new Checkpoint_Endpoint() )->connect( $request );

		$this->assertSame( 'no-store', $response->get_headers()['Cache-Control'] );
		$this->assertStringStartsWith( Checkpoint::CONNECT_URL, $response->get_data()['url'] );
	}
}
