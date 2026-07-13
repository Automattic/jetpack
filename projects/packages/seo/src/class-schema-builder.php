<?php
/**
 * JSON-LD Schema.org markup emitter.
 *
 * Serializes a Schema.org `@graph` document into the document `<head>`. The graph
 * is assembled from independent, condition-gated contributions: the site-level
 * Organization and WebSite nodes, emitted on the home page only (Google treats
 * them as single canonical site entities), the page node (Article or FAQPage)
 * built by {@see Post_Schema_Node} on singular requests, and Person/ProfilePage
 * nodes on author archives. An Article references its author's full Person node
 * (added to the same graph) by `@id`, and — like the WebSite node — references
 * the home-page Organization as its `publisher` by stable `@id` rather than
 * duplicating the node. Emission is gated on
 * `Jetpack_SEO_Utils::is_enabled_jetpack_seo()`.
 *
 * This class owns only the gating and serialization; the individual nodes and
 * their stable `@id`s live in their own builders ({@see Post_Schema_Node},
 * {@see Organization_Schema_Node}, {@see Website_Schema_Node},
 * {@see Author_Schema_Node}, {@see Schema_Node_Ids}) and are assembled by
 * {@see Schema_Graph}.
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
	 * The site-level nodes, author archive nodes, and singular page node are
	 * independent, condition-gated contributions to one graph:
	 *
	 * - Organization and WebSite are single canonical site entities, so their full
	 *   nodes are added on the home page only (Google's guidance). Other pages
	 *   reference the Organization by `@id` instead of duplicating it.
	 * - Author archives contribute the author's Person node and the ProfilePage
	 *   wrapping it (`mainEntity` → Person `@id`).
	 * - The page node (Article/FAQPage) is added on singular requests. An Article
	 *   points its `publisher` at the home-page Organization's stable `@id` and its
	 *   `author` at the full Person node added to the same graph.
	 *
	 * Returns null when the graph ends up empty (non-author archives, 404, a page
	 * with no node) so the caller emits nothing rather than an empty graph.
	 * Cross-node references are wired here rather than inside the individual node
	 * builders, which stay self-contained and unaware of each other.
	 *
	 * @return array|null
	 */
	private static function build_document() {
		$graph = new Schema_Graph();

		// Effective Organization settings (stored overrides merged over site identity);
		// an unconfigured site still yields a valid node from site identity alone. Build
		// it regardless so we know whether `@id` references to it (publisher, worksFor)
		// will resolve, but only add the full node on the home page.
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

		if ( is_author() ) {
			$person = self::build_person_node( get_queried_object(), null !== $organization );
			if ( null !== $person ) {
				$graph->add( $person );
				$graph->add( Author_Schema_Node::build_profile_page( get_queried_object() ) );
			}
		}

		if ( is_singular() ) {
			$post      = get_queried_object();
			$post_node = Post_Schema_Node::build( $post );
			if ( null !== $post_node ) {
				// Only the Article node carries publisher/author; FAQPage does not.
				// Both are @id references: publisher points at the home-page
				// Organization (never duplicated), author points at the full Person
				// node added to this page's graph.
				if ( 'Article' === ( $post_node['@type'] ?? '' ) ) {
					if ( null !== $organization ) {
						$post_node['publisher'] = array( '@id' => Schema_Node_Ids::organization() );
					}
					$person = self::build_person_node( (int) $post->post_author, null !== $organization );
					if ( null !== $person ) {
						$post_node['author'] = array( '@id' => $person['@id'] );
						$graph->add( $person );
					}
				}
				$graph->add( $post_node );
			}
		}

		return $graph->to_document();
	}

	/**
	 * Build the author Person node, wiring `worksFor` to the site Organization's
	 * stable `@id` when the Organization node resolves.
	 *
	 * @param \WP_User|int|null $user             User object or ID.
	 * @param bool              $has_organization Whether the Organization node resolves.
	 * @return array|null
	 */
	private static function build_person_node( $user, $has_organization ) {
		$person = Author_Schema_Node::build_person( $user );
		if ( null !== $person && $has_organization ) {
			$person['worksFor'] = array( '@id' => Schema_Node_Ids::organization() );
		}
		return $person;
	}
}
