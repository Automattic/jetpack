<?php
/**
 * JSON-LD Schema.org markup emitter.
 *
 * Serializes a Schema.org `@graph` document into the document `<head>` for the
 * current singular request. The graph stitches together the page node (Article,
 * or FAQPage when the post uses `core/details` blocks) built by
 * {@see Post_Schema_Node}; site-level nodes (Organization, WebSite, …) join the
 * same graph and cross-reference the page node by `@id`. Emission is gated on
 * `Jetpack_SEO_Utils::is_enabled_jetpack_seo()`.
 *
 * This class owns only the gating and serialization; the individual nodes and
 * their stable `@id`s live in their own builders ({@see Post_Schema_Node},
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
	 * Build and echo the JSON-LD `@graph` block for the current singular request.
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

		// Site-level nodes still ride along on the singular request's graph, so a
		// page that emits no page node (and therefore no graph) emits nothing —
		// preserving the pre-graph behavior on archives, the home page, and 404s.
		if ( ! is_singular() ) {
			return;
		}

		$document = self::build_document( get_queried_object() );
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
	 * Assemble the `@graph` document for the queried singular object.
	 *
	 * Returns null when the post yields no page node, so the caller emits nothing
	 * rather than an empty graph. Site-level nodes are only added alongside a page
	 * node; standalone sitewide emission (home page, archives) is out of scope.
	 *
	 * Cross-node references (e.g. the Article `publisher`) are wired here rather
	 * than inside the individual node builders, which stay self-contained and
	 * unaware of each other.
	 *
	 * @param mixed $queried_object The queried object (expected to be a WP_Post).
	 * @return array|null
	 */
	private static function build_document( $queried_object ) {
		$post_node = Post_Schema_Node::build( $queried_object );
		if ( null === $post_node ) {
			return null;
		}

		$graph = new Schema_Graph();

		// Site-level entities come first, then the page node references them by @id.
		// Organization is built from site identity alone here. The persisted schema
		// settings — social profiles (`sameAs`) and any `name`/`logo`/`email`
		// overrides — are injected through Organization_Schema_Node::build( $settings )
		// once the schema settings server lands; see the `$settings` seam on that
		// builder. Until then the argument is intentionally empty, so the output
		// matches the current site identity and nothing is configurable yet.
		$organization = Organization_Schema_Node::build();
		if ( null !== $organization ) {
			$graph->add( $organization );

			// Only the Article node carries a publisher; FAQPage does not.
			if ( 'Article' === ( $post_node['@type'] ?? '' ) ) {
				$post_node['publisher'] = array( '@id' => Schema_Node_Ids::organization() );
			}
		}

		$graph->add( $post_node );

		return $graph->to_document();
	}
}
