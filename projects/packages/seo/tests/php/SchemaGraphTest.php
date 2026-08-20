<?php
/**
 * Tests for the Jetpack SEO Schema_Graph assembler.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Schema_Graph
 */
#[CoversClass( Schema_Graph::class )]
class SchemaGraphTest extends TestCase {

	/**
	 * A graph with no nodes renders no document, so the caller emits nothing.
	 */
	public function test_empty_graph_renders_no_document() {
		$graph = new Schema_Graph();
		$this->assertTrue( $graph->is_empty() );
		$this->assertNull( $graph->to_document() );
	}

	/**
	 * Null and empty nodes are ignored, so a builder result can be passed straight
	 * through without the caller guarding it.
	 */
	public function test_null_and_empty_nodes_are_skipped() {
		$graph = new Schema_Graph();
		$graph->add( null )->add( array() );
		$this->assertTrue( $graph->is_empty() );
		$this->assertNull( $graph->to_document() );
	}

	/**
	 * The document wraps the collected nodes in a schema.org `@graph`, preserving
	 * insertion order and serializing the graph as a JSON array (a list).
	 */
	public function test_document_wraps_nodes_in_graph_in_order() {
		$organization = array( '@type' => 'Organization' );
		$article      = array( '@type' => 'Article' );

		$document = ( new Schema_Graph() )
			->add( $organization )
			->add( $article )
			->to_document();

		$this->assertSame( 'https://schema.org', $document['@context'] );
		$this->assertSame( array( $organization, $article ), $document['@graph'] );
		$this->assertSame( array( 0, 1 ), array_keys( $document['@graph'] ), 'The @graph must be a sequential list.' );
	}
}
