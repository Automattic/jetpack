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
		'core/paragraph' => array(
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
	 * @param array $selected The currently selected blocks.
	 * @return mixed
	 */
	public static function parse( $blocks, $selected ) {
		$tweets = array();
		$parser = new Parser();

		foreach ( $blocks as $block ) {
			$block_text = self::extract_text_from_block( $block );
			$boundaries = array();

			$is_selected_block = count( $selected ) === 1 && $selected[0] === $block['clientId'];

			// Is this block too long for a single tweet?
			$tweet = $parser->parseTweet( $block_text );
			if ( $tweet->permillage > 1000 ) {
				// Split the block up by sentences.
				$sentences      = preg_split( '/([.!?]\s+)/', $block_text, -1, PREG_SPLIT_DELIM_CAPTURE );
				$sentence_count = count( $sentences );
				// An array of the tweets this block will become.
				$split_block = array( '' );
				// The tweet we're currently appending to.
				$current_block_tweet = 0;
				// Keep track of how many characters we've allocated to tweets so far.
				$current_character_count = 0;

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

							$boundaries[] = array(
								'start' => $current_character_count - 1,
								'end'   => $current_character_count,
							);
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
								$boundaries[] = array(
									'start' => $current_character_count - 2,
									'end'   => $current_character_count - 1,
								);
							} else {
								$split_block[ $current_block_tweet ] .= " {$words[ $jj ]}";
							}
						}
					} else {
						$tweet = $parser->parseTweet( $split_block[ $current_block_tweet ] . trim( $current_sentence ) );
						if ( $tweet->permillage > 1000 ) {
							// Appending this sentence will make the tweet too long, move to the next one.
							$current_character_count += strlen( $split_block[ $current_block_tweet ] );
							$current_block_tweet++;
							$split_block[ $current_block_tweet ] = $current_sentence;

							$boundaries[] = array(
								'start' => $current_character_count - 1,
								'end'   => $current_character_count,
							);
						} else {
							$split_block[ $current_block_tweet ] .= $current_sentence;
						}
					}
				}

				$tweets[] = array(
					'blocks'     => array( $block ),
					'boundaries' => $boundaries,
					'current'    => $is_selected_block,
				);
				continue;
			}

			if ( empty( $tweets ) ) {
				$tweets[] = array(
					'blocks'     => array( $block ),
					'boundaries' => $boundaries,
					'current'    => $is_selected_block,
				);
				continue;
			}

			$last_tweet = array_pop( $tweets );

			$last_tweet_text = array_reduce(
				$last_tweet['blocks'],
				function( $generated_tweet, $allocated_block ) {
					if ( ! $generated_tweet ) {
						return self::extract_text_from_block( $allocated_block );
					}

					return "$generated_tweet\n\n" . self::extract_text_from_block( $allocated_block );
				},
				false
			);

			$tweet = $parser->parseTweet( "$last_tweet_text\n\n$block_text" );
			if ( $tweet->permillage > 1000 ) {
				$tweets[] = $last_tweet;
				$tweets[] = array(
					'blocks'     => array( $block ),
					'boundaries' => $boundaries,
					'current'    => $is_selected_block,
				);
				continue;
			}

			if ( ( ! $last_tweet['current'] ) && $is_selected_block ) {
				$last_tweet['current'] = $is_selected_block;
			}

			$last_tweet['blocks'][] = $block;
			$tweets[]               = $last_tweet;
		}

		return $tweets;
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

		$text = array_reduce(
			$block_def['content_attributes'],
			function( $current_text, $attribute ) use ( $block ) {
				return str_replace( '{{' . $attribute . '}}', $block['attributes']['content'], $current_text );
			},
			$block_def['template']
		);

		return wp_strip_all_tags( $text );
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
