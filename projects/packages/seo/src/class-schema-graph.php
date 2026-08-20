<?php
/**
 * Schema.org `@graph` document assembler.
 *
 * Collects the individual JSON-LD nodes that apply to the current request
 * (site-level entities such as Organization plus the page node such as Article)
 * and serializes them into a single `@graph` document. This is the reusable
 * foundation the site-level schema types build on: each node builder returns an
 * array (or null when it has nothing valid to emit), and the graph stitches the
 * non-empty ones together.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Accumulates schema nodes and renders the `@graph` document.
 */
class Schema_Graph {

	/**
	 * Collected nodes, in insertion order.
	 *
	 * @var array<int, array>
	 */
	private $nodes = array();

	/**
	 * Add a node to the graph. Null/empty nodes are ignored, so callers can pass
	 * a builder result straight through without guarding it first.
	 *
	 * @param array|null $node A JSON-LD node, or null/empty to skip.
	 * @return static The graph, for chaining.
	 */
	public function add( $node ) {
		if ( is_array( $node ) && ! empty( $node ) ) {
			$this->nodes[] = $node;
		}
		return $this;
	}

	/**
	 * Whether the graph has no nodes to emit.
	 *
	 * @return bool
	 */
	public function is_empty() {
		return empty( $this->nodes );
	}

	/**
	 * Render the full JSON-LD document, or null when there is nothing to emit so
	 * the caller can skip output entirely rather than print an empty graph.
	 *
	 * @return array|null
	 */
	public function to_document() {
		if ( $this->is_empty() ) {
			return null;
		}

		return array(
			'@context' => 'https://schema.org',
			'@graph'   => array_values( $this->nodes ),
		);
	}
}
