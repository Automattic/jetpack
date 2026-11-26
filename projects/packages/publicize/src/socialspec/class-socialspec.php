<?php
/**
 * Routes and serves the SocialSpec documents.
 *
 * @link https://socialspec.org/
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

use Automattic\Jetpack\Status;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Serves the SocialSpec documents at /.well-known/.
 */
class Socialspec {

	const OPTION = 'jetpack_social_socialspec_settings';

	/**
	 * `about_page` 0 stands for the page at /about.
	 */
	const DEFAULT_SETTINGS = array(
		'enabled'         => false,
		'about_page'      => 0,
		'promo_dismissed' => false,
	);

	/**
	 * Registers the settings and the request handlers.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );

		// Last, after redirect_canonical() and the access gates other plugins run on the template hooks.
		add_filter( 'template_include', array( __CLASS__, 'serve' ), PHP_INT_MAX );
		add_filter( 'exit_on_http_head', array( __CLASS__, 'exit_on_http_head' ) );

		// Apps read the feed next to the documents, so the core feeds get CORS too.
		foreach ( array( 'rdf', 'rss', 'rss2', 'atom' ) as $feed ) {
			add_action( "do_feed_{$feed}", array( __CLASS__, 'send_cors_header' ), 1 );
		}
	}

	/**
	 * Registers the settings, also for the REST API the Social dashboard saves them through.
	 */
	public static function register_settings() {
		register_setting(
			'jetpack_social',
			self::OPTION,
			array(
				'type'              => 'object',
				'default'           => self::DEFAULT_SETTINGS,
				'sanitize_callback' => array( __CLASS__, 'sanitize_settings' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'enabled'         => array( 'type' => 'boolean' ),
							'about_page'      => array( 'type' => 'integer' ),
							'promo_dismissed' => array( 'type' => 'boolean' ),
						),
					),
				),
			)
		);
	}

	/**
	 * The settings, complete and typed.
	 *
	 * @return array{enabled: bool, about_page: int, promo_dismissed: bool}
	 */
	public static function get_settings() {
		$settings = array_merge( self::DEFAULT_SETTINGS, (array) get_option( self::OPTION, array() ) );

		return array(
			'enabled'         => (bool) $settings['enabled'],
			'about_page'      => (int) $settings['about_page'],
			'promo_dismissed' => (bool) $settings['promo_dismissed'],
		);
	}

	/**
	 * The ID of the About page: the one from the settings, or the page at /about until one is picked.
	 *
	 * @return int 0 if there is neither.
	 */
	public static function get_about_page_id() {
		$page_id = self::get_settings()['about_page'];

		if ( ! $page_id ) {
			$page    = get_page_by_path( 'about' );
			$page_id = $page instanceof \WP_Post ? $page->ID : 0;
		}

		return (int) $page_id;
	}

	/**
	 * Sanitizes the settings. The dashboard saves one of them at a time, so the others are kept.
	 *
	 * @param mixed $value The submitted settings.
	 * @return array
	 */
	public static function sanitize_settings( $value ) {
		$current  = self::get_settings();
		$value    = is_array( $value ) ? $value : array();
		$settings = array_merge( $current, array_intersect_key( $value, $current ) );
		$page_id  = absint( $settings['about_page'] );

		return array(
			'enabled'         => (bool) $settings['enabled'],
			// get_post_type( 0 ) would check the global post.
			'about_page'      => $page_id && 'page' === get_post_type( $page_id ) ? $page_id : 0,
			'promo_dismissed' => (bool) $settings['promo_dismissed'],
		);
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
	 * Whether Jetpack can serve the documents: the standalone SocialSpec plugin serves the same paths.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return ! defined( 'SOCIALSPEC_VERSION' );
	}

	/**
	 * Whether the documents are served. This does not depend on auto-sharing (Publicize) being on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return self::is_available() && self::get_settings()['enabled'];
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
			'about.md'       => new About(),
		);
	}

	/**
	 * The requested file name in /.well-known/, from the request path.
	 *
	 * Not a rewrite rule: existing sites would only get it after a flush, and a package has no activation to flush on.
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
	 * Answers HEAD requests for a document: WordPress exits before the template, so serve() would not run.
	 *
	 * @param bool $exit Whether to exit without loading the template.
	 * @return bool
	 */
	public static function exit_on_http_head( $exit ) {
		// Exits if there is a document to serve.
		self::serve( '' );

		return $exit;
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

		// Short and explicit, so a cache in front of the site does not keep a document for longer than this.
		header( 'Cache-Control: public, max-age=300' );
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
