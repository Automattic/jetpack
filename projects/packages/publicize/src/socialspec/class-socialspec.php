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

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
				'description' => 'Let feed readers and social apps see who the site is and which blogs it follows (SocialSpec), and let web apps read its feeds.',
				'owner'       => 'jetpack-social',
			)
		);

		// Last, after redirect_canonical() and the access gates other plugins run on the template hooks.
		add_filter( 'template_include', array( __CLASS__, 'serve' ), PHP_INT_MAX );
		add_filter( 'exit_on_http_head', array( __CLASS__, 'exit_on_http_head' ) );

		// Apps read the feed next to the documents, so the core feeds get CORS too.
		foreach ( array( 'rdf', 'rss', 'rss2', 'atom' ) as $feed ) {
			add_action( "do_feed_{$feed}", array( __CLASS__, 'send_cors_header' ), 1 );
		}
	}

	/**
	 * Allows browser apps on other origins to read the response.
	 */
	public static function send_cors_header() {
		if ( self::is_enabled() && ! headers_sent() ) {
			header( 'Access-Control-Allow-Origin: *' );
		}
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
	 * The requested document, if this site publishes it.
	 *
	 * @return Document|null
	 */
	public static function get_document() {
		$name = self::get_requested_name();

		if ( null === $name || ! self::is_enabled() ) {
			return null;
		}

		// Checked here too: Coming Soon replaces the template instead of ending the request.
		$status = new Status();
		if ( $status->is_private_site() || $status->is_coming_soon() ) {
			return null;
		}

		return self::get_documents()[ $name ] ?? null;
	}

	/**
	 * Lets HEAD requests for a document reach serve(), WordPress exits before the template otherwise.
	 *
	 * @param bool $exit Whether to exit without loading the template.
	 * @return bool
	 */
	public static function exit_on_http_head( $exit ) {
		$document = self::get_document();

		return $document && null !== $document->get_content() ? false : $exit;
	}

	/**
	 * Serves the requested document in place of the 404 template.
	 *
	 * @param string $template Template to load.
	 * @return string
	 */
	public static function serve( $template ) {
		$document = self::get_document();
		$content  = $document ? $document->get_content() : null;

		if ( null === $content ) {
			return $template;
		}

		// WordPress has answered the unknown path with a 404 that must not be cached.
		foreach ( array_keys( wp_get_nocache_headers() ) as $header ) {
			header_remove( $header );
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
			status_header( 405 );
			header( 'Allow: GET, HEAD, OPTIONS' );
			header( 'Content-Type: text/plain; charset=' . get_bloginfo( 'charset' ) );
			echo 'Method Not Allowed';
			exit( 0 );
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
}
