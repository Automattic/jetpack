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
	 * @param string $text     The text of the generated tweet.
	 * @param array  $blocks   An array of blocks that should be defined in the tweet.
	 * @param array  $boundary The boundary data that the tweet should contain.
	 * @param array  $tweet    A single tweet returned from the parser.
	 */
	public function assertTweetContains( $text, $blocks, $boundary, $tweet ) {
		$this->assertEquals( $text, $tweet['text'] );

		$block_count = count( $blocks );

		$this->assertEquals( $block_count, count( $tweet['blocks'] ) );

		for ( $ii = 0; $ii < $block_count; $ii++ ) {
			$this->assertArrayNotHasKey( 'block', $tweet['blocks'][ $ii ] );
			$this->assertEquals( $blocks[ $ii ]['clientId'], $tweet['blocks'][ $ii ]['clientId'] );
			$this->assertEquals( $blocks[ $ii ]['attributes'], $tweet['blocks'][ $ii ]['attributes'] );
		}

		$this->assertEquals( $boundary, $tweet['boundary'] );
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains( $test_content, $blocks, false, $tweets[0] );
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			"$test_content\n\n$test_content\n\n$test_content",
			$blocks,
			false,
			$tweets[0]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( str_repeat( $test_content, 12 ) ),
			$blocks,
			$this->generateNormalBoundary( 275, 276, 'content' ),
			$tweets[0]
		);

		$this->assertTweetContains( trim( $test_content ), $blocks, false, $tweets[1] );
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( str_repeat( $test_content, 12 ) ),
			array( $blocks[0] ),
			$this->generateNormalBoundary( 275, 276, 'content' ),
			$tweets[0]
		);

		$this->assertTweetContains(
			trim( $test_content ) . "\n\n" . trim( $test_content ),
			$blocks,
			false,
			$tweets[1]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( $test_content ),
			array( $blocks[0] ),
			false,
			$tweets[0]
		);

		$this->assertTweetContains(
			trim( str_repeat( $test_content, 12 ) ),
			array( $blocks[1] ),
			$this->generateNormalBoundary( 275, 276, 'content' ),
			$tweets[1]
		);

		$this->assertTweetContains(
			trim( $test_content ),
			array( $blocks[1] ),
			false,
			$tweets[2]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			str_repeat( $test_content, 12 ) . 'This is 22…',
			$blocks,
			$this->generateNormalBoundary( 274, 275, 'content' ),
			$tweets[0]
		);

		$this->assertTweetContains(
			'…characters',
			$blocks,
			false,
			$tweets[1]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			str_repeat( $test_content, 12 ) . 'This is 22…',
			$blocks,
			$this->generateNormalBoundary( 274, 275, 'content' ),
			$tweets[0]
		);

		$this->assertTweetContains(
			trim( '…characters. ' . str_repeat( $short_sentence, 11 ) ),
			$blocks,
			$this->generateNormalBoundary( 539, 540, 'content' ),
			$tweets[1]
		);

		$this->assertTweetContains(
			trim( str_repeat( $short_sentence, 2 ) ),
			$blocks,
			false,
			$tweets[2]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( $test_paragraph ),
			array( $blocks[0] ),
			false,
			$tweets[0]
		);

		$this->assertTweetContains(
			str_repeat( $test_sentence_chunk, 12 ) . 'This is 22…',
			array( $blocks[1] ),
			$this->generateNormalBoundary( 274, 275, 'content' ),
			$tweets[1]
		);

		$this->assertTweetContains(
			'…characters',
			array( $blocks[1] ),
			false,
			$tweets[2]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( str_repeat( "- $test_content\n", 11 ) ),
			$blocks,
			$this->generateLineBoundary( 10, 'values' ),
			$tweets[0]
		);

		$this->assertTweetContains(
			"- $test_content",
			$blocks,
			false,
			$tweets[1]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			$test_content,
			array( $blocks[0] ),
			false,
			$tweets[0]
		);

		$this->assertTweetContains(
			trim( str_repeat( "- $test_content\n", 11 ) ),
			array( $blocks[1] ),
			$this->generateLineBoundary( 10, 'values' ),
			$tweets[1]
		);

		$this->assertTweetContains(
			"- $test_content",
			array( $blocks[1] ),
			false,
			$tweets[2]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( str_repeat( $test_content, 18 ) ) . ' 🙂 🏳️‍🌈 👩‍👩‍👧‍👧…',
			$blocks,
			$this->generateNormalBoundary( 705, 706, 'content' ),
			$tweets[0]
		);

		$this->assertTweetContains(
			'…👨🏾‍🦰 👩🏻‍💻',
			$blocks,
			false,
			$tweets[1]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			trim( str_repeat( '- ' . trim( $test_content ) . "\n", 2 ) ),
			$blocks,
			$this->generateLineBoundary( 1, 'values' ),
			$tweets[0]
		);

		$this->assertTweetContains(
			'- ' . trim( str_repeat( $test_content, 18 ) ) . ' 🙂 🏳️‍🌈…',
			$blocks,
			$this->generateNormalBoundary( 769, 770, 'values' ),
			$tweets[1]
		);

		$this->assertTweetContains(
			'…👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ' . trim( str_repeat( $test_content, 17 ) ) . ' 🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰…',
			$blocks,
			$this->generateNormalBoundary( 1473, 1474, 'values' ),
			$tweets[2]
		);

		$this->assertTweetContains(
			'…👩🏻‍💻 ' . trim( str_repeat( $test_content, 13 ) ),
			$blocks,
			false,
			$tweets[3]
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

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertTweetContains(
			"- $test_content\n- $test_content",
			$blocks,
			false,
			$tweets[0]
		);
	}
}
