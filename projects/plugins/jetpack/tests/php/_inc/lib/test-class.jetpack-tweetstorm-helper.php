<?php
/**
 * Tweetstorm testing.
 *
 * @package automattic/jetpack
 */

/**
 * Class for Tweetstorm testing.
 */
class WP_Test_Jetpack_Tweetstorm_Helper extends WP_UnitTestCase {

	/**
	 * Setting up.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		Requests::$transport[ serialize( array() ) ] = 'Tweetstorm_Requests_Transport_Override';
	}

	/**
	 * Tearing down.
	 */
	public static function tear_down_after_class() {
		unset( Requests::$transport[ serialize( array() ) ] );

		parent::tear_down_after_class();
	}

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
				'innerHTML' => "\n<p>$text</p>\n",
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
				'innerHTML' => "\n<h2>$text</h2>\n",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Given a string of text, it will generate the blob of data
	 * that the parser expects to receive for a verse block.
	 *
	 * @param string $text The verse text.
	 * @return array The verse blob of data.
	 */
	public function generateVerseData( $text ) {
		return array(
			'attributes' => array(
				'content' => $text,
			),
			'block'      => array(
				'blockName' => 'core/verse',
				'innerHTML' => "<pre>$text</pre>",
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
	 * Helper function. Given a URL, it will generate the blob of data
	 * that the parser expects to receive for a video block.
	 *
	 * @param string $url The video URL.
	 * @return array The video blob of data.
	 */
	public function generateVideoData( $url ) {
		return array(
			'attributes' => array(
				'url' => $url,
			),
			'block'      => array(
				'blockName' => 'core/video',
				'innerHTML' => "<figure><video src='$url'/></figure>",
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Given a URL, it will generate the blob of data
	 * that the parser expects to receive for a VidePress video block.
	 *
	 * @param string $guid     The VideoPress video ID.
	 * @param string $filename The filename of the video.
	 * @return array The VideoPress blob of data.
	 */
	public function generateVideoPressData( $guid, $filename ) {
		return array(
			'attributes' => array(
				'guid' => $guid,
				'src'  => "https://videos.files.wordpress.com/$guid/$filename",
			),
			'block'      => array(
				'attrs'     => array(
					'guid' => $guid,
					'src'  => "https://videos.files.wordpress.com/$guid/$filename",
				),
				'blockName' => 'core/video',
				'innerHTML' => "<figure><div>\nhttps://videopress.com/v/$guid?preloadContent=metadata\n</div></figure>",
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
	 * Helper function. Generate the blob of data that the parser
	 * expects to receive for a spacer block.
	 *
	 * @return array The spacer blob of data.
	 */
	public function generateSpacerData() {
		return array(
			'attributes' => array(),
			'block'      => array(
				'blockName' => 'core/spacer',
				'innerHTML' => '<div />',
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Generate the blob of data that the parser
	 * expects to receive for a separator block.
	 *
	 * @return array The separator blob of data.
	 */
	public function generateSeparatorData() {
		return array(
			'attributes' => array(),
			'block'      => array(
				'blockName' => 'core/separator',
				'innerHTML' => '<hr />',
			),
			'clientId'   => wp_generate_uuid4(),
		);
	}

	/**
	 * Helper function. Generate the blob of data that the parser
	 * expects to receive for an embed block.
	 *
	 * @param string $provider The embed provider name.
	 * @param string $url      The url of the embed.
	 * @param bool   $classic  Deprecated. Whether to use the pre-WordPress 5.6 embed block format.
	 *
	 * @return array The embed blob of data.
	 */
	public function generateCoreEmbedData( $provider, $url, $classic = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return array(
				'attributes' => array(
					'providerNameSlug' => $provider,
					'url'              => $url,
				),
				'block'      => array(
					'attrs'     => array(
						'providerNameSlug' => $provider,
						'url'              => $url,
					),
					'blockName' => 'core/embed',
					'innerHTML' => '',
				),
				'clientId'   => wp_generate_uuid4(),
			);
	}

	/**
	 * Helper function. Generate the blob of data that the parser
	 * expects to receive for Jetpack GIF block.
	 *
	 * @param string $url The embed URL of the GIF.
	 *
	 * @return array The embedded tweet blob of data.
	 */
	public function generateJetpackGifData( $url ) {
		return array(
			'attributes' => array(
				'giphyUrl' => $url,
			),
			'block'      => array(
				'attrs'     => array(
					'giphyUrl' => $url,
				),
				'blockName' => 'jetpack/gif',
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
	 * Helper function. Generates a line break boundary marker.
	 *
	 * @param int    $start     The start position of the marker.
	 * @param int    $end       The end position of the marker.
	 * @param string $container The name of the RichText container this boundary is for.
	 * @return array The boundary marker definition.
	 */
	public function generateLineBreakBoundary( $start, $end, $container ) {
		return array(
			'start'     => $start,
			'end'       => $end,
			'container' => $container,
			'type'      => 'line-break',
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
	 *     @type string $tweet Optional. URL of a tweet to be quoted.
	 *     @type array  $urls  Optional. A list of URLs that appear in the tweet text.
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
				'tweet' => '',
				'urls'  => array(),
			)
		);

		$this->assertEquals( $content['text'], $tweet['text'] );
		$this->assertEquals( $content['media'], $tweet['media'] );
		$this->assertEquals( $content['tweet'], $tweet['tweet'] );
		$this->assertEquals( $content['urls'], $tweet['urls'] );

		if ( $editor_info ) {
			$block_count = count( $blocks );

			$this->assertCount( $block_count, $tweet['blocks'] );

			for ( $ii = 0; $ii < $block_count; $ii++ ) {
				$this->assertCount( 2, $tweet['blocks'][ $ii ] );
				$this->assertEquals( $blocks[ $ii ]['clientId'], $tweet['blocks'][ $ii ]['clientId'] );
				$this->assertEquals( $blocks[ $ii ]['attributes'], $tweet['blocks'][ $ii ]['attributes'] );
			}

			$this->assertEquals( $boundary, $tweet['boundary'] );
		} else {
			$this->assertEquals( array(), $tweet['blocks'] );
			$this->assertFalse( $tweet['boundary'] );
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
	 *     @type string $tweet Optional. URL of a tweet to be quoted.
	 *     @type array  $urls  Optional. A list of URLs that appear in the tweet text.
	 * }
	 * @param array $boundaries   The boundary data that each tweet should contain.
	 * @param array $tweet_blocks An array of arrays: each child array should be the blocks used
	 *                            to generate each tweet.
	 */
	public function assertTweetGenerated( $blocks, $content, $boundaries, $tweet_blocks ) {
		$tweets      = Jetpack_Tweetstorm_Helper::parse( $blocks );
		$tweet_count = count( $tweets );

		$this->assertCount( $tweet_count, $content );
		$this->assertCount( $tweet_count, $boundaries );
		$this->assertCount( $tweet_count, $tweet_blocks );

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

		$this->assertCount( $tweet_count, $content );
		$this->assertCount( $tweet_count, $boundaries );
		$this->assertCount( $tweet_count, $tweet_blocks );

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
			$this->generateHeadingData( '&nbsp;' ),
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
	 * Test that a single long paragraph is split into two tweets, breaking at the end of a line.
	 */
	public function test_single_long_paragraph_with_line_breaks() {
		$test_content = 'This is 21 characters';
		$blocks       = array(
			$this->generateParagraphData( str_repeat( "$test_content\n", 7 ) . trim( str_repeat( "$test_content ", 7 ) ) . '.' ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( trim( str_repeat( "$test_content\n", 7 ) ), trim( str_repeat( "$test_content ", 7 ) ) . '.' ),
			array( $this->generateLineBreakBoundary( 153, 154, 'content' ), false ),
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
	 * Test that other space characters will be used when splitting sentences up into words.
	 */
	public function test_long_sentence_with_nbsp() {
		$test_content = 'This&nbsp;is&nbsp;22&nbsp;characters&nbsp;';
		$blocks       = array(
			$this->generateParagraphData( str_repeat( $test_content, 13 ) ),
		);

		$expected_text = array(
			// The parser will decode the HTML entities.
			html_entity_decode( str_repeat( $test_content, 12 ) . 'This&nbsp;is&nbsp;22…', ENT_QUOTES ),
			html_entity_decode( '…characters', ENT_QUOTES ),
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
	 * Test that a basic verse maintains spacing.
	 */
	public function test_basic_verse() {
		$test_content = " They say that code \n        is poetry.\n\n    Is indentation poetry,\n  too?";

		$blocks = array(
			$this->generateVerseData( $test_content ),
		);

		$expected_text = array(
			" They say that code\n        is poetry.\n\n    Is indentation poetry,\n  too?",
		);

		$this->assertTweetGenerated( $blocks, $expected_text, array( false ), array( $blocks ) );
	}

	/**
	 * Test that a long verse splits correctly.
	 */
	public function test_long_verse() {
		$test_content = "They say that code\n        is poetry.\n\n    Is indentation poetry,\n  too?\n\n";

		$blocks = array(
			$this->generateVerseData( trim( str_repeat( $test_content, 4 ) ) ),
		);

		$expected_content = array(
			array(
				'text' => str_repeat( $test_content, 3 ) . "They say that code\n        is poetry.",
			),
			array(
				'text' => "Is indentation poetry,\n  too?",
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 264, 265, 'content' ),
			false,
		);

		$expected_blocks = array( $blocks, $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
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
	 * Test that inline images don't show up in the tweet.
	 */
	public function test_inline_images_dont_show_in_tweets() {
		$test_content = 'This is some text and an image, <img src="foo.jpg" />friend.';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
		);

		$expected_text = array(
			wp_strip_all_tags( $test_content ),
		);

		$expected_boundaries = array( false );

		$expected_blocks = array( $blocks );

		$this->assertTweetGenerated(
			$blocks,
			$expected_text,
			$expected_boundaries,
			$expected_blocks
		);
	}

	/**
	 * Test that inline images are accounted for when generating boundaries.
	 */
	public function test_inline_images_are_counted_for_boundaries() {
		$test_content = 'This is a sentence that takes up some space. ';

		$blocks = array(
			$this->generateParagraphData(
				trim( str_repeat( $test_content, 4 ) ) .
				// Test that the boundary doesn't appear on an image immediately after a period.
				'<img src="1.jpg" />' .
				// Test that a mid-sentence image is counted properly.
				' This is a <img src="2.jpg" />sentence that takes up some space. ' .
				// Test that the boundary doesn't appear on an image immediately before the next sentence.
				'<img src="3.jpg" />' .
				trim( $test_content ) .
				// Test that an image that replaces the space between sentences is handled.
				'<img src="4.jpg" />' .
				trim( str_repeat( $test_content, 4 ) )
			),
		);

		$expected_text = array(
			trim( str_repeat( $test_content, 3 ) ),
			// There's no space inserted when 4.jpg is removed.
			trim( str_repeat( $test_content, 3 ) ) . trim( str_repeat( $test_content, 3 ) ),
			trim( $test_content ),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 134, 135, 'content' ),
			$this->generateNormalBoundary( 407, 408, 'content' ),
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
	 * Test that a long quote block splits.
	 */
	public function test_long_quote() {
		$test_quote       = 'Here is a bunch of text for you. ';
		$test_attribution = 'Gary Pendergast';

		$blocks = array(
			$this->generateQuoteData( trim( str_repeat( $test_quote, 9 ) ), $test_attribution ),
		);

		$expected_content = array(
			array(
				'text' => '“' . trim( str_repeat( $test_quote, 8 ) ),
			),
			array(
				'text' => trim( $test_quote ) . "” – $test_attribution",
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 263, 264, 'value' ),
			false,
		);

		$expected_blocks = array( $blocks, $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a quote block with multiple paragraphs splits correctly.
	 */
	public function test_multi_paragraph_quote() {
		$test_quote       = 'Here is a bunch of text for you. ';
		$test_attribution = 'Gary Pendergast';

		$blocks = array(
			$this->generateQuoteData( trim( str_repeat( $test_quote, 4 ) ) . "\n" . trim( str_repeat( $test_quote, 4 ) ), $test_attribution ),
		);

		$expected_content = array(
			array(
				'text' => '“' . trim( str_repeat( $test_quote, 4 ) ) . "\n" . trim( str_repeat( $test_quote, 3 ) ),
			),
			array(
				'text' => trim( $test_quote ) . "” – $test_attribution",
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 230, 231, 'value' ),
			false,
		);

		$expected_blocks = array( $blocks, $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a quote attribution with sentences in it splits.
	 */
	public function test_quote_attribution_sentence_splits() {
		$test_quote       = 'Here is a bunch of text for you. ';
		$test_attribution = 'Ugh. That guy. You know.';

		$blocks = array(
			$this->generateQuoteData( trim( str_repeat( $test_quote, 8 ) ), $test_attribution ),
		);

		$expected_content = array(
			array(
				'text' => '“' . trim( str_repeat( $test_quote, 8 ) ) . '” – Ugh.',
			),
			array(
				'text' => 'That guy. You know.',
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 4, 5, 'citation' ),
			false,
		);

		$expected_blocks = array( $blocks, $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
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
						'url'  => $test_url,
						'alt'  => $test_alt,
						'type' => 'image/jpeg',
					),
				),
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that an image block with really long alt text will have the alt text removed.
	 */
	public function test_long_alt_is_removed() {
		$test_url = 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg';
		$test_alt = str_repeat( 'a', 1001 );

		$blocks = array(
			$this->generateImageData( $test_url, $test_alt ),
		);

		$expected_content = array(
			array(
				'media' => array(
					array(
						'url'  => $test_url,
						'alt'  => '',
						'type' => 'image/jpeg',
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
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'This is how we roll.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt'  => 'Like a boss.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2020/02/wp-1582952469369.jpg',
				'alt'  => 'Is this really a selfie?',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt'  => 'Keeping up with pop culture.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'Why does the raccoon miss out?! 😢',
				'type' => 'image/jpeg',
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
						'url'  => $test_images[0]['url'],
						'alt'  => $test_images[0]['alt'],
						'type' => $test_images[0]['type'],
					),
				),
			),
			array(
				'media' => array_slice( $test_images, 2, 3 ),
			),
			array(
				'media' => array(
					array(
						'url'  => $test_images[1]['url'],
						'alt'  => $test_images[1]['alt'],
						'type' => $test_images[0]['type'],
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
	 * Test that unsupported content types will not be added.
	 */
	public function test_unsupported_types_are_removed() {
		$test_content = "There's something fake in here....";
		$test_images  = array(
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'This is how we roll.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt'  => 'Like a boss.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2020/02/ms-selfie.docx',
				'alt'  => 'Is this really a selfie?',
				'type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt'  => 'Keeping up with pop culture.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'Why does the raccoon miss out?! 😢',
				'type' => 'image/jpeg',
			),
		);

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateGalleryData( $test_images ),
		);

		$expected_content = array(
			array(
				'text'  => "$test_content",
				'media' => array(
					$test_images[0],
					$test_images[1],
					$test_images[3],
					$test_images[4],
				),
			),
		);

		$expected_boundaries = array( false );

		$expected_blocks = array( $blocks );

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
						'url'  => $test_url,
						'alt'  => $test_alt,
						'type' => 'image/jpeg',
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
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'This is how we roll.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt'  => 'Like a boss.',
				'type' => 'image/jpeg',
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
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'This is how we roll.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt'  => 'Like a boss.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2020/02/wp-1582952469369.jpg',
				'alt'  => 'Is this really a selfie?',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt'  => 'Keeping up with pop culture.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'Why does the raccoon miss out?! 😢',
				'type' => 'image/jpeg',
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

	/**
	 * Test that a gallery block with a GIF as the first image is trimmed down to just that GIF.
	 */
	public function test_gallery_starting_with_gif_is_trimmed() {
		$test_images = array(
			array(
				'url'  => 'https://jetpackme.files.wordpress.com/2018/10/jetpack-site-accelerator-toggle-gif.gif',
				'alt'  => 'This is probably a GIF.',
				'type' => 'image/gif',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt'  => 'Like a boss.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2020/02/wp-1582952469369.jpg',
				'alt'  => 'Is this really a selfie?',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt'  => 'Keeping up with pop culture.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'Why does the raccoon miss out?! 😢',
				'type' => 'image/jpeg',
			),
		);

		$blocks = array(
			$this->generateGalleryData( $test_images ),
		);

		$expected_content = array(
			array(
				'media' => array_slice( $test_images, 0, 1 ),
			),
		);

		$expected_boundaries = array( false );

		$expected_blocks = array( $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );

	}
	/**
	 * Test that a gallery block with a GIF not as the first image has that GIF filtered out.
	 */
	public function test_gallery_with_gif_is_filtered() {
		$test_images = array(
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/01/IMG_20190101_175338.jpg',
				'alt'  => 'Like a boss.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2020/02/wp-1582952469369.jpg',
				'alt'  => 'Is this really a selfie?',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://jetpackme.files.wordpress.com/2018/10/jetpack-site-accelerator-toggle-gif.gif',
				'alt'  => 'This is probably a GIF.',
				'type' => 'image/gif',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190318_152120.jpg',
				'alt'  => 'Keeping up with pop culture.',
				'type' => 'image/jpeg',
			),
			array(
				'url'  => 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg',
				'alt'  => 'Why does the raccoon miss out?! 😢',
				'type' => 'image/jpeg',
			),
		);

		$blocks = array(
			$this->generateGalleryData( $test_images ),
		);

		$expected_content = array(
			array(
				'media' => array_merge( array_slice( $test_images, 0, 2 ), array_slice( $test_images, 3, 2 ) ),
			),
		);

		$expected_boundaries = array( false );

		$expected_blocks = array( $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a video block will be appended to the previous tweet.
	 */
	public function test_video_is_appended() {
		$test_content = 'KITTENS';
		$test_url     = 'https://pentophoto.files.wordpress.com/2012/10/chatty-kitten.mov';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateVideoData( $test_url ),
		);

		$expected_content = array(
			array(
				'text'  => $test_content,
				'media' => array(
					array(
						'url'  => $test_url,
						'type' => 'video/quicktime',
					),
				),
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that a VideoPress video block will be appended to the previous tweet.
	 */
	public function test_videopress_video_is_appended() {
		$test_content  = 'KITTENS';
		$test_guid     = 'mmQ4ecI6';
		$test_filename = 'chatty-kitten_dvd.mp4';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateVideoPressData( $test_guid, $test_filename ),
		);

		$expected_content = array(
			array(
				'text'  => $test_content,
				'media' => array(
					array(
						'url'  => "https://videos.files.wordpress.com/$test_guid/$test_filename",
						'type' => 'video/mp4',
					),
				),
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that a spacer block starts a new tweet.
	 */
	public function test_spacer_starts_new_tweet() {
		$test_content = 'This is some content.';
		$blocks       = array(
			$this->generateParagraphData( $test_content ),
			$this->generateSpacerData(),
			$this->generateParagraphData( $test_content ),
			$this->generateParagraphData( $test_content ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( "$test_content", "$test_content\n\n$test_content" ),
			array( false, false ),
			array( array_slice( $blocks, 0, 2 ), array_slice( $blocks, 2, 2 ) )
		);
	}

	/**
	 * Test that a separator block starts a new tweet.
	 */
	public function test_separator_starts_new_tweet() {
		$test_content = 'This is some content.';
		$blocks       = array(
			$this->generateParagraphData( $test_content ),
			$this->generateParagraphData( $test_content ),
			$this->generateSeparatorData(),
			$this->generateParagraphData( $test_content ),
		);

		$this->assertTweetGenerated(
			$blocks,
			array( "$test_content\n\n$test_content", "$test_content" ),
			array( false, false ),
			array( array_slice( $blocks, 0, 3 ), array_slice( $blocks, 3, 1 ) )
		);
	}

	/**
	 * Test that an embedded tweet block will be appended to the previous tweet.
	 */
	public function test_embedded_tweet_is_appended() {
		$test_content = 'As true today as it was then.';
		$test_url     = 'https://twitter.com/GaryPendergast/status/934003415507546112';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'twitter', $test_url, false ),
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'twitter', $test_url, true ),
		);

		$expected_content = array(
			array(
				'text'  => $test_content,
				'tweet' => $test_url,
			),
			array(
				'text'  => $test_content,
				'tweet' => $test_url,
			),
		);

		$expected_boundaries = array( false, false );

		$expected_blocks = array(
			array_slice( $blocks, 0, 2 ),
			array_slice( $blocks, 2, 2 ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that other embeds will be appended as URLs.
	 */
	public function test_youtube_embed_is_appended() {
		$test_content = 'The master.';
		$test_url     = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'youtube', $test_url, false ),
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'youtube', $test_url, true ),
		);

		$expected_content = array(
			array(
				'text' => "$test_content $test_url",
				'urls' => array( $test_url ),
			),
			array(
				'text' => "$test_content $test_url",
				'urls' => array( $test_url ),
			),
		);

		$expected_boundaries = array( false, false );

		$expected_blocks = array(
			array_slice( $blocks, 0, 2 ),
			array_slice( $blocks, 2, 2 ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that embeds which would make the tweet to long start a new tweet.
	 */
	public function test_embed_after_long_text_starts_new_tweet() {
		$test_content = trim( str_repeat( 'a. ', 90 ) );
		$test_url     = 'https://jetpack.com';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'wordpress', $test_url, false ),
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'wordpress', $test_url, true ),
		);

		$expected_content = array(
			array(
				'text' => $test_content,
			),
			array(
				'text' => $test_url,
				'urls' => array( $test_url ),
			),
			array(
				'text' => $test_content,
			),
			array(
				'text' => $test_url,
				'urls' => array( $test_url ),
			),
		);

		$expected_boundaries = array( false, false, false, false );

		$expected_blocks = array(
			array( $blocks[0] ),
			array( $blocks[1] ),
			array( $blocks[2] ),
			array( $blocks[3] ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that Jetpack GIF embeds will be appended as URLs, with the URL re-written correctly.
	 */
	public function test_jetpack_gif_is_appended() {
		$test_url     = 'https://giphy.com/embed/jTqfCm1C0BV5fFAYvT';
		$expected_url = 'https://giphy.com/gifs/jTqfCm1C0BV5fFAYvT';

		$blocks = array(
			$this->generateJetpackGifData( $test_url ),
		);

		$expected_content = array(
			array(
				'text' => $expected_url,
				'urls' => array( $expected_url ),
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that embeds will start a new tweet when the previous tweet already has URLs in it.
	 */
	public function test_embeds_start_new_tweet_after_links() {
		$test_url     = 'https://pento.net';
		$test_content = "The <a href='$test_url'>joker</a>.";
		$test_embed   = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'youtube', $test_embed, false ),
			$this->generateParagraphData( $test_content ),
			$this->generateCoreEmbedData( 'youtube', $test_embed, true ),
		);

		$expected_content = array(
			array(
				'text' => "The joker ($test_url).",
				'urls' => array( $test_url ),
			),
			array(
				'text' => $test_embed,
				'urls' => array( $test_embed ),
			),
			array(
				'text' => "The joker ($test_url).",
				'urls' => array( $test_url ),
			),
			array(
				'text' => $test_embed,
				'urls' => array( $test_embed ),
			),
		);

		$expected_boundaries = array( false, false, false, false );

		$expected_blocks = array(
			array( $blocks[0] ),
			array( $blocks[1] ),
			array( $blocks[2] ),
			array( $blocks[3] ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that link URLs are added to the tweet text.
	 */
	public function test_links_handled() {
		$test_urls = array(
			'https://jetpack.com',
			'https://WordPress.org/',
			'https://jetpack.com',
		);

		$test_content  = "This <a href='$test_urls[0]'>is</a> <a href='$test_urls[1]'>a</a> <a href='$test_urls[2]'>test</a>.";
		$expected_text = "This is ($test_urls[0]) a ($test_urls[1]) test ($test_urls[2]).";

		$blocks = array(
			$this->generateParagraphData( $test_content ),
		);

		$expected_content = array(
			array(
				'text' => $expected_text,
				'urls' => $test_urls,
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that unsupported URL formats in links are ignored.
	 */
	public function test_invalid_links_ignored() {
		$test_urls = array(
			'aaa' => 'mailto:foo@bar.com',
			'bbb' => 'ftp://foo.com',
		);

		$test_content = implode(
			' ',
			array_map(
				function ( $text, $url ) {
					return "<a href='$url'>$text</a>";
				},
				array_keys( $test_urls ),
				array_values( $test_urls )
			)
		);

		$expected_text = trim( implode( ' ', array_keys( $test_urls ) ) );

		$blocks = array(
			$this->generateParagraphData( $test_content ),
		);

		$expected_content = array(
			array(
				'text' => $expected_text,
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that long URLs don't cause text to break into multiple tweets.
	 */
	public function test_long_links_dont_break_a_paragraph_up() {
		$test_url = 'https://jetpack.com/' . str_repeat( 'a', 280 );

		$test_content  = "It's <a href='$test_url'>a celebration</a>!";
		$expected_text = "It's a celebration ($test_url)!";

		$blocks = array(
			$this->generateParagraphData( $test_content ),
		);

		$expected_content = array(
			array(
				'text' => $expected_text,
				'urls' => array( $test_url ),
			),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, array( false ), array( $blocks ) );
	}

	/**
	 * Test that URLs appearing before and after paragraph breaks are counted correctly.
	 */
	public function test_many_urls_in_a_long_paragraph() {
		$test_url = 'https://jetpack.com/';

		$test_content  = "This is <a href='$test_url'>some text</a> for testing. ";
		$expected_text = "This is some text ($test_url) for testing. ";

		$blocks = array(
			$this->generateParagraphData( trim( str_repeat( $test_content, 9 ) ) ),
		);

		$expected_content = array(
			array(
				'text' => trim( str_repeat( $expected_text, 4 ) ),
				'urls' => array_fill( 0, 4, $test_url ),
			),
			array(
				'text' => trim( str_repeat( $expected_text, 4 ) ),
				'urls' => array_fill( 0, 4, $test_url ),
			),
			array(
				'text' => trim( $expected_text ),
				'urls' => array( $test_url ),
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 123, 124, 'content' ),
			$this->generateNormalBoundary( 247, 248, 'content' ),
			false,
		);

		$expected_blocks = array_fill( 0, 3, $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that URLs appearing in long and varied lists are counted correctly.
	 */
	public function test_many_urls_in_different_list_items() {
		$test_url = 'https://jetpack.com/';

		$test_content  = "This is <a href='$test_url'>some text</a> for testing. ";
		$expected_text = "This is some text ($test_url) for testing. ";

		$blocks = array(
			$this->generateListData(
				'<li>' . trim( str_repeat( $test_content, 7 ) ) . '</li>' .
				'<li></li>' .
				'<li>' . trim( $test_content ) . '</li>' .
				'<li><ul><li></li>' .
				'<li>' . trim( $test_content ) . '</li>' .
				'<li></li></ul>' .
				'<li></li>' .
				'<li>' . trim( str_repeat( $test_content, 9 ) ) . '</li>'
			),
		);

		$expected_content = array(
			array(
				'text' => '- ' . trim( str_repeat( $expected_text, 4 ) ),
				'urls' => array_fill( 0, 4, $test_url ),
			),
			array(
				'text' => trim( str_repeat( $expected_text, 3 ) ) . "\n- " . trim( $expected_text ),
				'urls' => array_fill( 0, 4, $test_url ),
			),
			array(
				'text' => trim( "- $expected_text" ),
				'urls' => array( $test_url ),
			),
			array(
				'text' => '- ' . trim( str_repeat( $expected_text, 4 ) ),
				'urls' => array_fill( 0, 4, $test_url ),
			),
			array(
				'text' => trim( str_repeat( $expected_text, 4 ) ),
				'urls' => array_fill( 0, 4, $test_url ),
			),
			array(
				'text' => trim( $expected_text ),
				'urls' => array( $test_url ),
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 123, 124, 'values' ),
			$this->generateLineBoundary( 2, 'values' ),
			$this->generateLineBoundary( 5, 'values' ),
			$this->generateNormalBoundary( 407, 408, 'values' ),
			$this->generateNormalBoundary( 531, 532, 'values' ),
			false,
		);

		$expected_blocks = array_fill( 0, 6, $blocks );

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a tweet that's nearly filled with miscellaneous characters that count for 2 characters
	 * will cause an image block to start a new tweet.
	 */
	public function test_nearly_full_tweet_followed_by_image() {
		$test_content = str_repeat( '†', 135 );
		$test_url     = 'https://pentophoto.files.wordpress.com/2019/03/mvimg_20190317_1915122.jpg';
		$test_alt     = 'This is how we roll.';

		$blocks = array(
			$this->generateParagraphData( $test_content ),
			$this->generateImageData( $test_url, $test_alt ),
		);

		$expected_content = array(
			array(
				'text' => $test_content,
			),
			array(
				'media' => array(
					array(
						'url'  => $test_url,
						'alt'  => $test_alt,
						'type' => 'image/jpeg',
					),
				),
			),
		);

		$expected_boundaries = array( false, false );

		$expected_blocks = array(
			array( $blocks[0] ),
			array( $blocks[1] ),
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * All URLs count for 24 characters, regardless of their actual length. We need to ensure URLs
	 * that have been typed into text (but aren't necessarily linked) are counted correctly.
	 */
	public function test_text_urls_are_counted_correctly() {
		$test_content = 'https://jetpack.com https://Jetpack.com jetpack.com ';

		$blocks = array(
			$this->generateParagraphData( trim( str_repeat( $test_content, 4 ) ) ),
		);

		$expected_content = array(
			array(
				'text' => trim( str_repeat( $test_content, 3 ) ) . ' https://jetpack.com https://Jetpack.com…',
				'urls' => array_merge(
					array_merge( ...array_fill( 0, 3, array( 'https://jetpack.com', 'https://Jetpack.com', 'jetpack.com' ) ) ),
					array( 'https://jetpack.com', 'https://Jetpack.com' )
				),
			),
			array(
				'text' => '…jetpack.com',
				'urls' => array( 'jetpack.com' ),
			),
		);

		$expected_boundaries = array(
			$this->generateNormalBoundary( 195, 196, 'content' ),
			false,
		);

		$expected_blocks = array(
			$blocks,
			$blocks,
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * If the text of the link is the same as the href, we should only include one in the tweet.
	 */
	public function test_text_urls_inside_links_are_deduplicated() {
		$test_urls = array(
			'https://jetpack.com',
			'https://wordpress.org/',
		);

		$test_content = "Visiting <a href='$test_urls[0]'>$test_urls[0]</a> is good, so is visiting <a href='$test_urls[1]'>WordPress.org</a>.";

		$blocks = array(
			$this->generateParagraphData( $test_content ),
		);

		$expected_content = array(
			array(
				'text' => "Visiting $test_urls[0] is good, so is visiting WordPress.org.",
				'urls' => array(
					$test_urls[0],
					'WordPress.org',
				),
			),
		);

		$expected_boundaries = array(
			false,
		);

		$expected_blocks = array(
			$blocks,
		);

		$this->assertTweetGenerated( $blocks, $expected_content, $expected_boundaries, $expected_blocks );
	}

	/**
	 * Test that a single Twitter card generates correctly.
	 */
	public function test_generating_twitter_card() {
		$urls = array( 'https://publicizetests.wpsandbox.me/2015/03/26/hello-world/' );

		$expected = array(
			'https://publicizetests.wpsandbox.me/2015/03/26/hello-world/' => array(
				'creator'     => '@wpcomrestapi',
				'description' => 'Kindly do not delete this post or modify it',
				'image'       => 'https://i2.wp.com/publicizetests.wpsandbox.me/wp-content/uploads/2015/05/keep-calm-its-almost-party-time.png?fit=600%2C700&ssl=1&w=640',
				'title'       => 'Hello world!',
				'type'        => 'summary_large_image',
			),
		);

		$cards = Jetpack_Tweetstorm_Helper::generate_cards( $urls );

		$this->assertEqualSetsWithIndex( $expected, $cards );
	}

	/**
	 * Test that multiple cards generate correctly, and are returned attached to the correct URL.
	 */
	public function test_generating_multiple_twitter_cards() {
		$urls = array(
			'https://publicizetests.wpsandbox.me/2015/05/16/contributor-test/',
			'https://publicizetests.wpsandbox.me/2015/06/29/unsupported-shortcodes-test/',
			'https://publicizetests.wpsandbox.me/',
		);

		$expected = array(
			'https://publicizetests.wpsandbox.me/2015/05/16/contributor-test/' => array(
				'description' => 'Post Written By Contributor.',
				'image'       => 'https://s0.wp.com/i/blank.jpg',
				'title'       => 'Contributor test',
				'type'        => 'summary',
			),
			'https://publicizetests.wpsandbox.me/2015/06/29/unsupported-shortcodes-test/' => array(
				'creator'     => '@wpcomrestapi',
				'description' => '[:en]English: It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-le…',
				'image'       => 'https://s0.wp.com/i/blank.jpg',
				'title'       => 'Unsupported Shortcodes test',
				'type'        => 'summary',
			),
			'https://publicizetests.wpsandbox.me/' => array(
				'creator'     => '@wpcomrestapi',
				'description' => 'Just another WordPress site',
				'image'       => 'https://s0.wp.com/i/blank.jpg',
				'title'       => 'Publicize Jetpack',
			),
		);

		$cards = Jetpack_Tweetstorm_Helper::generate_cards( $urls );

		$this->assertEqualSetsWithIndex( $expected, $cards );
	}

	/**
	 * Test that a site that doesn't contain Twitter card data won't produce a card.
	 */
	public function test_site_with_no_twitter_card() {
		$urls = array( 'https://www.google.com/' );

		$expected = array(
			'https://www.google.com/' => array(
				'error' => 'no_og_data',
			),
		);

		$cards = Jetpack_Tweetstorm_Helper::generate_cards( $urls );

		$this->assertEqualSetsWithIndex( $expected, $cards );
	}

	/**
	 * Test that a URL which redirects will still get the Twitter card.
	 *
	 * @group external-http
	 */
	public function test_twitter_card_with_redirect() {
		$urls = array(
			'https://jetpack.me/',
			'https://jetpack.com/',
		);

		$expected = array(
			'https://jetpack.me/'  => array(
				'description' => 'The ultimate WordPress plugin for security, backups, malware scan, anti-spam, CDN, site search, CRM, Stripe, Facebook, & Instagram',
				'image'       => 'https://jetpackme.files.wordpress.com/2018/04/cropped-jetpack-favicon-2018.png?w=240',
				'title'       => 'Jetpack',
				'type'        => 'summary',
			),
			'https://jetpack.com/' => array(
				'description' => 'The ultimate WordPress plugin for security, backups, malware scan, anti-spam, CDN, site search, CRM, Stripe, Facebook, & Instagram',
				'image'       => 'https://jetpackme.files.wordpress.com/2018/04/cropped-jetpack-favicon-2018.png?w=240',
				'title'       => 'Jetpack',
				'type'        => 'summary',
			),
		);

		$cards = Jetpack_Tweetstorm_Helper::generate_cards( $urls );

		$this->assertEqualSetsWithIndex( $expected, $cards );
	}

	/**
	 * Test that the return data is keyed by the URLs passed.
	 *
	 * @group external-http
	 */
	public function test_twitter_cards_with_odd_URLs() {
		$urls = array(
			'https://Jetpack.com/',
			'https://jetpack.com',
			'jetpack.com/',
			'JETPACK.com',
		);

		$expected = array(
			'https://Jetpack.com/' => array(
				'description' => 'The ultimate WordPress plugin for security, backups, malware scan, anti-spam, CDN, site search, CRM, Stripe, Facebook, & Instagram',
				'image'       => 'https://jetpackme.files.wordpress.com/2018/04/cropped-jetpack-favicon-2018.png?w=240',
				'title'       => 'Jetpack',
				'type'        => 'summary',
			),
			'https://jetpack.com'  => array(
				'description' => 'The ultimate WordPress plugin for security, backups, malware scan, anti-spam, CDN, site search, CRM, Stripe, Facebook, & Instagram',
				'image'       => 'https://jetpackme.files.wordpress.com/2018/04/cropped-jetpack-favicon-2018.png?w=240',
				'title'       => 'Jetpack',
				'type'        => 'summary',
			),
		);

		$cards = Jetpack_Tweetstorm_Helper::generate_cards( $urls );

		$this->assertEqualSetsWithIndex( $expected, $cards );
	}
}
