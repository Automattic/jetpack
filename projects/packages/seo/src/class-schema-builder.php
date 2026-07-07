<?php
/**
 * JSON-LD Schema.org markup emitter.
 *
 * Serializes a Schema.org `@graph` document into the document `<head>`. The graph
 * is assembled from independent, condition-gated contributions: the site-level
 * Organization and WebSite nodes, emitted on the home page only (Google treats
 * them as single canonical site entities), and the page node (Article, or
 * FAQPage when the post uses `core/details` blocks) built by
 * {@see Post_Schema_Node} on singular requests. An Article — and the WebSite
 * node — reference the home-page Organization as their `publisher` by stable
 * `@id` rather than duplicating the node. Emission is gated on
 * `Jetpack_SEO_Utils::is_enabled_jetpack_seo()`.
 *
 * This class owns only the gating and serialization; the individual nodes and
 * their stable `@id`s live in their own builders ({@see Post_Schema_Node},
 * {@see Organization_Schema_Node}, {@see Website_Schema_Node},
 * {@see Schema_Node_Ids}) and are assembled by {@see Schema_Graph}.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Jetpack_SEO_Utils;

/**
 * Emits a Schema.org JSON-LD `@graph` into the document head.
 */
class Schema_Builder {

	/**
	 * Wire the front-end emitter.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'wp_head', array( __CLASS__, 'emit' ), 5 );
	}

	/**
	 * Build and echo the JSON-LD `@graph` block for the current request.
	 *
	 * @return void
	 */
	public static function emit() {
		// Both plugin classes must be loaded — they're not guaranteed in every
		// context, and the post node builder calls Jetpack_SEO_Posts directly.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack; guarded by the class_exists check on the same line.
		if ( ! class_exists( 'Jetpack_SEO_Utils' ) || ! class_exists( 'Jetpack_SEO_Posts' ) || ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
			return;
		}

		// build_document() gates each node itself and returns null for an empty
		// graph, so archives and 404s (no front-page, no page node) emit nothing.
		$document = self::build_document();
		if ( null === $document ) {
			return;
		}

		printf(
			'<script type="application/ld+json">%s</script>',
			// Default flags escape forward slashes — important inside <script>
			// so a "</script>" in the data can't break out of the block.
			wp_json_encode( $document, JSON_UNESCAPED_UNICODE ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}

	/**
	 * Assemble the `@graph` document for the current request.
	 *
	 * The site-level nodes and the singular page node are two independent,
	 * condition-gated contributions to one graph:
	 *
	 * - Organization and WebSite are single canonical site entities, so their full
	 *   nodes are added on the home page only (Google's guidance). Other pages
	 *   reference the Organization by `@id` instead of duplicating it.
	 * - The page node (Article/FAQPage) is added on singular requests. An Article
	 *   points its `publisher` at the home-page Organization's stable `@id`.
	 *
	 * Returns null when the graph ends up empty (archives, 404, a page with no
	 * node) so the caller emits nothing rather than an empty graph. Cross-node
	 * references are wired here rather than inside the individual node builders,
	 * which stay self-contained and unaware of each other.
	 *
	 * @return array|null
	 */
	private static function build_document() {
		$graph = new Schema_Graph();

		// Effective Organization settings (stored overrides merged over site identity);
		// an unconfigured site still yields a valid node from site identity alone. Build
		// it regardless so we know whether a publisher @id reference will resolve, but
		// only add the full node on the home page.
		$organization = Organization_Schema_Node::build( Schema_Settings::get_organization() );

		// Site-level nodes (Organization, WebSite) describe a single canonical
		// entity, so they belong on the home page only (Google's guidance) — never
		// duplicated onto every post. WebSite references the Organization by @id.
		if ( is_front_page() ) {
			if ( null !== $organization ) {
				$graph->add( $organization );
			}

			$website = Website_Schema_Node::build();
			if ( null !== $website && null !== $organization ) {
				$website['publisher'] = array( '@id' => Schema_Node_Ids::organization() );
			}
			$graph->add( $website );
		}

		if ( is_singular() ) {
			$post_node = Post_Schema_Node::build( get_queried_object() );
			if ( null !== $post_node ) {
				// Only the Article node carries a publisher; FAQPage does not. It
				// references the home-page Organization by @id, never duplicating it.
				if ( null !== $organization && 'Article' === ( $post_node['@type'] ?? '' ) ) {
					$post_node['publisher'] = array( '@id' => Schema_Node_Ids::organization() );
				}
				$graph->add( $post_node );
			}
		}

		return $graph->to_document();
	}
}
