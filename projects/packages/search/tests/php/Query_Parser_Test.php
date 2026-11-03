<?php
/**
 * Tests for WPES Query_Parser.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\WPES\Query_Parser;
use PHPUnit\Framework\TestCase;

/**
 * Query_Parser tests.
 */
class Query_Parser_Test extends TestCase {

	public function test_phrase_filter_ignores_apostrophes_inside_contractions() {
		$query  = "I can't connect Jetpack and it's showing an error";
		$parser = new Query_Parser( $query, array( 'en' ) );

		$found = $parser->phrase_filter(
			array(
				'must_query_fields'  => array( 'all_content' ),
				'boost_query_fields' => array( 'title' ),
			)
		);

		$this->assertFalse( $found, 'Two contractions must not be mistaken for a quoted phrase.' );
		$this->assertSame( $query, $parser->get_current_query() );
	}

	public function test_phrase_filter_still_extracts_a_genuine_single_quoted_phrase() {
		$parser = new Query_Parser(
			"I get this message: 'Requests from WordPress.com to your site are being blocked, usually by a firewall or security rule.'",
			array( 'en' )
		);

		$found = $parser->phrase_filter(
			array(
				'must_query_fields'  => array( 'all_content' ),
				'boost_query_fields' => array( 'title' ),
			)
		);

		$this->assertTrue( $found, 'A sentence wrapped in straight single quotes is still a quoted phrase.' );
		$query = $parser->build_query();
		$this->assertSame(
			'Requests from WordPress.com to your site are being blocked, usually by a firewall or security rule.',
			$query['bool']['must'][0]['multi_match']['query']
		);
		$this->assertSame( 'I get this message:', trim( $parser->get_current_query() ) );
	}

	public function test_phrase_filter_ignores_double_quotes_used_as_inch_marks() {
		$query  = 'search 6" greatest post 4" wide';
		$parser = new Query_Parser( $query, array( 'en' ) );

		$found = $parser->phrase_filter(
			array(
				'must_query_fields'  => array( 'all_content' ),
				'boost_query_fields' => array( 'title' ),
			)
		);

		$this->assertFalse( $found, 'Inch-mark quotes glued to digits must not form a phrase.' );
		$this->assertSame( $query, $parser->get_current_query() );
	}

	public function test_phrase_filter_ignores_a_contraction_apostrophe_at_the_end_of_the_query() {
		$query  = "the greatest post won't conn";
		$parser = new Query_Parser( $query, array( 'en' ) );

		$found = $parser->phrase_filter(
			array(
				'must_query_fields'  => array( 'all_content' ),
				'boost_query_fields' => array( 'title' ),
			)
		);

		$this->assertFalse( $found, 'A trailing contraction must not be read as an incomplete quoted phrase.' );
		$this->assertSame( $query, $parser->get_current_query() );
	}
}
