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
	 * that the parser expects to receive for a paragraph block.
	 *
	 * @param string $text The paragraph text.
	 * @return array The paragraph blob of data.
	 */
	public function generateParagraphData( $text ) {
		$text = str_replace( "\n", '<br>', $text );
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
	 * Helper function. Given a string of text, it will generate the blob of data
	 * that the parser expects to receive for a heading block.
	 *
	 * @param string $text The heading text.
	 * @return array The heading blob of data.
	 */
	public function generateHeadingData( $text ) {
		return array(
			'attributes' => array(
				'content' => $text,
			),
			'block'      => array(
				'blockName' => 'core/heading',
				'innerHTML' => "<h2>$text</h2>",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Given a quote and attribution, it will generate the blob of data
	 * that the parser expects to receive for a quote block.
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
	 * that the parser expects to receive for a list block.
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
	 * Helper function. Given a URL, it will generate the blob of data
	 * that the parser expects to receive for an image block.
	 *
	 * @param string $url The image URL.
	 * @param string $alt The image alt text.
	 * @return array The image blob of data.
	 */
	public function generateImageData( $url, $alt ) {
		return array(
			'attributes' => array(
				'url' => $url,
				'alt' => $alt,
			),
			'block'      => array(
				'blockName' => 'core/image',
				'innerHTML' => "<figure><img src='$url' alt='$alt'/></figure>",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Given an array of image URLs and alt text, it will generate the
	 * blob of data that the parser expects to receive for a gallery block.
	 *
	 * @param array $images {
	 *     An array of images to include in the gallery.
	 *
	 *     @type string $url The image URL.
	 *     @type string $alt The image alt text.
	 * }
	 * @return array The gallery blob of data.
	 */
	public function generateGalleryData( $images ) {
		return array(
			'attributes' => array(
				'images' => $images,
			),
			'block'      => array(
				'blockName' => 'core/image',
				'innerHTML' => '<figure><ul>' . array_reduce(
					$images,
					function ( $image_string, $image ) {
						return "$image_string<li><figure><img src='{$image['url']}' alt='{$image['alt']}'/></li></figure>";
					},
					''
				) . '</ul></figure>',
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
	 * @param string|array $content {
	 *     The content of the tweet. Passing a string is the equivalent of passing
	 *     an array with the `text` parameter set.
	 *
	 *     @type string $text  Optional. The text of the tweet.
	 *     @type array  $media Optional. Array of media that will be used for media attachments.
	 *     @type string $embed Optional. URL of a tweet to be quoted, or page to be embedded.
	 * }
	 * @param array        $blocks      An array of blocks that should be defined in the tweet.
	 * @param array        $boundary    The boundary data that the tweet should contain.
	 * @param array        $tweet       A single tweet returned from the parser.
	 * @param bool         $editor_info Flag whether or not editor-related info should be in the tweet.
	 */
	public function assertTweetContains( $content, $blocks, $boundary, $tweet, $editor_info ) {
		if ( is_string( $content ) ) {
			$content = array(
				'text' => $content,
			);
		}

		$content = wp_parse_args(
			$content,
			array(
				'text'  => '',
				'media' => array(),
				'embed' => '',
			)
		);

		$this->assertEquals( $content['text'], $tweet['text'] );
		$this->assertEquals( $content['media'], $tweet['media'] );

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
	 * @param array $content {
	 *     An array of content matching the generated tweets. Each element can be a string, which is
	 *     the equivalent of passing an array with the `text` parameter set.
	 *
	 *     @type string $text  Optional. The text of the tweet.
	 *     @type array  $media Optional. Array of media that will be used for media attachments.
	 *     @type string $embed Optional. URL of a tweet to be quoted, or page to be embedded.
	 * }
	 * @param array $boundaries   The boundary data that each tweet should contain.
	 * @param array $tweet_blocks An array of arrays: each child array should be the blocks used
	 *                            to generate each tweet.
	 */
	public function assertTweetGenerated( $blocks, $content, $boundaries, $tweet_blocks ) {
		$tweets      = Jetpack_Tweetstorm_Helper::parse( $blocks );
		$tweet_count = count( $tweets );

		$this->assertEquals( $tweet_count, count( $content ) );
		$this->assertEquals( $tweet_count, count( $boundaries ) );
		$this->assertEquals( $tweet_count, count( $tweet_blocks ) );

		for ( $ii = 0; $ii < $tweet_count; $ii++ ) {
			$this->assertTweetContains( $content[ $ii ], $tweet_blocks[ $ii ], $boundaries[ $ii ], $tweets[ $ii ], true );
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

		$this->assertEquals( $tweet_count, count( $content ) );
		$this->assertEquals( $tweet_count, count( $boundaries ) );
		$this->assertEquals( $tweet_count, count( $tweet_blocks ) );

		for ( $ii = 0; $ii < $tweet_count; $ii++ ) {
			$this->assertTweetContains( $content[ $ii ], $tweet_blocks[ $ii ], $boundaries[ $ii ], $tweets[ $ii ], false );
		}

	}

	/**
	 * Test that sending no blocks gives no tweets.
	 */
	public function test_no_blocks_no_tweets() {
		$this->assertTweetGenerated( array(), array(), array(), array() );
	}

	/**
	 * Test that sending empty blocks gives no tweets.
	 */
	public function test_no_content_no_tweets() {
		$blocks = array(
			$this->generateParagraphData( '' ),
			$this->generateHeadingData( '' ),
			$this->generateListData( '<li></li>' ),
			$this->generateQuoteData( '', '' ),
		);

		$this->assertTweetGenerated( $blocks, array(), array(), array() );
	}

	/**
	 * Test that an unsupported block gives no tweets.
	 */
	public function test_unsupported_block_no_tweets() {
		$blocks = array(
			array(
				'attributes' => array(
					'feedURL' => 'https://wordpress.org/news/feed/',
				),
				'block'      => array(
					'blockName' => 'core/rss',
					'innerHTML' => '',
				),
				'clientId'   => wp_generate_uuid4(),
			),
		);

		$this->assertTweetGenerated( $blocks, array(), array(), array() );
	}

	/**
	 * Test that a block which relies on innerHTML for the content won't
	 * generate a tweet if they don't have innerHTML set.
	 */
	public function test_no_innerhtml_no_tweets() {
		$blocks = array(
			array(
				'attributes' => array(
					'content' => null,
				),
				'block'      => array(
					'blockName' => 'core/paragraph',
				),
				'clientId'   => wp_generate_uuid4(),
			),
		);

		$this->assertTweetGenerated( $blocks, array(), array(), array() );
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
	 * Test that a single long paragraph is split into two tweets, breaking at the end of a sentence.
	 */
	public function test_line_break_is_preserved() {
		$test_content = "First line.\nsecond line.";
		$blocks       = array(
			$this->generateParagraphData( $test_content ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( $test_content ),
			array( false ),
			array( $blocks )
		);
	}

	/**
	 * Test that a single long paragraph containing multibyte characters is split into two tweets,
	 * breaking at the end of a sentence.
	 */
	public function test_single_long_multibyte_paragraph() {
		$test_content = 'ℌ𝔢𝔯𝔢 𝔦𝔰 𝔰𝔬𝔪𝔢 𝔱𝔢𝔵𝔱. ';
		$blocks       = array(
			$this->generateParagraphData( str_repeat( $test_content, 18 ) ),
		);

		$expected_text = array(
			trim( str_repeat( $test_content, 8 ) ),
			trim( str_repeat( $test_content, 8 ) ),
			trim( str_repeat( $test_content, 2 ) ),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 255, 256, 'content' ),
			$this->generateNormalBoundary( 511, 512, 'content' ),
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
	 * Test that a long sentence will start in the next tweet when it's too long.
	 */
	public function test_short_sentence_followed_by_a_long_sentence() {
		$test_content   = 'This is 22 characters ';
		$short_sentence = 'This is 23 characters. ';
		$blocks         = array(
			$this->generateParagraphData( $short_sentence . trim( str_repeat( $test_content, 13 ) ) . '.' ),
		);

		$expected_text = array(
			trim( $short_sentence ),
			trim( str_repeat( $test_content, 12 ) . 'This is 22…' ),
			'…characters.',
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 22, 23, 'content' ),
			$this->generateNormalBoundary( 297, 298, 'content' ),
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

	/**
	 * Test that a heading will start a new block.
	 */
	public function test_heading() {
		$test_content = 'Here is some text.';
		$test_heading = 'This is more text!';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateHeadingData( $test_heading ),
		);

		$expected_text = array(
			$test_content,
			$test_heading,
		);

		$expected_boundaries = array(
			false,
			false,
		);

		$expected_blocks = array(
			array( $blocks[0] ),
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
	 * Test that an image block will be appended to the previous tweet.
	 */
	public function test_image_is_appended() {
		$test_content = 'That selfie lyfe';
		$test_url     = 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg';
		$test_alt     = 'This is how we roll.';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateImageData( $test_url, $test_alt ),
		);

		$expected_content = array(
			array(
				'text'  => $test_content,
				'media' => array(
					array(
						'url' => $test_url,
						'alt' => $test_alt,
					),
				),
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that an image block will be appended to the previous tweet, but then a gallery and
	 * second image won't be appended.
	 */
	public function test_gallery_and_second_image_are_not_appended() {
		$test_content = 'That selfie lyfe';
		$test_images  = array(
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt' => 'This is how we roll.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt' => 'Like a boss.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2020/02/wp-1582952469369.jpg',
				'alt' => 'Is this really a selfie?',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt' => 'Keeping up with pop culture.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt' => 'Why does the raccoon miss out?! 😢',
			),
		);

		$blocks = array(
			$this->generateListData( "<li>$test_content</li>" ),
			$this->generateImageData( $test_images[0]['url'], $test_images[0]['alt'] ),
			$this->generateGalleryData( array_slice( $test_images, 2, 3 ) ),
			$this->generateImageData( $test_images[1]['url'], $test_images[1]['alt'] ),
		);

		$expected_content = array(
			array(
				'text'  => "- $test_content",
				'media' => array(
					array(
						'url' => $test_images[0]['url'],
						'alt' => $test_images[0]['alt'],
					),
				),
			),
			array(
				'media' => array_slice( $test_images, 2, 3 ),
			),
			array(
				'media' => array(
					array(
						'url' => $test_images[1]['url'],
						'alt' => $test_images[1]['alt'],
					),
				),
			),
		);

		$expected_boundaries = array( false, false, false );

		$expected_blocks = array(
			array_slice( $blocks, 0, 2 ),
			array_slice( $blocks, 2, 1 ),
			array_slice( $blocks, 3, 1 ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that an image block will not be appended to the previous tweet when the previous tweet text
	 * takes up too many characters to allow the image to fit inside Twitter's limits.
	 */
	public function test_image_following_long_paragraph_is_not_appended() {
		$test_content = trim( str_repeat( 'That selfie lyfe. ', 15 ) );
		$test_url     = 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg';
		$test_alt     = 'This is how we roll.';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateImageData( $test_url, $test_alt ),
		);

		$expected_content = array(
			$test_content,
			array(
				'media' => array(
					array(
						'url' => $test_url,
						'alt' => $test_alt,
					),
				),
			),
		);

		$expected_boundaries = array( false, false );

		$expected_blocks = array(
			array_slice( $blocks, 0, 1 ),
			array_slice( $blocks, 1, 1 ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a gallery block will be appended to the previous tweet.
	 */
	public function test_gallery_is_appended() {
		$test_content = 'That selfie lyfe';
		$test_images  = array(
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt' => 'This is how we roll.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt' => 'Like a boss.',
			),
		);

		$blocks = array(
			$this->generateListData( "<li>$test_content</li>" ),
			$this->generateGalleryData( $test_images ),
		);

		$expected_content = array(
			array(
				'text'  => "- $test_content",
				'media' => $test_images,
			),
		);

		$expected_boundaries = array( false );

		$expected_blocks = array( $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a gallery block with too many images will be trimmed down to 4.
	 */
	public function test_long_gallery_is_trimmed() {
		$test_images = array(
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt' => 'This is how we roll.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt' => 'Like a boss.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2020/02/wp-1582952469369.jpg',
				'alt' => 'Is this really a selfie?',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt' => 'Keeping up with pop culture.',
			),
			array(
				'url' => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt' => 'Why does the raccoon miss out?! 😢',
			),
		);

		$blocks = array(
			$this->generateGalleryData( $test_images ),
		);

		$expected_content = array(
			array(
				'media' => array_slice( $test_images, 0, 4 ),
			),
		);

		$expected_boundaries = array( false );

		$expected_blocks = array( $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}
}
