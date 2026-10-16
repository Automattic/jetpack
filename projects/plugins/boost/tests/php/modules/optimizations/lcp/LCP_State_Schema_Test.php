<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Schema\Schema_Parser;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\Lcp;
use PHPUnit\Framework\TestCase;

/**
 * Regression coverage for BOOST-604 at the PHP Data Sync boundary.
 *
 * The `lcp_state` schema stores an array of error details per page. `Type_Array` aborts the whole
 * array on the first item that fails to parse, and the list-level `->nullable()` then converts the
 * entire `errors` value to null, so one malformed error used to discard every valid sibling on that
 * page before the client parser could preserve them. The error item now carries a `->fallback()`, so
 * a single bad item degrades in place. These tests parse through the real registered schema so a
 * future edit that drops the item fallback fails here.
 */
class LCP_State_Schema_Test extends TestCase {

	/**
	 * Pull the real `lcp_state` Schema_Parser out of Lcp::register_data_sync() via a capturing stub,
	 * so the assertions run against the exact schema that ships, not a hand-rebuilt copy.
	 *
	 * @return Schema_Parser
	 */
	private function get_lcp_state_schema() {
		$captured = null;

		$instance = new class( $captured ) {
			private $captured_ref;

			public function __construct( &$captured ) {
				$this->captured_ref = &$captured;
			}

			public function register( $key, $parser ) {
				if ( 'lcp_state' === $key ) {
					$this->captured_ref = $parser;
				}
			}

			public function register_action() {
				// no-op: the schema is all we need. Extra args from the caller are ignored.
			}
		};

		// @phan-suppress-next-line PhanTypeMismatchArgument -- Deliberate capturing stub in place of the real Data_Sync.
		( new Lcp() )->register_data_sync( $instance );

		$this->assertInstanceOf( Schema_Parser::class, $captured, 'register_data_sync() must register an lcp_state parser.' );

		return $captured;
	}

	/**
	 * Build a minimal analyzed state whose single page carries the given errors array.
	 *
	 * @param array $errors The errors array to place on the page.
	 *
	 * @return array
	 */
	private function analyzed_state_with_errors( array $errors ) {
		return array(
			'pages'   => array(
				array(
					'key'    => 'home',
					'url'    => 'https://example.com/',
					'status' => 'error',
					'errors' => $errors,
				),
			),
			'status'  => 'analyzed',
			'created' => 1.0,
			'updated' => 2.0,
		);
	}

	public function test_malformed_error_item_isolates_and_preserves_valid_siblings() {
		$schema = $this->get_lcp_state_schema();

		$parsed = $schema->parse(
			$this->analyzed_state_with_errors(
				array(
					array(
						'type' => 'http-error',
						'meta' => array( 'code' => 404 ),
					),
					// A scalar can never be an error object; before the item fallback this aborted the
					// whole array and nulled `errors`, dropping the valid http-error above.
					42,
				)
			)
		);

		// The whole state survives (not the not_analyzed fallback) and the page keeps its errors key.
		$this->assertSame( 'analyzed', $parsed['status'] );
		$this->assertArrayHasKey( 'errors', $parsed['pages'][0], 'The valid sibling error must survive the malformed one.' );
		$this->assertCount( 2, $parsed['pages'][0]['errors'] );

		// The valid error is untouched.
		$this->assertSame( 'http-error', $parsed['pages'][0]['errors'][0]['type'] );
		$this->assertSame( 404, $parsed['pages'][0]['errors'][0]['meta']['code'] );

		// The malformed item degraded to the benign unknown fallback.
		$this->assertSame( 'unknown', $parsed['pages'][0]['errors'][1]['type'] );
	}

	public function test_finalurl_survives_alongside_a_malformed_sibling() {
		$schema = $this->get_lcp_state_schema();

		$parsed = $schema->parse(
			$this->analyzed_state_with_errors(
				array(
					array(
						'type' => 'page-navigated',
						'meta' => array( 'finalUrl' => 'https://example.com/landing/' ),
					),
					'not-an-error',
				)
			)
		);

		$this->assertCount( 2, $parsed['pages'][0]['errors'] );
		$this->assertSame( 'page-navigated', $parsed['pages'][0]['errors'][0]['type'] );
		$this->assertSame( 'https://example.com/landing/', $parsed['pages'][0]['errors'][0]['meta']['finalUrl'] );
		$this->assertSame( 'unknown', $parsed['pages'][0]['errors'][1]['type'] );
	}

	public function test_a_fully_valid_errors_array_parses_unchanged() {
		$schema = $this->get_lcp_state_schema();

		$parsed = $schema->parse(
			$this->analyzed_state_with_errors(
				array(
					array(
						'type' => 'http-error',
						'meta' => array( 'code' => 500 ),
					),
				)
			)
		);

		$this->assertCount( 1, $parsed['pages'][0]['errors'] );
		$this->assertSame( 'http-error', $parsed['pages'][0]['errors'][0]['type'] );
		$this->assertSame( 500, $parsed['pages'][0]['errors'][0]['meta']['code'] );
	}
}
