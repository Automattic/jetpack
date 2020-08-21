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
		$paragraph    = array(
			'attributes' => array(
				'content' => $test_content,
			),
			'clientId'   => wp_generate_uuid4(),
			'name'       => 'core/paragraph',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( array( $paragraph ) );

		$this->assertEquals( $test_content, $tweets[0]['text'] );
		$this->assertEquals( array( $paragraph ), $tweets[0]['blocks'] );
	}

	/**
	 * Test that multiple short paragraphs are joined together into one tweet.
	 */
	public function test_multiple_paragraphs() {
		$test_content = 'This is some content.';
		$paragraph    = array(
			'attributes' => array(
				'content' => $test_content,
			),
			'name'       => 'core/paragraph',
		);

		$paragraphs = array( $paragraph, $paragraph, $paragraph );

		$paragraphs[0]['clientId'] = wp_generate_uuid4();
		$paragraphs[1]['clientId'] = wp_generate_uuid4();
		$paragraphs[2]['clientId'] = wp_generate_uuid4();

		$tweets = Jetpack_Tweetstorm_Helper::parse( $paragraphs );

		$this->assertEquals( "$test_content\n\n$test_content\n\n$test_content", $tweets[0]['text'] );
		$this->assertEquals( $paragraphs, $tweets[0]['blocks'] );
	}

	/**
	 * Test that a single long paragraph is split into two tweets, breaking at the end of a sentence.
	 */
	public function test_single_long_paragraph() {
		$test_content = 'This is 23 characters. ';
		$paragraph    = array(
			'attributes' => array(
				'content' => str_repeat( $test_content, 13 ),
			),
			'clientId'   => wp_generate_uuid4(),
			'name'       => 'core/paragraph',
		);

		$expected_boundary = array(
			'start'     => 275,
			'end'       => 276,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( array( $paragraph ) );

		$this->assertEquals( trim( str_repeat( $test_content, 12 ) ), $tweets[0]['text'] );
		$this->assertEquals( trim( $test_content ), $tweets[1]['text'] );

		$this->assertEquals( array( $paragraph ), $tweets[0]['blocks'] );
		$this->assertEquals( array( $paragraph ), $tweets[1]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[0]['boundary'] );
	}

	/**
	 * Test that, after a long paragraph is split into two tweets, a subsequent short
	 * paragraph is appended to the second tweet.
	 */
	public function test_long_paragraph_followed_by_short_paragraph() {
		$test_content = 'This is 23 characters. ';

		$paragraphs = array(
			array(
				'attributes' => array(
					'content' => str_repeat( $test_content, 13 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
			array(
				'attributes' => array(
					'content' => $test_content,
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
		);

		$expected_boundary = array(
			'start'     => 275,
			'end'       => 276,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $paragraphs );

		$this->assertEquals( trim( str_repeat( $test_content, 12 ) ), $tweets[0]['text'] );
		$this->assertEquals( trim( $test_content ) . "\n\n" . trim( $test_content ), $tweets[1]['text'] );

		$this->assertEquals( array( $paragraphs[0] ), $tweets[0]['blocks'] );
		$this->assertEquals( $paragraphs, $tweets[1]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[0]['boundary'] );
	}

	/**
	 * Test that a long paragraph will start a new tweet if it's too long to append to the previous tweet.
	 */
	public function test_short_paragraph_followed_by_long_paragraph() {
		$test_content = 'This is 23 characters. ';

		$paragraphs = array(
			array(
				'attributes' => array(
					'content' => $test_content,
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
			array(
				'attributes' => array(
					'content' => str_repeat( $test_content, 13 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
		);

		$expected_boundary = array(
			'start'     => 275,
			'end'       => 276,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $paragraphs );

		$this->assertEquals( trim( $test_content ), $tweets[0]['text'] );
		$this->assertEquals( trim( str_repeat( $test_content, 12 ) ), $tweets[1]['text'] );
		$this->assertEquals( trim( $test_content ), $tweets[2]['text'] );

		$this->assertEquals( array( $paragraphs[0] ), $tweets[0]['blocks'] );
		$this->assertEquals( array( $paragraphs[1] ), $tweets[1]['blocks'] );
		$this->assertEquals( array( $paragraphs[1] ), $tweets[2]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[1]['boundary'] );
	}

	/**
	 * Test that a sentence which is too long for a single tweet is split into two tweets, at a word break.
	 */
	public function test_long_sentence() {
		$test_content = 'This is 22 characters ';

		$blocks = array(
			array(
				'attributes' => array(
					'content' => str_repeat( $test_content, 13 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
		);

		$expected_boundary = array(
			'start'     => 274,
			'end'       => 275,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( str_repeat( $test_content, 12 ) . 'This is 22…', $tweets[0]['text'] );
		$this->assertEquals( '…characters', $tweets[1]['text'] );

		$this->assertEquals( $blocks, $tweets[0]['blocks'] );
		$this->assertEquals( $blocks, $tweets[1]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[0]['boundary'] );
	}

	/**
	 * Test that short sentences are split up correctly when they're following a long sentence
	 * which has been split into two tweets.
	 */
	public function test_long_sentence_followed_by_short_sentences() {
		$test_content   = 'This is 22 characters ';
		$short_sentence = 'This is 23 characters. ';

		$blocks = array(
			array(
				'attributes' => array(
					'content' => trim( str_repeat( $test_content, 13 ) ) . '. ' . str_repeat( $short_sentence, 13 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
		);

		$first_expected_boundary = array(
			'start'     => 274,
			'end'       => 275,
			'container' => 'content',
			'type'      => 'normal',
		);

		$second_expected_boundary = array(
			'start'     => 539,
			'end'       => 540,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( str_repeat( $test_content, 12 ) . 'This is 22…', $tweets[0]['text'] );
		$this->assertEquals( trim( '…characters. ' . str_repeat( $short_sentence, 11 ) ), $tweets[1]['text'] );
		$this->assertEquals( trim( str_repeat( $short_sentence, 2 ) ), $tweets[2]['text'] );

		$this->assertEquals( $blocks, $tweets[0]['blocks'] );
		$this->assertEquals( $blocks, $tweets[1]['blocks'] );
		$this->assertEquals( $blocks, $tweets[2]['blocks'] );

		$this->assertEquals( $first_expected_boundary, $tweets[0]['boundary'] );
		$this->assertEquals( $second_expected_boundary, $tweets[1]['boundary'] );
	}

	/**
	 * Test that a long sentence will start a new tweet when it's too long to append to the previous tweet.
	 */
	public function test_short_paragraph_followed_by_long_sentence() {
		$test_paragraph      = 'This is 23 characters. ';
		$test_sentence_chunk = 'This is 22 characters ';

		$blocks = array(
			array(
				'attributes' => array(
					'content' => $test_paragraph,
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
			array(
				'attributes' => array(
					'content' => str_repeat( $test_sentence_chunk, 13 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
		);

		$expected_boundary = array(
			'start'     => 274,
			'end'       => 275,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( trim( $test_paragraph ), $tweets[0]['text'] );
		$this->assertEquals( str_repeat( $test_sentence_chunk, 12 ) . 'This is 22…', $tweets[1]['text'] );
		$this->assertEquals( '…characters', $tweets[2]['text'] );

		$this->assertEquals( array( $blocks[0] ), $tweets[0]['blocks'] );
		$this->assertEquals( array( $blocks[1] ), $tweets[1]['blocks'] );
		$this->assertEquals( array( $blocks[1] ), $tweets[2]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[1]['boundary'] );
	}

	/**
	 * Test that a list which is too long for a single tweet is split at the end of a list line.
	 */
	public function test_long_list() {
		$test_content = 'This is 22 characters.';

		$blocks = array(
			array(
				'attributes' => array(
					'values' => str_repeat( "<li>$test_content</li>", 12 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/list',
			),
		);

		$expected_boundary = array(
			'line'      => 10,
			'container' => 'values',
			'type'      => 'end-of-line',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( trim( str_repeat( "- $test_content\n", 11 ) ), $tweets[0]['text'] );
		$this->assertEquals( "- $test_content", $tweets[1]['text'] );

		$this->assertEquals( $blocks, $tweets[0]['blocks'] );
		$this->assertEquals( $blocks, $tweets[1]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[0]['boundary'] );
	}

	/**
	 * Test that a long list will start a new tweet when it's too long to be appended to the previous
	 * tweet, even if some of the lines in the list would fit.
	 */
	public function test_short_paragraph_followed_by_long_list() {
		$test_content = 'This is 22 characters.';

		$blocks = array(
			array(
				'attributes' => array(
					'content' => $test_content,
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
			array(
				'attributes' => array(
					'values' => str_repeat( "<li>$test_content</li>", 12 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/list',
			),
		);

		$expected_boundary = array(
			'line'      => 10,
			'container' => 'values',
			'type'      => 'end-of-line',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( $test_content, $tweets[0]['text'] );
		$this->assertEquals( trim( str_repeat( "- $test_content\n", 11 ) ), $tweets[1]['text'] );
		$this->assertEquals( "- $test_content", $tweets[2]['text'] );

		$this->assertEquals( array( $blocks[0] ), $tweets[0]['blocks'] );
		$this->assertEquals( array( $blocks[1] ), $tweets[1]['blocks'] );
		$this->assertEquals( array( $blocks[1] ), $tweets[2]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[1]['boundary'] );
	}

	/**
	 * Test that a range of emoji (including a variety of compound emoji) count as two characters.
	 */
	public function test_emoji_count_as_two_characters() {
		$test_content = '🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ';

		$blocks = array(
			array(
				'attributes' => array(
					'content' => str_repeat( $test_content, 19 ),
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/paragraph',
			),
		);

		$expected_boundary = array(
			'start'     => 705,
			'end'       => 706,
			'container' => 'content',
			'type'      => 'normal',
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( trim( str_repeat( $test_content, 18 ) ) . ' 🙂 🏳️‍🌈 👩‍👩‍👧‍👧…', $tweets[0]['text'] );
		$this->assertEquals( '…👨🏾‍🦰 👩🏻‍💻', $tweets[1]['text'] );

		$this->assertEquals( $blocks, $tweets[0]['blocks'] );
		$this->assertEquals( $blocks, $tweets[1]['blocks'] );

		$this->assertEquals( $expected_boundary, $tweets[0]['boundary'] );
	}

	/**
	 * Test that a boundary will be set at the end of the short items, and correct
	 * boundaries will be set inside the long item.
	 */
	public function test_short_list_items_followed_by_long_list_item() {
		$test_content = '🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ';

		$blocks = array(
			array(
				'attributes' => array(
					'values' => str_repeat( '<li>' . trim( $test_content ) . '</li>', 2 )
						. '<li>' . trim( str_repeat( $test_content, 50 ) ) . '</li>',
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/list',
			),
		);

		$expected_boundaries = array(
			array(
				'line'      => 1,
				'container' => 'values',
				'type'      => 'end-of-line',
			),
			array(
				'start'     => 769,
				'end'       => 770,
				'container' => 'values',
				'type'      => 'normal',
			),
			array(
				'start'     => 1473,
				'end'       => 1474,
				'container' => 'values',
				'type'      => 'normal',
			),
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( trim( str_repeat( '- ' . trim( $test_content ) . "\n", 2 ) ), $tweets[0]['text'] );
		$this->assertEquals( '- ' . trim( str_repeat( $test_content, 18 ) ) . ' 🙂 🏳️‍🌈…', $tweets[1]['text'] );
		$this->assertEquals( '…👩‍👩‍👧‍👧 👨🏾‍🦰 👩🏻‍💻 ' . trim( str_repeat( $test_content, 17 ) ) . ' 🙂 🏳️‍🌈 👩‍👩‍👧‍👧 👨🏾‍🦰…', $tweets[2]['text'] );
		$this->assertEquals( '…👩🏻‍💻 ' . trim( str_repeat( $test_content, 13 ) ), $tweets[3]['text'] );

		$this->assertEquals( $blocks, $tweets[0]['blocks'] );
		$this->assertEquals( $blocks, $tweets[1]['blocks'] );
		$this->assertEquals( $blocks, $tweets[2]['blocks'] );
		$this->assertEquals( $blocks, $tweets[3]['blocks'] );

		$this->assertEquals( $expected_boundaries[0], $tweets[0]['boundary'] );
		$this->assertEquals( $expected_boundaries[1], $tweets[1]['boundary'] );
		$this->assertEquals( $expected_boundaries[2], $tweets[2]['boundary'] );
	}

	/**
	 * Test that an assortment of blank lines in a list are ignored.
	 */
	public function test_blank_list_items() {
		$test_content = 'This is 22 characters.';

		$blocks = array(
			array(
				'attributes' => array(
					'values' => "<li></li><li></li><li><li></li><li>$test_content</li></li><li></li><li>$test_content</li>",
				),
				'clientId'   => wp_generate_uuid4(),
				'name'       => 'core/list',
			),
		);

		$tweets = Jetpack_Tweetstorm_Helper::parse( $blocks );

		$this->assertEquals( "- $test_content\n- $test_content", $tweets[0]['text'] );

		$this->assertEquals( $blocks, $tweets[0]['blocks'] );
	}
}
