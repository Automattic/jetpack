<?php
/**
 * Stable Schema.org node `@id` helpers.
 *
 * Site-level nodes (Organization, WebSite, …) and page nodes (Article) live
 * together in one `@graph` and cross-reference each other by `@id`. Those `@id`s
 * must be stable URIs — the same across every page of the site — so references
 * resolve and search engines can de-duplicate the entities. Centralizing them
 * here keeps every node builder agreeing on the exact same strings.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Builds the canonical `@id` URIs used across the schema graph.
 */
class Schema_Node_Ids {

	/**
	 * `@id` for the site-level Organization node.
	 *
	 * Anchored to the site root with a stable fragment, e.g.
	 * `https://example.com/#organization`, so the Article `publisher`
	 * reference resolves to the same entity on every page.
	 *
	 * @return string
	 */
	public static function organization() {
		return self::site_anchor( 'organization' );
	}

	/**
	 * `@id` for the site-level WebSite node.
	 *
	 * @return string
	 */
	public static function website() {
		return self::site_anchor( 'website' );
	}

	/**
	 * Build a stable site-root `@id` from a fragment name.
	 *
	 * @param string $fragment Fragment identifier (without the leading `#`).
	 * @return string
	 */
	private static function site_anchor( $fragment ) {
		// home_url( '/' ) is the canonical site root and already carries a trailing
		// slash, giving fragments like `https://example.com/#organization`.
		return home_url( '/' ) . '#' . $fragment;
	}
}
