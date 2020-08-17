<?php
/**
 * Tweetstorm block and API helper.
 *
 * @package jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
use Twitter\Text\Parser;

/**
 * Class Jetpack_Tweetstorm_Helper
 *
 * @since 8.7.0
 */
class Jetpack_Tweetstorm_Helper {
	/**
	 * Blocks that can be converted to tweets.
	 *
	 * @var array
	 */
	private static $supported_blocks = array(
		'core/heading'   => array(
			'type'               => 'text',
			'content_attributes' => array( 'content' ),
			'template'           => '{{content}}',
		),
		'core/image'     => array(
			'type'          => 'image',
			'url_attribute' => 'url',
		),
		'core/list'      => array(
			'type'               => 'multiline',
			'multiline_tag'      => 'li',
			'content_attributes' => array( 'values' ),
			'template'           => '- {{line}}',
		),
		'core/paragraph' => array(
			'type'               => 'text',
			'content_attributes' => array( 'content' ),
			'template'           => '{{content}}',
		),
		'core/quote'     => array(
			'type'               => 'text',
			'content_attributes' => array( 'value', 'citation' ),
			'template'           => '“{{value}}” – {{citation}}',
		),
		'core/verse'     => array(
			'type'               => 'text',
			'content_attributes' => array( 'content' ),
			'template'           => '{{content}}',
		),
	);

	/**
	 * Gather the Tweetstorm.
	 *
	 * @param  string $url The tweet URL to gather from.
	 * @return mixed
	 */
	public static function gather( $url ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'dev_mode',
				__( 'Tweet unrolling is not available in offline mode.', 'jetpack' )
			);
		}

		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Gather_Tweetstorm' ) ) {
				\jetpack_require_lib( 'gather-tweetstorm' );
			}

			return WPCOM_Gather_Tweetstorm::gather( $url );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/tweetstorm/gather?url=%s', $site_id, rawurlencode( $url ) ),
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return new WP_Error( $data->code, $data->message, $data->data );
		}

		return $data;
	}

	/**
	 * Parse tweets.
	 *
	 * @param array $blocks An array of blocks that can be parsed into tweets.
	 * @return mixed
	 */
	public static function parse( $blocks ) {
		$tweets = array();
		$parser = new Parser();

		foreach ( $blocks as $block ) {
			$block_def = self::$supported_blocks[ $block['name'] ];

			if ( 'image' === $block_def['type'] ) {
				$url = $block['attributes'][ $block_def['url_attribute'] ];

				// Check if we can add this image to the last tweet.
				$last_tweet = array_pop( $tweets );
				if ( empty( $last_tweet['media'] ) ) {
					$last_tweet['media'][] = array(
						'url' => $url,
					);

					$tweets[] = $last_tweet;
					continue;
				}
			}

			$block_text = self::extract_text_from_block( $block );

			if ( empty( $block_text ) ) {
				continue;
			}
			$boundaries = array();

			// Is this block too long for a single tweet?
			$tweet = $parser->parseTweet( $block_text );
			if ( $tweet->permillage > 1000 ) {
				// Multiline blocks prioritise splitting by line, so we can treat other
				// text blocks as being "multiline", but with a single line.
				if ( 'multiline' === $block_def['type'] ) {
					$lines = explode( "\n", $block_text );
				} else {
					$lines = array( $block_text );
				}

				// An array of the tweets this block will become.
				$split_block = array( '' );
				// Of the tweets that this block generates, track the one we're currently appending to.
				$current_block_tweet = 0;
				// Keep track of how many characters we've allocated to tweets so far.
				$current_character_count = 0;

				foreach ( $lines as $line_text ) {
					// Is this line short enough to append to the current tweet?
					$tweet = $parser->parseTweet( "{$split_block[ $current_block_tweet ]}\n$line_text" );
					if ( $tweet->permillage <= 1000 ) {
						$split_block[ $current_block_tweet ] .= "\n$line_text";
						continue;
					}

					// The line is too long to append, it needs to be the start of the next tweet.
					if ( '' !== $split_block[ $current_block_tweet ] ) {
						$current_character_count += strlen( $split_block[ $current_block_tweet ] );
						$current_block_tweet++;
						$split_block[ $current_block_tweet ] = '';

						$boundaries[] = self::get_boundary( $block, $current_character_count );
					}

					// Is the line short enough to be a tweet by itself?
					$tweet = $parser->parseTweet( $line_text );
					if ( $tweet->permillage <= 1000 ) {
						$split_block[ $current_block_tweet ] = $line_text;
						continue;
					}

					// Split the line up by sentences. A sentence is defined as:
					// - end of sentence punctuation [.!?]
					// - followed by space(s), or the end of the line.
					$sentences      = preg_split( '/([.!?](?=\s+|$))/', $line_text, -1, PREG_SPLIT_DELIM_CAPTURE );
					$sentence_count = count( $sentences );

					for ( $ii = 0; $ii < $sentence_count; $ii += 2 ) {
						$current_sentence = $sentences[ $ii ] . $sentences[ $ii + 1 ];

						// Is the current sentence too long for a single tweet?
						$tweet = $parser->parseTweet( trim( $current_sentence ) );
						if ( $tweet->permillage > 1000 ) {
							// This long sentence will start the next tweet this block becomes.
							if ( '' !== $split_block[ $current_block_tweet ] ) {
								$current_character_count += strlen( $split_block[ $current_block_tweet ] );
								$current_block_tweet++;
								$split_block[ $current_block_tweet ] = '';

								$boundaries[] = self::get_boundary( $block, $current_character_count );
							}

							// Split the long sentence into words.
							$words      = explode( ' ', $current_sentence );
							$word_count = count( $words );
							for ( $jj = 0; $jj < $word_count; $jj++ ) {
								// Will this word make the tweet too long?
								$tweet = $parser->parseTweet( trim( "…{$split_block[ $current_block_tweet ]} {$words[ $jj ]}…" ) );
								if ( $tweet->permillage > 1000 ) {
									// There's an extra space to count, hence the "+ 1".
									$current_character_count += strlen( $split_block[ $current_block_tweet ] ) + 1;
									$current_block_tweet++;
									$split_block[ $current_block_tweet ] = $words[ $jj ];

									// Offset one back for the extra space.
									$boundaries[] = self::get_boundary( $block, $current_character_count - 1 );
								} else {
									$split_block[ $current_block_tweet ] .= " {$words[ $jj ]}";
								}
							}
						} else {
							// Will this sentence make the tweet too long?
							$tweet = $parser->parseTweet( $split_block[ $current_block_tweet ] . trim( $current_sentence ) );
							if ( $tweet->permillage > 1000 ) {
								$current_character_count += strlen( $split_block[ $current_block_tweet ] );
								$current_block_tweet++;
								$split_block[ $current_block_tweet ] = $current_sentence;

								$boundaries[] = self::get_boundary( $block, $current_character_count );
							} else {
								$split_block[ $current_block_tweet ] .= $current_sentence;
							}
						}
					}
				}

				// Since this block is too long for a single tweet, appended is a new tweet.
				$tweets[] = array(
					'blocks'     => array( $block ),
					'boundaries' => $boundaries,
					'content'    => $block_text,
					'media'      => array(),
				);
				continue;
			}

			// If there are no tweets recorded already, this block will be the first.
			if ( empty( $tweets ) ) {
				$tweets[] = array(
					'blocks'     => array( $block ),
					'boundaries' => $boundaries,
					'content'    => $block_text,
					'media'      => array(),
				);
				continue;
			}

			// Check if this block is short enough to append the the previous tweet.
			$last_tweet     = array_pop( $tweets );
			$new_tweet_text = "{$last_tweet['content']}\n\n$block_text";
			$tweet          = $parser->parseTweet( $new_tweet_text );
			if ( $tweet->permillage > 1000 ) {
				// If this block is too long, create a new tweet for it.
				$tweets[] = $last_tweet;
				$tweets[] = array(
					'blocks'     => array( $block ),
					'boundaries' => $boundaries,
					'content'    => $block_text,
					'media'      => array(),
				);
				continue;
			}

			// Add the current block to the last tweet, then put that tweet back in the array.
			$last_tweet['blocks'][] = $block;
			$last_tweet['content']  = $new_tweet_text;
			$tweets[]               = $last_tweet;
		}

		return $tweets;
	}

	/**
	 * A block will generate a certain amount of text to be inserted into a tweet. If that text is too
	 * long for a tweet, we already know where the text will be split, but we need to calculate where
	 * that corresponds to in the block edit UI.
	 *
	 * The tweet template for that block may add extra characters, and the block may contain multiple
	 * RichText areas (corresponding to attributes), so we need to keep track of both until the
	 * this function calculates which attribute area (in the block editor, the richTextIdentifier)
	 * that offset corresponds to, and how far into that attribute area it is.
	 *
	 * @param array   $block  The block being checked.
	 * @param integer $offset The position in the tweet text where it will be split.
	 * @return array The position in the block editor to insert the tweet boundary annotation.
	 */
	private static function get_boundary( $block, $offset ) {
		$block_def = self::$supported_blocks[ $block['name'] ];

		$template_parts = preg_split( '/({{\w+}})/', self::$supported_blocks[ $block['name'] ]['template'], -1, PREG_SPLIT_DELIM_CAPTURE );

		$current_character_count  = 0;
		$template_character_count = 0;

		if ( 'multiline' === $block_def['type'] ) {
			$lines = self::extract_multiline_block_lines( $block );

			$line_count = 0;
			foreach ( $lines as $line ) {
				foreach ( $template_parts as $part ) {
					if ( '{{line}}' === $part ) {
						$line_length = strlen( $line );

						// Are we breaking in the middle of this line?
						if ( $current_character_count + $line_length > $offset ) {
							$line_offset = $offset - $template_character_count;
							return array(
								'start'     => $line_offset,
								'end'       => $line_offset + 1,
								'character' => $offset,
								'container' => $block_def['content_attributes'][0],
								'type'      => 'normal',
							);
						} else {
							$current_character_count += $line_length;
							continue;
						}
					} else {
						$current_character_count  += strlen( $part );
						$template_character_count += strlen( $part );
					}
				}

				// Are we breaking at the end of this line?
				if ( $current_character_count + 1 === $offset ) {
					$line_offset = $offset - $template_character_count;
					return array(
						'line'      => $line_count,
						'character' => $offset,
						'container' => $block_def['content_attributes'][0],
						'type'      => 'end-of-line',
					);
				}

				// Allow for the line break between lines.
				$current_character_count++;
				$line_count++;
			};
		}

		foreach ( $template_parts as $part ) {
			$matches = array();
			if ( preg_match( '/{{(\w+)}}/', $part, $matches ) ) {
				$attribute_name   = $matches[1];
				$attribute_length = strlen( $block['attributes'][ $attribute_name ] );
				if ( $current_character_count + $attribute_length >= $offset ) {
					$attribute_offset = $offset - $current_character_count;
					return array(
						'start'     => $attribute_offset - 1,
						'end'       => $attribute_offset,
						'character' => $offset,
						'container' => $attribute_name,
						'type'      => 'normal',
					);
				} else {
					$current_character_count += $attribute_length;
					continue;
				}
			} else {
				$current_character_count += strlen( $part );
			}
		}
	}

	/**
	 * Extracts the tweetable text from a block.
	 *
	 * @param array $block The block, as represented in the block editor.
	 */
	private static function extract_text_from_block( $block ) {
		if ( empty( self::$supported_blocks[ $block['name'] ] ) ) {
			return '';
		}

		$block_def = self::$supported_blocks[ $block['name'] ];

		if ( 'text' === $block_def['type'] ) {
			$text = array_reduce(
				$block_def['content_attributes'],
				function( $current_text, $attribute ) use ( $block ) {
					return str_replace( '{{' . $attribute . '}}', $block['attributes'][ $attribute ], $current_text );
				},
				$block_def['template']
			);
		} elseif ( 'multiline' === $block_def['type'] ) {
			$lines = self::extract_multiline_block_lines( $block );
			$text  = '';

			foreach ( $lines as $line ) {
				$text .= str_replace( '{{line}}', $line, $block_def['template'] ) . "\n";
			}

			$text = trim( $text );
		}

		return wp_strip_all_tags( $text );
	}

	/**
	 * Given a multiline block, this will extract the text from each line, and return an array
	 * of those lines.
	 *
	 * @param array $block The block to extract from.
	 * @return array The array of lines.
	 */
	public static function extract_multiline_block_lines( $block ) {
		$block_def = self::$supported_blocks[ $block['name'] ];
		$attribute = $block_def['content_attributes'][0];

		// Remove all HTML tags except the line wrapper tag, and remove attributes from that.
		$cleaned_content = wp_kses( $block['attributes'][ $attribute ], array( $block_def['multiline_tag'] => array() ) );

		// Split the content into an array, cleaning out empty values and the wrapper tags.
		return array_values(
			array_filter(
				wp_html_split( $cleaned_content ),
				function( $section ) {
					if ( empty( $section ) ) {
						return false;
					}

					if ( '<' === substr( $section, 0, 1 ) && '>' === substr( $section, -1 ) ) {
						return false;
					}

					return true;
				}
			)
		);
	}

	/**
	 * Get the WPCOM or self-hosted site ID.
	 *
	 * @return mixed
	 */
	public static function get_site_id() {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}
}
