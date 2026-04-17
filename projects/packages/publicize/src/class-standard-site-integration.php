<?php
/**
 * Integration for the standard.site protocol (used by Bluesky).
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

/**
 * Wires up the standard.site well-known endpoint, the per-post document
 * URI link tag, and the persistence of the document URI from share status.
 *
 * @see https://standard.site/
 */
class Standard_Site_Integration {

	const DOCUMENT_URI_META_KEY = '_bluesky_standard_site_document_uri';

	/**
	 * Register hooks for the integration.
	 */
	public static function init() {
		add_action( 'init', array( self::class, 'register_rewrite' ) );
		add_action( 'template_redirect', array( self::class, 'serve_publication' ) );
		add_action( 'wp_head', array( self::class, 'inject_link_tag' ) );
	}

	/**
	 * Register the rewrite rule for /.well-known/site.standard.publication.
	 */
	public static function register_rewrite() {
		add_rewrite_rule(
			'^\.well-known/site\.standard\.publication$',
			'index.php?standard_site_publication=1',
			'top'
		);

		add_rewrite_tag( '%standard_site_publication%', '([^&]+)' );
	}

	/**
	 * Serve the /.well-known/site.standard.publication endpoint.
	 *
	 * Redirects to the stored AT URI for the site's standard.site publication record.
	 */
	public static function serve_publication() {
		if ( ! get_query_var( 'standard_site_publication' ) ) {
			return;
		}

		$publication_uri = get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION );

		if ( ! $publication_uri ) {
			status_header( 404 );
			exit;
		}

		wp_redirect( $publication_uri, 302 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- AT URI (at://) is not an HTTP URL, wp_safe_redirect would reject it.
		exit;
	}

	/**
	 * Inject a <link> tag for the standard.site document URI on singular posts.
	 */
	public static function inject_link_tag() {
		if ( ! is_singular() ) {
			return;
		}

		$uri = get_post_meta( get_the_ID(), self::DOCUMENT_URI_META_KEY, true );

		if ( $uri ) {
			printf( '<link rel="alternate" type="application/json" href="%s" />' . "\n", esc_attr( $uri ) );
		}
	}

	/**
	 * Store the standard.site document URI from Bluesky share status data.
	 *
	 * @param int   $post_id The post ID.
	 * @param array $shares  The shares data.
	 */
	public static function store_document_uri( $post_id, array $shares ) {
		foreach ( $shares as $share ) {
			if (
				isset( $share['service'] ) &&
				'bluesky' === $share['service'] &&
				! empty( $share['standard_site_document_uri'] )
			) {
				update_post_meta( $post_id, self::DOCUMENT_URI_META_KEY, $share['standard_site_document_uri'] );
				break;
			}
		}
	}
}
