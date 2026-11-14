<?php
/**
 * IndexNow ownership and bounded notifications.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Supplies verification without requiring a physical file.
 */
class Indexnow_Client {
	const KEY_OPTION     = 'jetpack_seo_indexnow_key';
	const ENABLED_OPTION = 'jetpack_seo_indexnow_enabled';
	const SCOPE_OPTION   = 'jetpack_seo_indexnow_enabled_scope';
	const ENDPOINT       = 'https://api.indexnow.org/indexnow';
	const BATCH_SIZE     = 100;

	/** Register the ownership handler without enabling notifications. */
	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'maybe_serve_key' ), 0 );
	}

	/**
	 * The persisted public verification key.
	 *
	 * @return string
	 */
	public static function key() {
		$key = get_option( self::KEY_OPTION, '' );
		if ( ! is_string( $key ) || ! preg_match( '/^[a-f0-9]{32}$/', $key ) ) {
			add_option( self::KEY_OPTION, str_replace( '-', '', wp_generate_uuid4() ), '', false );
			$key = get_option( self::KEY_OPTION, '' );
			if ( ! is_string( $key ) || ! preg_match( '/^[a-f0-9]{32}$/', $key ) ) {
				$key = str_replace( '-', '', wp_generate_uuid4() );
				update_option( self::KEY_OPTION, $key, false );
			}
		}
		return $key;
	}

	/**
	 * Whether notifications are enabled on a public site.
	 *
	 * @return bool
	 */
	public static function enabled() {
		/**
		 * Filters whether Jetpack may deliver IndexNow notifications on this host.
		 *
		 * @since $$next-version$$
		 * @param bool $allowed Whether another host/provider permits Jetpack delivery.
		 */
		$allowed = (bool) apply_filters( 'jetpack_seo_indexnow_can_notify', true );
		return (bool) get_option( self::ENABLED_OPTION, false )
			&& $allowed
			&& get_option( self::SCOPE_OPTION, '' ) === home_url( '/' )
			&& Initializer::is_available() && ( new Modules() )->is_active( 'seo-tools' )
			&& self::site_is_public()
			&& ! Seo_Tools::is_disabled();
	}

	/**
	 * Whether anonymous discovery is permitted on this host.
	 *
	 * @return bool
	 */
	public static function site_is_public() {
		return 1 === (int) get_option( 'blog_public', 1 )
			&& 'production' === wp_get_environment_type() && ! ( new Status() )->in_safe_mode()
			&& ( ! ( new Host() )->is_wpcom_platform() || ! ( new Status() )->is_coming_soon() );
	}

	/**
	 * Verification location within this site's URL scope.
	 *
	 * @return string
	 */
	public static function key_location() {
		return home_url( '/' . self::key() . '.txt' );
	}

	/**
	 * Restrict notifications to this site's host, scheme and home path.
	 *
	 * @param string $url Candidate URL.
	 * @return bool
	 */
	public static function in_scope( $url ) {
		if ( ! is_string( $url ) || strlen( $url ) > 2048 || preg_match( '/[\x00-\x20\x7f]/', $url ) ) {
			return false;
		}
		$home   = wp_parse_url( home_url( '/' ) );
		$target = wp_parse_url( $url );
		if ( ! is_array( $target ) || isset( $target['user'] ) || isset( $target['pass'] ) || isset( $target['fragment'] ) ) {
			return false;
		}
		if ( ! in_array( $target['scheme'] ?? '', array( 'http', 'https' ), true ) || ( $target['scheme'] ?? '' ) !== ( $home['scheme'] ?? '' ) || strtolower( $target['host'] ?? '' ) !== strtolower( $home['host'] ?? '' ) || ( $target['port'] ?? null ) !== ( $home['port'] ?? null ) ) {
			return false;
		}
		$path = rawurldecode( $target['path'] ?? '/' );
		if ( false !== strpos( $path, '\\' ) || preg_match( '~(?:^|/)\.{1,2}(?:/|$)~', $path ) || preg_match( '/%(?:2e|2f|5c)/i', $path ) ) {
			return false;
		}
		return 0 === strpos( $path, trailingslashit( $home['path'] ?? '/' ) );
	}

	/** Serve the public key only while the feature can operate. */
	public static function maybe_serve_key() {
		$method = sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) );
		if ( ! in_array( $method, array( 'GET', 'HEAD' ), true ) ) {
			return;
		}
		if ( ! self::enabled() || ! preg_match( '/^[a-f0-9]{32}$/', self::key() ) ) {
			return;
		}
		$path = wp_parse_url( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ) ), PHP_URL_PATH );
		if ( wp_parse_url( self::key_location(), PHP_URL_PATH ) !== $path ) {
			return;
		}
		nocache_headers();
		header( 'Content-Type: text/plain; charset=utf-8' );
		status_header( 200 );
		if ( 'HEAD' !== $method ) {
			echo esc_html( self::key() );
		}
		exit;
	}

	/**
	 * Send an already eligible batch to one participating endpoint.
	 *
	 * @param string[] $urls Public URLs.
	 * @return array
	 */
	public static function submit( $urls ) {
		if ( ! self::enabled() || ! is_array( $urls ) || ! $urls || count( $urls ) > self::BATCH_SIZE ) {
			return array(
				'state' => 'disabled_or_invalid',
				'retry' => false,
			);
		}
		if ( ! preg_match( '/^[a-f0-9]{32}$/', self::key() ) ) {
			return array(
				'state' => 'invalid_key',
				'retry' => false,
			);
		}
		foreach ( $urls as $url ) {
			if ( ! self::in_scope( $url ) ) {
				return array(
					'state' => 'invalid_scope',
					'retry' => false,
				);
			}
		}
		$response = wp_safe_remote_post(
			self::ENDPOINT,
			array(
				'timeout'     => 5,
				'redirection' => 0,
				'headers'     => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				'body'        => wp_json_encode(
					array(
						'host'        => wp_parse_url( home_url(), PHP_URL_HOST ),
						'key'         => self::key(),
						'keyLocation' => self::key_location(),
						'urlList'     => array_values( array_unique( $urls ) ),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);
		if ( is_wp_error( $response ) ) {
			return array(
				'state' => 'transport_failure',
				'retry' => true,
			);
		}
		$code        = wp_remote_retrieve_response_code( $response );
		$retry       = 202 === $code || 429 === $code || $code >= 500;
		$retry_after = (string) wp_remote_retrieve_header( $response, 'retry-after' );
		$retry_after = ctype_digit( $retry_after ) ? (int) $retry_after : max( 0, (int) strtotime( $retry_after ) - time() );
		return array(
			'state'       => 200 === $code ? 'accepted' : ( 202 === $code ? 'verification_pending' : 'http_' . $code ),
			'retry'       => $retry,
			'code'        => $code,
			'retry_after' => min( WEEK_IN_SECONDS, $retry_after ),
		);
	}
}
