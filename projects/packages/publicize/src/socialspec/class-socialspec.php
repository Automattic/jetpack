<?php
/**
 * Routes and serves the SocialSpec documents.
 *
 * @link https://socialspec.org/
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status;

/**
 * Serves the SocialSpec documents at /.well-known/.
 */
class Socialspec {

	const FEATURE_FLAG = 'social-socialspec';

	/**
	 * Registers the feature flag and the request handler.
	 */
	public static function init() {
		Feature_Flags::register(
			self::FEATURE_FLAG,
			array(
				'default'     => false,
				'description' => 'Publish the SocialSpec contact card and following list at /.well-known/.',
				'owner'       => 'jetpack-social',
			)
		);

		add_action( 'parse_request', array( __CLASS__, 'parse_request' ) );
	}

	/**
	 * Whether the documents are served.
	 *
	 * The standalone SocialSpec plugin serves the same paths, so it takes over when active.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Feature_Flags::is_enabled( self::FEATURE_FLAG ) && ! defined( 'SOCIALSPEC_VERSION' );
	}

	/**
	 * The documents, keyed by their file name in /.well-known/.
	 *
	 * @return Document[]
	 */
	public static function get_documents() {
		return array(
			'contact.vcf'    => new Contact(),
			'following.opml' => new Following(),
		);
	}

	/**
	 * The requested file name in /.well-known/, from the request path.
	 *
	 * Not a rewrite rule: WordPress.com Simple sites have none, and a package has no activation to flush them on.
	 *
	 * @return string|null Null if /.well-known/ is not requested.
	 */
	public static function get_requested_name() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Only compared.
		$path   = (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ), PHP_URL_PATH );
		$prefix = trailingslashit( (string) wp_parse_url( home_url(), PHP_URL_PATH ) ) . '.well-known/';

		return 0 === strpos( $path, $prefix ) ? substr( $path, strlen( $prefix ) ) : null;
	}

	/**
	 * Serves the requested document before the main query runs.
	 */
	public static function parse_request() {
		$name     = self::get_requested_name();
		$document = null !== $name && self::is_enabled() ? ( self::get_documents()[ $name ] ?? null ) : null;

		if ( ! $document ) {
			return;
		}

		// This runs before the template gates of private and unlaunched sites.
		$status = new Status();
		if ( $status->is_private_site() || $status->is_coming_soon() ) {
			return;
		}

		header( 'Access-Control-Allow-Origin: *' );

		$method = strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) );

		if ( 'OPTIONS' === $method ) {
			status_header( 204 );
			header( 'Access-Control-Allow-Methods: GET, HEAD, OPTIONS' );
			header( 'Access-Control-Max-Age: 86400' );
			exit( 0 );
		}

		if ( 'GET' !== $method && 'HEAD' !== $method ) {
			header( 'Allow: GET, HEAD, OPTIONS' );
			self::send_error( 405, 'Method Not Allowed' );
		}

		$content = $document->get_content();

		if ( null === $content ) {
			self::send_error( 404, 'Not Found' );
		}

		status_header( 200 );
		header( 'Content-Type: ' . $document->get_content_type() . '; charset=' . get_bloginfo( 'charset' ) );
		header( 'X-Content-Type-Options: nosniff' );
		header( 'X-Robots-Tag: noindex' );

		if ( 'HEAD' !== $method ) {
			echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by the document for its format.
		}

		exit( 0 );
	}

	/**
	 * Sends a plain text error and exits.
	 *
	 * @param int    $status  The HTTP status code.
	 * @param string $message The error message.
	 * @return never
	 */
	private static function send_error( $status, $message ) {
		status_header( $status );
		header( 'Content-Type: text/plain; charset=' . get_bloginfo( 'charset' ) );
		echo esc_html( $message );
		exit( 0 );
	}
}
