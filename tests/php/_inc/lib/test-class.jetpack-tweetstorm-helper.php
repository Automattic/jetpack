<?php
/**
 * Tweetstorm testing.
 *
 * @package Jetpack
 */

/**
 * Class for Tweetstorm testing.
 */
class WP_Test_Jetpack_Tweetstorm_Helper extends WP_UnitTestCase {

	/**
	 * Helper function. Given a string of text, it will generate the blob of data
	 * that the parser expects to recieve for a paragraph block.
	 *
	 * @param string $text The paragraph text.
	 * @return array The paragraph blob of data.
	 */
	public function generateParagraphData( $text ) {
		return array(
			'attributes' => array(
				'content' => $text,
			),
			'block'      => array(
				'blockName' => 'core/paragraph',
				'innerHTML' => "<p>$text</p>",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Given a quote and attribution, it will generate the blob of data
	 * that the parser expects to recieve for a quote block.
	 *
	 * @param string $quote       The quote text.
	 * @param string $attribution The attribution text.
	 * @return array The quote blob of data.
	 */
	public function generateQuoteData( $quote, $attribution ) {
		// Generate an array of lines for the quote filtering out empty lines.
		$quote_lines = array_filter( array_map( 'trim', explode( "\n", $quote ) ), 'strlen' );
		$quote_value = '<p>' . implode( '</p><p>', $quote_lines ) . '</p>';

		return array(
			'attributes' => array(
				'value'    => $quote_value,
				'citation' => $attribution,
			),
			'block'      => array(
				'blockName' => 'core/quote',
				'innerHTML' => "<blockquote>$quote_value<cite>$attribution</cite></blockquote>",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Given a string of list data, it will generate the blob of data
	 * that the parser expects to recieve for a list block.
	 *
	 * @param string $html The list data.
	 * @return array The list blob of data.
	 */
	public function generateListData( $html ) {
		return array(
			'attributes' => array(
				'values' => $html,
			),
			'block'      => array(
				'blockName' => 'core/list',
				'innerHTML' => "<ul>$html</ul>",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Generates a normal boundary marker.
	 *
	 * @param int    $start     The start position of the marker.
	 * @param int    $end       The end position of the marker.
	 * @param string $container The name of the RichText container this boundary is for.
	 * @return array The boundary marker definition.
	 */
	public function generateNormalBoundary( $start, $end, $container ) {
		return array(
			'start'     => $start,
			'end'       => $end,
			'container' => $container,
			'type'      => 'normal',
		);
	}

	/**
	 * Helper function. Generates a normal boundary marker.
	 *
	 * @param int    $line      The line number of the marker.
	 * @param string $container The name of the RichText container this boundary is for.
	 * @return array The boundary marker definition.
	 */
	public function generateLineBoundary( $line, $container ) {
		return array(
			'line'      => $line,
			'container' => $container,
			'type'      => 'end-of-line',
		);
	}

	/**
	 * Helper function. Tests that a generate tweet contains the expected data.
	 *
	 * @param string $text        The text of the generated tweet.
	 * @param array  $blocks      An array of blocks that should be defined in the tweet.
	 * @param array  $boundary    The boundary data that the tweet should contain.
	 * @param array  $tweet       A single tweet returned from the parser.
	 * @param bool   $editor_info Flag whether or not editor-related info should be in the tweet.
	 */
	public function assertTweetContains( $text, $blocks, $boundary, $tweet, $editor_info ) {
		$this->assertEquals( $text, $tweet['text'] );

		if ( $editor_info ) {
			$block_count = count( $blocks );

			$this->assertEquals( $block_count, count( $tweet['blocks'] ) );

			for ( $ii = 0; $ii < $block_count; $ii++ ) {
				$this->assertArrayNotHasKey( 'block', $tweet['blocks'][ $ii ] );
				$this->assertEquals( $blocks[ $ii ]['clientId'], $tweet['blocks'][ $ii ]['clientId'] );
				$this->assertEquals( $blocks[ $ii ]['attributes'], $tweet['blocks'][ $ii ]['attributes'] );
			}

			$this->assertEquals( $boundary, $tweet['boundary'] );
		} else {
			$this->assertEquals( array(), $tweet['blocks'] );
			$this->assertEquals( false, $tweet['boundary'] );
		}
	}

	/**
	 * Helper function. Generates tweets in the form of both editor and Publicize requests, then
	 * confirms that they've been generated the same way.
	 *
	 * @param array $blocks       The array of blocks used to generate the tweets.
	 * @param array $text         An array of strings matching the generated tweets.
	 * @param array $boundaries   The boundary data that each tweet should contain.
	 * @param array $tweet_blocks An array of arrays: each child array should be the blocks used
	 *                            to generate each tweet.
	 */
	public function assertTweetGenerated( $blocks, $text, $boundaries, $tweet_blocks ) {
		$tweets      = Jetpack_Tweetstorm_Helper::parse( $blocks );
		$tweet_count = count( $tweets );

		$this->assertEquals( $tweet_count, count( $text ) );
		$this->assertEquals( $tweet_count, count( $boundaries ) );
		$this->assertEquals( $tweet_count, count( $tweet_blocks ) );

		for ( $ii = 0; $ii < $tweet_count; $ii++ ) {
			$this->assertTweetContains( $text[ $ii ], $tweet_blocks[ $ii ], $boundaries[ $ii ], $tweets[ $ii ], true );
		}

		// Remove the data that the editor sends, to match Publicize's behaviour.
		$publicize_blocks = array_map(
			function ( $block ) {
				unset( $block['attributes'] );
				unset( $block['clientId'] );

				return $block;
			},
			$blocks
		);

		$tweets      = Jetpack_Tweetstorm_Helper::parse( $publicize_blocks );
		$tweet_count = count( $tweets );

		$this->assertEquals( $tweet_count, count( $text ) );
		$this->assertEquals( $tweet_count, count( $boundaries ) );
		$this->assertEquals( $tweet_count, count( $tweet_blocks ) );

		for ( $ii = 0; $ii < $tweet_count; $ii++ ) {
			$this->assertTweetContains( $text[ $ii ], $tweet_blocks[ $ii ], $boundaries[ $ii ], $tweets[ $ii ], false );
		}

	}

	/**
	 * Test that sending no blocks gives no tweets.
	 */
	public function test_no_blocks_no_tweets() {
		$this->assertEmpty( Jetpack_Tweetstorm_Helper::parse( array() ) );
	}

	/**
	 * Test that a single short paragraph turns into one tweet.
	 */
	public function test_single_paragraph() {
		$test_content = 'This is some content.';
		$blocks       = array(
			$this->generateParagraphData( $test_content ),
		);

		$this->assertTweetGenerated( $blocks, array( $test_content ), array( false ), array( $blocks ) );
	}

	/**
	 * Test that multiple short paragraphs are joined together into one tweet.
	 */
	public function test_multiple_paragraphs() {
		$test_content = 'This is some content.';
		$blocks       = array(
			$this->generateParagraphData( $test_content ),
			$this->generateParagraphData( $test_content ),
			$this->generateParagraphData( $test_content ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( "$test_content\n\n$test_content\n\n$test_content" ),
			array( false ),
			array( $blocks )
		);
	}

	/**
	 * Test that a single long paragraph is split into two tweets, breaking at the end of a sentence.
	 */
	public function test_single_long_paragraph() {
		$test_content = 'This is 23 characters. ';
		$blocks       = array(
			$this->generateParagraphData( str_repeat( $test_content, 13 ) ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( trim( str_repeat( $test_content, 12 ) ), trim( $test_content ) ),
			array( $this->generateNormalBoundary( 275, 276, 'content' ), false ),
			array( $blocks, $blocks )
		);
	}

	/**
	 * Test that, after a long paragraph is split into two tweets, a subsequent short
	 * paragraph is appended to the second tweet.
	 */
	public function test_long_paragraph_followed_by_short_paragraph() {
		$test_content = 'This is 23 characters. ';
		$blocks       = array(
			$this->generateParagraphData( str_repeat( $test_content, 13 ) ),
			$this->generateParagraphData( $test_content ),
		);

		$expected_text = array(
			trim( str_repeat( $test_content, 12 ) ),
			trim( $test_content ) . "\n\n" . trim( $test_content ),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 275, 276, 'content' ),
			false,
		);

		$expected_blocks = array(
			array( $blocks[0] ),
			$blocks,
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a long paragraph will start a new tweet if it's too long to append to the previous tweet.
	 */
	public function test_short_paragraph_followed_by_long_paragraph() {
		$test_content = 'This is 23 characters. ';
		$blocks       = array(
			$this->generateParagraphData( $test_content ),
			$this->generateParagraphData( str_repeat( $test_content, 13 ) ),
		);

		$expected_text = array(
			trim( $test_content ),
			trim( str_repeat( $test_content, 12 ) ),
			trim( $test_content ),
		);

		$expected_boundaries = array(
			false,
			$this->generateNormalBoundary( 275, 276, 'content' ),
			false,
		);

		$expected_blocks = array(
			array( $blocks[0] ),
			array( $blocks[1] ),
			array( $blocks[1] ),
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a sentence which is too long for a single tweet is split into two tweets, at a word break.
	 */
	public function test_long_sentence() {
		$test_content = 'This is 22 characters ';
		$blocks       = array(
			$this->generateParagraphData( str_repeat( $test_content, 13 ) ),
		);

		$expected_text = array(
			str_repeat( $test_content, 12 ) . 'This is 22…',
			'…characters',
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 274, 275, 'content' ),
			false,
		);

		$expected_blocks = array(
			$blocks,
			$blocks,
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that short sentences are split up correctly when they're following a long sentence
	 * which has been split into two tweets.
	 */
	public function test_long_sentence_followed_by_short_sentences() {
		$test_content   = 'This is 22 characters ';
		$short_sentence = 'This is 23 characters. ';
		$blocks         = array(
			$this->generateParagraphData( trim( str_repeat( $test_content, 13 ) ) . '. ' . str_repeat( $short_sentence, 13 ) ),
		);

		$expected_text = array(
			str_repeat( $test_content, 12 ) . 'This is 22…',
			trim( '…characters. ' . str_repeat( $short_sentence, 11 ) ),
			trim( str_repeat( $short_sentence, 2 ) ),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 274, 275, 'content' ),
			$this->generateNormalBoundary( 539, 540, 'content' ),
			false,
		);

		$expected_blocks = array(
			$blocks,
			$blocks,
			$blocks,
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a long sentence will start a new tweet when it's too long to append to the previous tweet.
	 */
	public function test_short_paragraph_followed_by_long_sentence() {
		$test_paragraph      = 'This is 23 characters. ';
		$test_sentence_chunk = 'This is 22 characters ';

		$blocks = array(
			$this->generateParagraphData( $test_paragraph ),
			$this->generateParagraphData( str_repeat( $test_sentence_chunk, 13 ) ),
		);

		$expected_text = array(
			trim( $test_paragraph ),
			str_repeat( $test_sentence_chunk, 12 ) . 'This is 22…',
			'…characters',
		);

		$expected_boundaries = array(
			false,
			$this->generateNormalBoundary( 274, 275, 'content' ),
			false,
		);

		$expected_blocks = array(
			array( $blocks[0] ),
			array( $blocks[1] ),
			array( $blocks[1] ),
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a list which is too long for a single tweet is split at the end of a list line.
	 */
	public function test_long_list() {
		$test_content = 'This is 22 characters.';

		$blocks = array(
			$this->generateListData( str_repeat( "<li>$test_content</li>", 12 ) ),
		);

		$expected_text = array(
			trim( str_repeat( "- $test_content\n", 11 ) ),
			"- $test_content",
		);

		$expected_boundaries = array(
			$this->generateLineBoundary( 10, 'values' ),
			false,
		);

		$expected_blocks = array(
			$blocks,
			$blocks,
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a long list will start a new tweet when it's too long to be appended to the previous
	 * tweet, even if some of the lines in the list would fit.
	 */
	public function test_short_paragraph_followed_by_long_list() {
		$test_content = 'This is 22 characters.';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateListData( str_repeat( "<li>$test_content</li>", 12 ) ),
		);

		$expected_text = array(
			$test_content,
			trim( str_repeat( "- $test_content\n", 11 ) ),
			"- $test_content",
		);

		$expected_boundaries = array(
			false,
			$this->generateLineBoundary( 10, 'values' ),
			false,
		);

		$expected_blocks = array(
			array( $blocks[0] ),
			array( $blocks[1] ),
			array( $blocks[1] ),
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a range of emoji (including a variety of compound emoji) count as two characters.
	 */
	public function test_emoji_count_as_two_characters() {
		$test_content = '🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ';

		$blocks = array(
			$this->generateParagraphData( str_repeat( $test_content, 19 ) ),
		);

		$expected_text = array(
			trim( str_repeat( $test_content, 18 ) ) . ' 🙂 🏳️‍🌈 👩‍👩‍👧‍👧…',
			'…👨🏾‍🦰 👩🏻‍💻',
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 705, 706, 'content' ),
			false,
		);

		$expected_blocks = array(
			$blocks,
			$blocks,
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that a boundary will be set at the end of the short items, and correct
	 * boundaries will be set inside the long item.
	 */
	public function test_short_list_items_followed_by_long_list_item() {
		$test_content = '🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ';

		$blocks = array(
			$this->generateListData(
				str_repeat( '<li>' . trim( $test_content ) . '</li>', 2 ) . '<li>' . trim( str_repeat( $test_content, 50 ) ) . '</li>'
			),
		);

		$expected_text = array(
			trim( str_repeat( '- ' . trim( $test_content ) . "\n", 2 ) ),
			'- ' . trim( str_repeat( $test_content, 18 ) ) . ' 🙂 🏳️‍🌈…',
			'…👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ' . trim( str_repeat( $test_content, 17 ) ) . ' 🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰…',
			'…👩🏻‍💻 ' . trim( str_repeat( $test_content, 13 ) ),
		);

		$expected_boundaries = array(
			$this->generateLineBoundary( 1, 'values' ),
			$this->generateNormalBoundary( 769, 770, 'values' ),
			$this->generateNormalBoundary( 1473, 1474, 'values' ),
			false,
		);

		$expected_blocks = array(
			$blocks,
			$blocks,
			$blocks,
			$blocks,
		);

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that an assortment of blank lines in a list are ignored.
	 */
	public function test_blank_list_items() {
		$test_content = 'This is 22 characters.';

		$blocks = array(
			$this->generateListData( "<li></li><li></li><li><li></li><li>$test_content</li></li><li></li><li>$test_content</li>" ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( "- $test_content\n- $test_content" ),
			array( false ),
			array( $blocks )
		);
	}

	/**
	 * Test that a simple quote block renders correctly.
	 */
	public function test_simple_quote() {
		$test_quote       = '“You miss 100% of the shots you don’t take” – Wayne Gretzky – Michael Scott';
		$test_attribution = 'Gary Pendergast';

		$blocks = array(
			$this->generateQuoteData( $test_quote, $test_attribution ),
		);
		$this->assertTweetGenerated(
			$blocks,
			array( "“{$test_quote}” – $test_attribution" ),
			array( false ),
			array( $blocks )
		);
	}
}
