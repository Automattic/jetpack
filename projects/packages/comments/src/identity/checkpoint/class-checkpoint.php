<?php
/**
 * The checkpoint: where a commenter signed in through WordPress.com is admitted.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Tokens;
use WP_Error;

/**
 * Signs the popup URL, redeems the code it hands back, and attributes the comment.
 *
 * The WordPress.com half is the Consulate in wpcom's lib/comment-identity.
 */
class Checkpoint {

	/**
	 * The popup, which mints a one-time code.
	 */
	const CONNECT_URL = 'https://public-api.wordpress.com/connect/';

	/**
	 * The only origin a result is accepted from.
	 */
	const MESSAGE_ORIGIN = 'https://public-api.wordpress.com';

	/**
	 * Providers the popup can sign in with, in display order.
	 */
	const PROVIDERS = array( 'wordpress', 'google', 'facebook' );

	/**
	 * POST field carrying the code the popup handed back.
	 */
	const CODE_FIELD = 'jetpack_comment_identity_code';

	/**
	 * POST field the form sends when it rendered as signed in on the passport.
	 * Without it the passport is left alone, so a reader whose log-out never
	 * reached the server still posts as the guest the form showed them as.
	 */
	const PASSPORT_FIELD = 'jetpack_comment_identity_passport';

	/**
	 * How long a signed popup URL stays good. WordPress.com rejects an expiry
	 * past ten minutes out, so a minute is left for clock skew.
	 */
	const SIGNATURE_TTL = 9 * MINUTE_IN_SECONDS;

	/**
	 * Comment meta: the opaque per-site id WordPress.com derives for the commenter.
	 */
	const META_ID = 'jetpack_comment_identity_id';

	/**
	 * Comment meta: which provider they signed in with.
	 */
	const META_PROVIDER = 'jetpack_comment_identity_provider';

	/**
	 * Comment meta: the avatar the provider gave.
	 */
	const META_AVATAR = 'jetpack_comment_identity_avatar';

	/**
	 * Singleton instance.
	 *
	 * @var Checkpoint|null
	 */
	private static $instance = null;

	/**
	 * Whether a signing key exists, memoized per request.
	 *
	 * @var bool|null
	 */
	private static $available = null;

	/**
	 * The identity admitted for the comment being posted now.
	 *
	 * @var array|null
	 */
	private $identity = null;

	/**
	 * Register the hooks. Safe to call more than once.
	 *
	 * @return Checkpoint
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Hook in around core's comment handling.
	 */
	private function __construct() {
		// After Comment_Form::verify_nonce() at 10, so an unsigned post never reaches the exchange.
		add_action( 'pre_comment_on_post', array( $this, 'admit' ), 20 );
		add_filter( 'preprocess_comment', array( $this, 'attribute' ), 0 );
		add_action( 'comment_post', array( $this, 'record' ) );

		Checkpoint_Endpoint::init();
	}

	/**
	 * Whether this site can sign a popup URL.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( null !== self::$available ) {
			return self::$available;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::$available = file_exists( WP_CONTENT_DIR . '/lib/comment-identity/class-consulate.php' );
		} else {
			$token           = ( new Tokens() )->get_access_token();
			self::$available = $token && ! is_wp_error( $token ) && ! empty( $token->secret );
		}

		return self::$available;
	}

	/**
	 * A fresh challenge: 32 random bytes, base64url.
	 *
	 * @return string
	 */
	public static function challenge() {
		return rtrim( strtr( base64_encode( random_bytes( 32 ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- base64url is the wire format.
	}

	/**
	 * Whether a challenge has the shape the popup echoes back.
	 *
	 * @param mixed $challenge The value to check.
	 * @return bool
	 */
	public static function is_challenge( $challenge ) {
		return is_string( $challenge ) && 1 === preg_match( '/^[A-Za-z0-9_-]{32,512}\z/', $challenge );
	}

	/**
	 * A signed popup URL for every provider, sharing one challenge.
	 *
	 * @param string $challenge The challenge to sign.
	 * @return array Keyed by provider: url, expires, challenge.
	 */
	public static function connect_urls( $challenge ) {
		$urls = array();

		foreach ( self::PROVIDERS as $provider ) {
			$connect = self::connect_url( $provider, $challenge );

			if ( ! is_wp_error( $connect ) ) {
				$urls[ $provider ] = $connect;
			}
		}

		return $urls;
	}

	/**
	 * A signed popup URL for one provider.
	 *
	 * @param string $provider  One of PROVIDERS.
	 * @param string $challenge The challenge to sign.
	 * @return array|WP_Error url, expires, challenge.
	 */
	public static function connect_url( $provider, $challenge ) {
		if ( ! in_array( $provider, self::PROVIDERS, true ) || ! self::is_challenge( $challenge ) ) {
			return new WP_Error( 'invalid_request', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$params = array(
			'blog_id'   => self::blog_id(),
			'provider'  => $provider,
			'challenge' => $challenge,
			'origin'    => self::origin(),
			'expires'   => time() + self::SIGNATURE_TTL,
		);

		$signature = self::sign( $params );

		if ( is_wp_error( $signature ) ) {
			return $signature;
		}

		$query = array_merge( array( 'comment_identity' => 1 ), $params, array( 'signature' => $signature ) );

		return array(
			'url'       => self::CONNECT_URL . '?' . http_build_query( $query, '', '&', PHP_QUERY_RFC3986 ),
			'expires'   => $params['expires'],
			'challenge' => $challenge,
		);
	}

	/**
	 * The string a signature is taken over: key=value lines, sorted by key.
	 *
	 * Must match Consulate::signing_payload() on WordPress.com.
	 *
	 * @param array $params blog_id, challenge, expires, origin, provider.
	 * @return string
	 */
	public static function signing_payload( array $params ) {
		$signed = array(
			'blog_id'   => (string) (int) ( $params['blog_id'] ?? 0 ),
			'challenge' => (string) ( $params['challenge'] ?? '' ),
			'expires'   => (string) (int) ( $params['expires'] ?? 0 ),
			'origin'    => (string) ( $params['origin'] ?? '' ),
			'provider'  => (string) ( $params['provider'] ?? '' ),
		);

		ksort( $signed );

		$lines = array();
		foreach ( $signed as $key => $value ) {
			$lines[] = $key . '=' . $value;
		}

		return implode( "\n", $lines );
	}

	/**
	 * Sign the popup parameters.
	 *
	 * A Jetpack or Atomic site proves itself with its blog token. On Simple the
	 * code is already running inside WordPress.com, so the Consulate signs with
	 * the key it will verify against.
	 *
	 * @param array $params blog_id, challenge, expires, origin, provider.
	 * @return string|WP_Error HMAC-SHA256 hex.
	 */
	private static function sign( array $params ) {
		if ( ! self::is_available() ) {
			return new WP_Error( 'unavailable', __( 'Sign-in is not available on this site.', 'jetpack-comments' ), array( 'status' => 503 ) );
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			require_once WP_CONTENT_DIR . '/lib/comment-identity/class-consulate.php';

			// @phan-suppress-next-line PhanUndeclaredClassMethod -- wpcom-only; add to stub-defs.php when the wpcom half lands.
			return \Automattic\Comment_Identity\Consulate::sign( $params );
		}

		return hash_hmac( 'sha256', self::signing_payload( $params ), ( new Tokens() )->get_access_token()->secret );
	}

	/**
	 * The site's id on WordPress.com.
	 *
	 * @return int
	 */
	public static function blog_id() {
		return (int) Manager::get_site_id( true );
	}

	/**
	 * Scheme, host and port of the page the popup posts back to.
	 *
	 * @return string
	 */
	public static function origin() {
		$parts = wp_parse_url( home_url() );

		$origin = ( $parts['scheme'] ?? 'https' ) . '://' . ( $parts['host'] ?? '' );

		if ( ! empty( $parts['port'] ) ) {
			$origin .= ':' . $parts['port'];
		}

		return $origin;
	}

	/**
	 * Redeem a code with WordPress.com.
	 *
	 * @param string $code The code the popup handed back.
	 * @return array|WP_Error site_commenter_id, provider, name, email, avatar, expires_at.
	 */
	public static function exchange( $code ) {
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/comments/identity/exchange', self::blog_id() ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				'timeout' => 10,
			),
			(string) wp_json_encode( array( 'code' => (string) $code ), JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		$known = array( 'invalid_code', 'blog_mismatch', 'code_used', 'code_expired', 'rate_limited', 'server_error' );

		if ( is_wp_error( $response ) ) {
			$data = (array) $response->get_error_data();
			$code = in_array( $response->get_error_code(), $known, true ) ? $response->get_error_code() : 'server_error';

			return new WP_Error( $code, $response->get_error_message(), array( 'status' => (int) ( $data['status'] ?? 500 ) ) );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 === $status && is_array( $body ) && ! empty( $body['site_commenter_id'] ) && ! empty( $body['provider'] ) ) {
			return array(
				'site_commenter_id' => sanitize_text_field( (string) $body['site_commenter_id'] ),
				'provider'          => sanitize_key( (string) $body['provider'] ),
				'name'              => sanitize_text_field( (string) ( $body['name'] ?? '' ) ),
				'email'             => sanitize_email( (string) ( $body['email'] ?? '' ) ),
				'avatar'            => esc_url_raw( (string) ( $body['avatar'] ?? '' ) ),
				'expires_at'        => (int) ( $body['expires_at'] ?? 0 ),
			);
		}

		$error = is_array( $body ) && isset( $body['code'] ) && in_array( $body['code'], $known, true ) ? $body['code'] : 'server_error';

		return new WP_Error(
			$error,
			is_array( $body ) && ! empty( $body['message'] ) ? (string) $body['message'] : '',
			array(
				'status'      => $status ? $status : 500,
				'retry_after' => (int) wp_remote_retrieve_header( $response, 'retry-after' ),
			)
		);
	}

	/**
	 * Admit the commenter, from the code they posted or the passport they carry.
	 *
	 * @param int $comment_post_id The post being commented on.
	 * @return void
	 */
	public function admit( $comment_post_id = 0 ) {
		if ( ! Comment_Form::enabled_for_post_type( $comment_post_id ) || is_user_logged_in() ) {
			return;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Comment_Form::verify_nonce() ran at priority 10.
		$code        = isset( $_POST[ self::CODE_FIELD ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::CODE_FIELD ] ) ) : '';
		$on_passport = ! empty( $_POST[ self::PASSPORT_FIELD ] );
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( '' !== $code ) {
			$identity = self::exchange( $code );

			if ( is_wp_error( $identity ) ) {
				self::refuse( $identity );
			}

			Passport::issue( $identity );
		} elseif ( $on_passport ) {
			$identity = Passport::read();

			if ( null === $identity ) {
				return;
			}
		} else {
			return;
		}

		$this->identity = $identity;

		// A signed-in commenter counts as registered, and has given a name and email.
		add_filter( 'pre_option_comment_registration', '__return_zero' );
		add_filter( 'pre_option_require_name_email', '__return_zero' );
	}

	/**
	 * Turn the comment away. Does not return.
	 *
	 * @param WP_Error $error From exchange().
	 * @return void
	 */
	private static function refuse( WP_Error $error ) {
		$data   = (array) $error->get_error_data();
		$status = (int) ( $data['status'] ?? 500 );

		switch ( $error->get_error_code() ) {
			case 'code_expired':
			case 'code_used':
				// The sign-in is spent; nothing here can be reused.
				Passport::revoke();
				$message = __( 'Your sign-in has expired. Go back and sign in again to leave your comment.', 'jetpack-comments' );
				$status  = 403;
				break;

			case 'rate_limited':
				$message = __( 'Too many sign-in attempts right now. Go back and try again in a moment.', 'jetpack-comments' );
				if ( ! empty( $data['retry_after'] ) ) {
					header( 'Retry-After: ' . (int) $data['retry_after'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- an integer header value.
				}
				break;

			case 'invalid_code':
			case 'blog_mismatch':
				$message = __( 'Your sign-in could not be verified. Go back and sign in again to leave your comment.', 'jetpack-comments' );
				break;

			default:
				$message = __( 'Sign-in is unavailable right now. Go back and try again in a moment.', 'jetpack-comments' );
				break;
		}

		wp_die(
			esc_html( $message ),
			esc_html__( 'Comment Submission Failure', 'jetpack-comments' ),
			array(
				'response'  => absint( $status ),
				'back_link' => true,
			)
		);
	}

	/**
	 * Attribute the comment to the admitted identity.
	 *
	 * @param array $commentdata Comment data.
	 * @return array
	 */
	public function attribute( $commentdata ) {
		if ( null === $this->identity ) {
			return $commentdata;
		}

		$commentdata['comment_author']       = $this->identity['name'];
		$commentdata['comment_author_email'] = $this->identity['email'];
		$commentdata['comment_author_url']   = '';
		$commentdata['user_id']              = 0;
		$commentdata['user_ID']              = 0;

		return $commentdata;
	}

	/**
	 * Record who left the comment, for the avatar and for moderation.
	 *
	 * Reads the identity admitted on this request rather than $_POST, so any
	 * other producer reaching comment_post writes nothing here.
	 *
	 * @param int $comment_id The comment ID.
	 * @return void
	 */
	public function record( $comment_id ) {
		if ( null === $this->identity ) {
			return;
		}

		add_comment_meta( $comment_id, self::META_ID, $this->identity['site_commenter_id'], true );
		add_comment_meta( $comment_id, self::META_PROVIDER, $this->identity['provider'], true );

		if ( '' !== $this->identity['avatar'] ) {
			add_comment_meta( $comment_id, self::META_AVATAR, $this->identity['avatar'], true );
		}
	}

	/**
	 * Forget the admitted identity, for tests.
	 *
	 * @return void
	 */
	public function reset() {
		$this->identity  = null;
		self::$available = null;
	}
}
