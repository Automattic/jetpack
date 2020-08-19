<?php
/**
 * Tweetstorm block and API helper.
 *
 * @package jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
use Twitter\Text\Configuration;
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
			'force_new'          => true,
			'force_finished'     => false,
		),
		'core/image'     => array(
			'type'           => 'image',
			'url_attribute'  => 'url',
			'force_new'      => false,
			'force_finished' => true,
		),
		'core/list'      => array(
			'type'               => 'multiline',
			'multiline_tag'      => 'li',
			'content_attributes' => array( 'values' ),
			'template'           => '- {{line}}',
			'force_new'          => false,
			'force_finished'     => false,
		),
		'core/paragraph' => array(
			'type'               => 'text',
			'content_attributes' => array( 'content' ),
			'template'           => '{{content}}',
			'force_new'          => false,
			'force_finished'     => false,
		),
		'core/quote'     => array(
			'type'               => 'text',
			'content_attributes' => array( 'value', 'citation' ),
			'template'           => '“{{value}}” – {{citation}}',
			'force_new'          => false,
			'force_finished'     => false,
		),
		'core/verse'     => array(
			'type'               => 'text',
			'content_attributes' => array( 'content' ),
			'template'           => '{{content}}',
			'force_new'          => false,
			'force_finished'     => false,
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
		// Initialise the tweets array with an empty tweet, so we don't need to check
		// if we're creating the first tweet while processing blocks.
		$tweets = array();
		self::start_new_tweet( $tweets );

		foreach ( $blocks as $block ) {
			$block_def = self::$supported_blocks[ $block['name'] ];

			// Grab the most recent tweet, so we can append to that if we can.
			list( $current_tweet_index, $current_tweet ) = self::get_last_tweet( $tweets );

			// Check if we need to start a new tweet.
			if ( $current_tweet['finished'] || $block_def['force_new'] ) {
				list( $current_tweet_index, $current_tweet ) = self::start_new_tweet( $tweets );
			}

			// Handle media first, as we can most easily attach that to the previous tweet.
			if ( 'image' === $block_def['type'] ) {
				// If a URL hasn't been set, we can't use this block.
				if ( empty( $block['attributes'][ $block_def['url_attribute'] ] ) ) {
					continue;
				}

				$url = $block['attributes'][ $block_def['url_attribute'] ];

				// Check if we can add this image to the last tweet.
				if ( ! empty( $current_tweet['media'] ) ) {
					// There was already media attached to the last tweet,
					// so let's put it in a new tweet.
					list( $current_tweet_index, $current_tweet ) = self::start_new_tweet( $tweets );
				}

				$current_tweet['media'][] = array(
					'url' => $url,
				);

				self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
				continue;
			}

			$block_text = self::extract_text_from_block( $block );

			if ( empty( $block_text ) ) {
				continue;
			}

			// If the entire block can't be fit in this tweet, we need to start a new tweet.
			if ( $current_tweet['changed'] && ! self::is_valid_tweet( trim( $current_tweet['text'] ) . "\n\n$block_text" ) ) {
				self::start_new_tweet( $tweets );
			}

			// Multiline blocks prioritise splitting by line, but are otherwise identical to
			// normal text blocks. This means we can treat normal text blocks as being
			// "multiline", but with a single line.
			if ( 'multiline' === $block_def['type'] ) {
				$lines = explode( "\n", $block_text );

			} else {
				$lines = array( $block_text );
			}
			$line_total = count( $lines );

			// Keep track of how many characters from this block we've allocated to tweets.
			$current_character_count = 0;

			for ( $line_count = 0; $line_count < $line_total; $line_count++ ) {
				$line_text = $lines[ $line_count ];

				// Make sure we have the most recent tweet.
				list( $current_tweet_index, $current_tweet ) = self::get_last_tweet( $tweets );

				if ( $current_tweet['changed'] ) {
					// When it's the first line, add an extra blank line to seperate
					// the tweet text from that of the previous block.
					$seperator = "\n\n";
					if ( $line_count > 0 ) {
						$seperator = "\n";
					}

					// Is this line short enough to append to the current tweet?
					if ( self::is_valid_tweet( trim( $current_tweet['text'] ) . "$seperator$line_text" ) ) {
						// Don't trim the text yet, as we may need it for boundary calculations.
						$current_tweet['text'] = $current_tweet['text'] . "$seperator$line_text";

						self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
						continue;
					}

					// This line is too long, and lines *must* be split to a new tweet if they don't fit
					// into the current tweet. If this isn't the first line, record where we split the block.
					if ( $line_count > 0 ) {
						$current_character_count  += strlen( $current_tweet['text'] );
						$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );

						self::save_tweet( $tweets, $current_tweet_index, $current_tweet );
					}

					// Start a new tweet.
					list( $current_tweet_index, $current_tweet ) = self::start_new_tweet( $tweets );
				}

				// Since we're now at the start of a new tweet, is this line short enough to be a tweet by itself?
				if ( self::is_valid_tweet( $line_text ) ) {
					$current_tweet['text'] = $line_text;

					self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
					continue;
				}

				// The line is too long for a single tweet, so split it by sentences.
				$sentences      = preg_split( '/(?<!\.\.\.)(?<=[.?!]|\.\)|\.["\'])(\s+)(?=[a-zA-Z\'"\(])/', $line_text, -1, PREG_SPLIT_DELIM_CAPTURE );
				$sentence_total = count( $sentences );

				// preg_split() puts the blank space between sentences into a seperate entry in the result,
				// so we need to step through the result array by two, and append the blank space when needed.
				for ( $sentence_count = 0; $sentence_count < $sentence_total; $sentence_count += 2 ) {
					$current_sentence = $sentences[ $sentence_count ];
					if ( ! empty( $sentences[ $sentence_count + 1 ] ) ) {
						$current_sentence .= $sentences[ $sentence_count + 1 ];
					}

					// Make sure we have the most recent tweet.
					list( $current_tweet_index, $current_tweet ) = self::get_last_tweet( $tweets );

					// After the first sentence, we can try and append sentences to the previous sentence.
					if ( $current_tweet['changed'] && $sentence_count > 0 ) {
						// Is this sentence short enough for appending to the current tweet?
						if ( self::is_valid_tweet( $current_tweet['text'] . rtrim( $current_sentence ) ) ) {
							$current_tweet['text'] .= $current_sentence;

							self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
							continue;
						}
					}

					// Will this sentence fit in its own tweet?
					if ( self::is_valid_tweet( trim( $current_sentence ) ) ) {
						if ( $current_tweet['changed'] ) {
							// If we're already in the middle of a block, record the boundary
							// before creating a new tweet.
							if ( $line_count > 0 || $sentence_count > 0 ) {
								$current_character_count += strlen( $current_tweet['text'] );

								// A previous sentence may've been split by words, we don't want to count
								// the ellipsis, but we do want to count the space it replaced.
								if ( $sentence_count > 0 && 0 === strpos( $current_tweet['text'], '…' ) ) {
									$current_character_count -= strlen( '…' ) + 1;
								}
								$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );

								self::save_tweet( $tweets, $current_tweet_index, $current_tweet );
							}

							list( $current_tweet_index, $current_tweet ) = self::start_new_tweet( $tweets );
						}
						$current_tweet['text'] = $current_sentence;

						self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
						continue;
					}

					// This long sentence will start the next tweet that this block is going
					// to be turned into, so we need to record the boundary and start a new tweet.
					if ( $current_tweet['changed'] ) {
						$current_character_count  += strlen( $current_tweet['text'] );
						$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );

						self::save_tweet( $tweets, $current_tweet_index, $current_tweet );

						list( $current_tweet_index, $current_tweet ) = self::start_new_tweet( $tweets );

						self::save_tweet( $tweets, $current_tweet_index, $current_tweet );
					}

					// Split the long sentence into words.
					$words      = explode( ' ', $current_sentence );
					$word_total = count( $words );
					for ( $word_count = 0; $word_count < $word_total; $word_count++ ) {
						// Make sure we have the most recent tweet.
						list( $current_tweet_index, $current_tweet ) = self::get_last_tweet( $tweets );

						// Can we add this word to the current tweet?
						if ( self::is_valid_tweet( "{$current_tweet['text']} {$words[ $word_count ]}…" ) ) {
							$current_tweet['text'] .= " {$words[ $word_count ]}";

							self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
							continue;
						}

						// Add one for the space character that we won't include in the tweet text.
						$current_character_count += strlen( $current_tweet['text'] ) + 1;

						// If this is the second block in the split sentence, it'll start
						// with ellipsis, which we don't want to count.
						if ( 0 === strpos( $current_tweet['text'], '…' ) ) {
							$current_character_count -= strlen( '…' );
						}

						// We're starting a new tweet with this word. Append ellipsis to
						// the current tweet, then move on.
						$current_tweet['text'] .= '…';

						// Offset by 1, since the boundary is actually the space after the end of this tweet.
						$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count - 1 );
						self::save_tweet( $tweets, $current_tweet_index, $current_tweet );

						list( $current_tweet_index, $current_tweet ) = self::start_new_tweet( $tweets );

						$current_tweet['text'] = "…{$words[ $word_count ]}";

						self::save_tweet( $tweets, $current_tweet_index, $current_tweet, $block );
					}
				}
			}
		}

		// We managed to get to the end without creating any tweets, so don't return the single empty tweet.
		if ( 1 === count( $tweets ) && false === $tweets[0]['changed'] ) {
			return array();
		}

		return array_map(
			function( $tweet ) {
				$tweet['text'] = trim( $tweet['text'] );
				$tweet['text'] = preg_replace( '/[ \t]+\n/', "\n", $tweet['text'] );

				return $tweet;
			},
			$tweets
		);
	}

	/**
	 * Get the last tweet in the array, along with the index for that tweet.
	 *
	 * @param array $tweets The array of tweets.
	 * @return array An array containing the index of the last tweet, and the last tweet itself.
	 */
	private static function get_last_tweet( $tweets ) {
		$tweet = end( $tweets );
		return array( key( $tweets ), $tweet );
	}

	/**
	 * Creates a blank tweet, appends it to the passed tweets array, and returns the tweet.
	 *
	 * @param array $tweets The array of tweets.
	 * @return array The blank tweet.
	 */
	private static function start_new_tweet( &$tweets ) {
		$tweets[] = array(
			// An array of blocks that make up this tweet.
			'blocks'   => array(),
			// If this tweet only contains part of a block, the boundary contains
			// information about where in the block the tweet ends.
			'boundary' => false,
			// The text content of the tweet.
			'text'     => '',
			// The media content of the tweet.
			'media'    => array(),
			// Some blocks force a hard finish to the tweet, even if subsequent blocks
			// could technically be appended. This flag shows when a tweet is finished.
			'finished' => false,
			// Flag if the current tweet already has content in it.
			'changed'  => false,
		);

		return self::get_last_tweet( $tweets );
	}

	/**
	 * Saves a tweet to the passed tweet array.
	 *
	 * This method adds some last minute checks: marking the tweet as "changed", as well
	 * as adding the $block to the tweet (if it was passed, and hasn't already been added).
	 *
	 * @param array $tweets      The array of tweets.
	 * @param int   $tweet_index Where in the tweet array this tweet should be stored.
	 * @param array $tweet       The tweet being stored.
	 * @param array $block       Optional. The block that was used to modify this tweet.
	 * @return array The saved tweet, after the last minute checks have been done.
	 */
	private static function save_tweet( &$tweets, $tweet_index, $tweet, $block = null ) {
		$tweet['changed'] = true;

		// Check if this block is already recorded against this tweet.
		if ( ! empty( $block ) ) {
			$block_def = self::$supported_blocks[ $block['name'] ];

			if ( $block_def['force_finished'] ) {
				$tweet['finished'] = true;
			}

			$last_block = end( $tweet['blocks'] );
			if ( false === $last_block || $last_block['clientId'] !== $block['clientId'] ) {
				$tweet['blocks'][] = $block;
			}
		}

		$tweets[ $tweet_index ] = $tweet;

		return $tweet;
	}

	/**
	 * Checks if the passed text is valid for a tweet or not.
	 *
	 * @param string $text The text to check.
	 * @return bool Whether or not the text is valid.
	 */
	private static function is_valid_tweet( $text ) {
		// Since we use '…' a lot, strip it out, so we can still use the ASCII checks.
		$ellipsis_count = 0;
		$text           = str_replace( '…', '', $text, $ellipsis_count );
		// If the text is all ASCII, we can use normal string functions,
		// which are much faster than the mb_*() string functions.
		$is_ascii = false;
		if ( function_exists( 'mb_check_encoding' ) ) {
			if ( mb_check_encoding( $text, 'ASCII' ) ) {
				$is_ascii = true;
			}
		} elseif ( ! preg_match( '/[^\x00-\x7F]/', $text ) ) {
			$is_ascii = true;
		}

		if ( $is_ascii ) {
			$config = new Configuration();

			// Ellipsis characters count for two characters on Twitter.
			//phpcs:ignore WordPress.NamingConventions.ValidVariableName
			if ( ( strlen( $text ) + $ellipsis_count * 2 ) <= $config->maxWeightedTweetLength ) {
				return true;
			}

			return false;
		}

		$parser = new Parser();
		$tweet  = $parser->parseTweet( $text );
		if ( $tweet->permillage <= 1000 ) {
			return true;
		}

		return false;
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
				if ( $current_character_count === $offset ) {
					return array(
						'line'      => $line_count,
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
