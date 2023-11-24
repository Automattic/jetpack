<?php
/**
 * Tweetstorm block and API helper.
 *
 * @package automattic/jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status;
use Twitter\Text\Regex as Twitter_Regex;
use Twitter\Text\Validator as Twitter_Validator;

/**
 * Class Jetpack_Tweetstorm_Helper
 *
 * @since 8.7.0
 */
class Jetpack_Tweetstorm_Helper {
	/**
	 * Blocks that can be converted to tweets.
	 *
	 * @var array {
	 *     The key for each element must match the registered block name.
	 *
	 *     @type string $type Required. The type of content this block produces. Can be one of 'break', 'embed', 'image',
	 *                        'multiline', 'text', or 'video'.
	 *     @type string $content_location Optional. Where the block content can be found. Can be 'html', if we need to parse
	 *                           it out of the block HTML text, 'html-attributes', if the we need to parse it out of HTML attributes
	 *                           in the block HTML, or 'block-attributes', if the content can be found in the block attributes.
	 *                           Note that these attributes need to be available when the serialised block is
	 *                           parsed using `parse_blocks()`. If it isn't set, it's assumed the block doesn't add
	 *                           any content to the Twitter thread.
	 *     @type array $content Optional. Defines what parts of the block content need to be extracted. Behaviour can vary based on
	 *                          `$content_location`, and `$type`:
	 *
	 *                              - When `$content_location` is 'html', a value of `array()` or `array( 'content' )` have the same meaning:
	 *                                The entire block HTML should be used. In both cases, 'content' will be the corresponding tag in `$template`.
	 *                              - When `$content_location` is 'html', it should be formatted as `array( 'container' => 'tag' )`,
	 *                                where 'container' is the name of the corresponding RichText container in the block editor, and is also the name
	 *                                of the corresponding tag in the $template string. 'tag' is the HTML tag within the block that corresponds to this
	 *                                container. When `$type` is 'multiline', there must only be one element in the array, and tag should be set to the HTML
	 *                                tag that corresponds to each line, though the 'container' should still be the RichText container name. (Eg, in the core/list block, the tag is 'li'.)
	 *                              - When `$content_location` is 'html-attributes', the array should be formatted as `array( 'name' => array( 'tag', 'attribute') )`,
	 *                                where 'name' is the name of a particular value that different block types require, 'tag' is the name of the HTML tag where 'attribute'
	 *                                can be found, containing the value to use for 'name'. When `$type` is 'image', 'url' and 'alt' must be defined. When `$type` is 'video',
	 *                                'url' must be defined.
	 *                              - When `$content_location` is 'block-attributes', it must be an array of block attribute names. When `$type` is 'embed', there
	 *                                only be one element, corresponding to the URL for the embed.
	 *     @type string $template Required for 'text' and 'multiline' types, ignored for all other types. Describes how the block content will be formatted when tweeted.
	 *                            Tags should match the keys of `$content`, except for the special "{{content}}", which matches the entire HTML content of the block.
	 *                            For 'multiline' types, the template will be repeated for every line in the block.
	 *     @type boolean $force_new Required. Whether or not a new tweet should be started when this block is encountered.
	 *     @type boolean $force_finished Required. Whether or not a new tweet should be started after this block is finished.
	 * }
	 */
	private static $supported_blocks = array(
		'core/embed'     => array(
			'type'             => 'embed',
			'content_location' => 'block-attributes',
			'content'          => array( 'url' ),
			'force_new'        => false,
			'force_finished'   => true,
		),
		'core/gallery'   => array(
			'type'             => 'image',
			'content_location' => 'html-attributes',
			'content'          => array(
				'url' => array( 'img', 'src' ),
				'alt' => array( 'img', 'alt' ),
			),
			'force_new'        => false,
			'force_finished'   => true,
		),
		'core/heading'   => array(
			'type'             => 'text',
			'content_location' => 'html',
			'content'          => array(),
			'template'         => '{{content}}',
			'force_new'        => true,
			'force_finished'   => false,
		),
		'core/image'     => array(
			'type'             => 'image',
			'content_location' => 'html-attributes',
			'content'          => array(
				'url' => array( 'img', 'src' ),
				'alt' => array( 'img', 'alt' ),
			),
			'force_new'        => false,
			'force_finished'   => true,
		),
		'core/list'      => array(
			'type'             => 'multiline',
			'content_location' => 'html',
			// It looks a little weird to use the 'values' key for a single line,
			// but 'values' is the name of the RichText content area.
			'content'          => array(
				'values' => 'li',
			),
			'template'         => '- {{values}}',
			'force_new'        => false,
			'force_finished'   => false,
		),
		'core/paragraph' => array(
			'type'             => 'text',
			'content_location' => 'html',
			'content'          => array(),
			'template'         => '{{content}}',
			'force_new'        => false,
			'force_finished'   => false,
		),
		'core/quote'     => array(
			'type'             => 'text',
			'content_location' => 'html',
			// The quote content will always be inside <p> tags.
			'content'          => array(
				'value'    => 'p',
				'citation' => 'cite',
			),
			'template'         => '“{{value}}” – {{citation}}',
			'force_new'        => false,
			'force_finished'   => false,
		),
		'core/separator' => array(
			'type'           => 'break',
			'force_new'      => false,
			'force_finished' => true,
		),
		'core/spacer'    => array(
			'type'           => 'break',
			'force_new'      => false,
			'force_finished' => true,
		),
		'core/verse'     => array(
			'type'             => 'text',
			'content_location' => 'html',
			'content'          => array(),
			'template'         => '{{content}}',
			'force_new'        => false,
			'force_finished'   => false,
		),
		'core/video'     => array(
			'type'             => 'video',
			'content_location' => 'html-attributes',
			'content'          => array(
				'url' => array( 'video', 'src' ),
			),
			'force_new'        => false,
			'force_finished'   => true,
		),
		'jetpack/gif'    => array(
			'type'             => 'embed',
			'content_location' => 'block-attributes',
			'content'          => array( 'giphyUrl' ),
			'force_new'        => false,
			'force_finished'   => true,
		),
	);

	/**
	 * A cache of _wp_emoji_list( 'entities' ), after being run through html_entity_decode().
	 *
	 * Initialised in ::is_valid_tweet().
	 *
	 * @var array
	 */
	private static $emoji_list = array();

	/**
	 * Special line separator character, for multiline text.
	 *
	 * @var string
	 */
	private static $line_separator = "\xE2\x80\xA8";

	/**
	 * Special inline placeholder character, for inline tags that change content length in the RichText..
	 *
	 * @var string
	 */
	private static $inline_placeholder = "\xE2\x81\xA3";

	/**
	 * URLs always take up a fixed length from the text limit.
	 *
	 * @var int
	 */
	private static $characters_per_url = 24;

	/**
	 * Every media attachment takes up some space from the text limit.
	 *
	 * @var int
	 */
	private static $characters_per_media = 24;

	/**
	 * An array to store all the tweets in.
	 *
	 * @var array
	 */
	private static $tweets = array();

	/**
	 * While we're caching everything, we want to keep track of the URLs we're adding.
	 *
	 * @var array
	 */
	private static $urls = array();

	/**
	 * Checks if a given request is allowed to gather tweets.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has access to gather tweets from a thread, WP_Error object otherwise.
	 */
	public static function permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$blog_id = get_current_blog_id();

		/*
		 * User hitting the endpoint hosted on their Jetpack site, from their Jetpack site,
		 * or hitting the endpoint hosted on WPCOM, from their WPCOM site.
		 */
		if ( current_user_can_for_blog( $blog_id, 'edit_posts' ) ) {
			return true;
		}

		// Jetpack hitting the endpoint hosted on WPCOM, from a Jetpack site with a blog token.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( is_jetpack_site( $blog_id ) ) {
				if ( ! class_exists( 'WPCOM_REST_API_V2_Endpoint_Jetpack_Auth' ) ) {
					require_once dirname( __DIR__ ) . '/rest-api-plugins/endpoints/jetpack-auth.php';
				}

				$jp_auth_endpoint = new WPCOM_REST_API_V2_Endpoint_Jetpack_Auth();
				if ( true === $jp_auth_endpoint->is_jetpack_authorized_for_site() ) {
					return true;
				}
			}
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to use tweetstorm endpoints on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

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

		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Gather_Tweetstorm' ) ) {
				\require_lib( 'gather-tweetstorm' );
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
	 * Parse blocks into an array of tweets.
	 *
	 * @param array $blocks {
	 *     An array of blocks, with optional editor-specific information, that need to be parsed into tweets.
	 *
	 *     @type array  $block      A single block, in the form produce by parse_blocks().
	 *     @type array  $attributes Optional. A list of block attributes and their values from the block editor.
	 *     @type string $clientId   Optional. The clientId of this block in the block editor.
	 * }
	 * @return array An array of tweets.
	 */
	public static function parse( $blocks ) {
		// Reset the tweets array.
		self::$tweets = array();

		$blocks = self::extract_blocks( $blocks );

		if ( empty( $blocks ) ) {
			return array();
		}

		// Initialise the tweets array with an empty tweet, so we don't need to check
		// if we're creating the first tweet while processing blocks.
		self::start_new_tweet();

		foreach ( $blocks as $block ) {
			$block_def = self::get_block_definition( $block['name'] );

			// Grab the most recent tweet.
			$current_tweet = self::get_current_tweet();

			// Break blocks have no content to add, so we can skip the rest of this loop.
			if ( 'break' === $block_def['type'] ) {
				self::save_current_tweet( $current_tweet, $block );
				continue;
			}

			// Check if we need to start a new tweet.
			if ( $current_tweet['finished'] || $block_def['force_new'] ) {
				self::start_new_tweet();
			}

			// Process the block.
			self::add_text_to_tweets( $block );
			self::add_media_to_tweets( $block );
			self::add_tweet_to_tweets( $block );
			self::add_embed_to_tweets( $block );
		}

		return self::clean_return_tweets();
	}

	/**
	 * If the passed block name is supported, return the block definition.
	 *
	 * @param string $block_name The registered block name.
	 * @return array|null The block definition, if it's supported.
	 */
	private static function get_block_definition( $block_name ) {
		if ( isset( self::$supported_blocks[ $block_name ] ) ) {
			return self::$supported_blocks[ $block_name ];
		}

		return null;
	}

	/**
	 * If the block has any text, process it, and add it to the tweet list.
	 *
	 * @param array $block The block to process.
	 */
	private static function add_text_to_tweets( $block ) {
		// This is a text block, is there any text?
		if ( 0 === strlen( $block['text'] ) ) {
			return;
		}

		$block_def = self::get_block_definition( $block['name'] );

		// Grab the most recent tweet, so we can append to that if we can.
		$current_tweet = self::get_current_tweet();

		// If the entire block can't be fit in this tweet, we need to start a new tweet.
		if ( $current_tweet['changed'] && ! self::is_valid_tweet( trim( $current_tweet['text'] ) . "\n\n{$block['text']}" ) ) {
			self::start_new_tweet();
		}

		// Multiline blocks prioritise splitting by line, but are otherwise identical to
		// normal text blocks. This means we can treat normal text blocks as being
		// "multiline", but with a single line.
		if ( 'multiline' === $block_def['type'] ) {
			$lines = explode( self::$line_separator, $block['text'] );
		} else {
			$lines = array( $block['text'] );
		}

		$line_total = is_array( $lines ) ? count( $lines ) : 0;

		// Keep track of how many characters from this block we've allocated to tweets.
		$current_character_count = 0;

		for ( $line_count = 0; $line_count < $line_total; $line_count++ ) {
			$line_text = $lines[ $line_count ];

			// Make sure we have the most recent tweet at the start of every loop.
			$current_tweet = self::get_current_tweet();

			if ( $current_tweet['changed'] ) {
				// When it's the first line, add an extra blank line to seperate
				// the tweet text from that of the previous block.
				$separator = "\n\n";
				if ( $line_count > 0 ) {
					$separator = "\n";
				}

				// Is this line short enough to append to the current tweet?
				if ( self::is_valid_tweet( trim( $current_tweet['text'] ) . "$separator$line_text" ) ) {
					// Don't trim the text yet, as we may need it for boundary calculations.
					$current_tweet['text'] = $current_tweet['text'] . "$separator$line_text";

					self::save_current_tweet( $current_tweet, $block );
					continue;
				}

				// This line is too long, and lines *must* be split to a new tweet if they don't fit
				// into the current tweet. If this isn't the first line, record where we split the block.
				if ( $line_count > 0 ) {
					// Increment by 1 to allow for the \n between lines to be counted by ::get_boundary().
					$current_character_count  += strlen( $current_tweet['text'] ) + 1;
					$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );

					self::save_current_tweet( $current_tweet );
				}

				// Start a new tweet.
				$current_tweet = self::start_new_tweet();
			}

			// Since we're now at the start of a new tweet, is this line short enough to be a tweet by itself?
			if ( self::is_valid_tweet( $line_text ) ) {
				$current_tweet['text'] = $line_text;

				self::save_current_tweet( $current_tweet, $block );
				continue;
			}

			// The line is too long for a single tweet, so split it by sentences, or linebreaks.
			$sentences = preg_split( '/(?|(?<!\.\.\.)(?<=[.?!]|\.\)|\.["\'])(\s+)(?=[\p{L}\'"\(])|(\n+))/u', $line_text, -1, PREG_SPLIT_DELIM_CAPTURE );

			$sentence_total = $sentences !== false ? count( $sentences ) : 0;

			// preg_split() puts the blank space between sentences into a seperate entry in the result,
			// so we need to step through the result array by two, and append the blank space when needed.
			for ( $sentence_count = 0; $sentence_count < $sentence_total; $sentence_count += 2 ) {
				$current_sentence = $sentences[ $sentence_count ];
				if ( isset( $sentences[ $sentence_count + 1 ] ) ) {
					$current_sentence .= $sentences[ $sentence_count + 1 ];
				}

				// Make sure we have the most recent tweet.
				$current_tweet = self::get_current_tweet();

				// After the first sentence, we can try and append sentences to the previous sentence.
				if ( $current_tweet['changed'] && $sentence_count > 0 ) {
					// Is this sentence short enough for appending to the current tweet?
					if ( self::is_valid_tweet( $current_tweet['text'] . rtrim( $current_sentence ) ) ) {
						$current_tweet['text'] .= $current_sentence;

						self::save_current_tweet( $current_tweet, $block );
						continue;
					}
				}

				// Will this sentence fit in its own tweet?
				if ( self::is_valid_tweet( trim( $current_sentence ) ) ) {
					if ( $current_tweet['changed'] ) {
						// If we're already in the middle of a block, record the boundary
						// before creating a new tweet.
						if ( $line_count > 0 || $sentence_count > 0 ) {
							$current_character_count  += strlen( $current_tweet['text'] );
							$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );

							self::save_current_tweet( $current_tweet );
						}

						$current_tweet = self::start_new_tweet();
					}
					$current_tweet['text'] = $current_sentence;

					self::save_current_tweet( $current_tweet, $block );
					continue;
				}

				// This long sentence will start the next tweet that this block is going
				// to be turned into, so we need to record the boundary and start a new tweet.
				if ( $current_tweet['changed'] ) {
					$current_character_count  += strlen( $current_tweet['text'] );
					$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );

					self::save_current_tweet( $current_tweet );

					$current_tweet = self::start_new_tweet();
				}

				// Split the long sentence into words.
				$words      = preg_split( '/(\p{Z})/u', $current_sentence, -1, PREG_SPLIT_DELIM_CAPTURE );
				$word_total = $words !== false ? count( $words ) : 0;
				for ( $word_count = 0; $word_count < $word_total; $word_count += 2 ) {
					// Make sure we have the most recent tweet.
					$current_tweet = self::get_current_tweet();

					// If we're on a new tweet, we don't want to add a space at the start.
					if ( ! $current_tweet['changed'] ) {
						$current_tweet['text'] = $words[ $word_count ];

						self::save_current_tweet( $current_tweet, $block );
						continue;
					}

					// Can we add this word to the current tweet?
					if ( self::is_valid_tweet( "{$current_tweet['text']} {$words[ $word_count ]}…" ) ) {
						$space = isset( $words[ $word_count - 1 ] ) ? $words[ $word_count - 1 ] : ' ';

						$current_tweet['text'] .= $space . $words[ $word_count ];

						self::save_current_tweet( $current_tweet, $block );
						continue;
					}

					// Add one for the space character that we won't include in the tweet text.
					$current_character_count += strlen( $current_tweet['text'] ) + 1;

					// We're starting a new tweet with this word. Append ellipsis to
					// the current tweet, then move on.
					$current_tweet['text'] .= '…';

					$current_tweet['boundary'] = self::get_boundary( $block, $current_character_count );
					self::save_current_tweet( $current_tweet );

					$current_tweet = self::start_new_tweet();

					// If this is the second tweet created by the split sentence, it'll start
					// with ellipsis, which we don't want to count, but we do want to count the space
					// that was replaced by this ellipsis.
					$current_tweet['text']    = "…{$words[ $word_count ]}";
					$current_character_count -= strlen( '…' );

					self::save_current_tweet( $current_tweet, $block );
				}
			}
		}
	}

	/**
	 * Check if the block has any media to add, and add it.
	 *
	 * @param array $block  The block to process.
	 */
	private static function add_media_to_tweets( $block ) {
		if ( ! is_countable( $block['media'] ) ) {
			return;
		}
		// There's some media to attach!
		$media_count = count( $block['media'] );
		if ( 0 === $media_count ) {
			return;
		}

		$current_tweet = self::get_current_tweet();

		// We can only attach media to the previous tweet if the previous tweet
		// doesn't already have media.
		if ( is_countable( $current_tweet['media'] ) && count( $current_tweet['media'] ) > 0 ) {
			$current_tweet = self::start_new_tweet();
		}

		// Would adding this media make the text of the previous tweet too long?
		if ( ! self::is_valid_tweet( $current_tweet['text'], $media_count * self::$characters_per_media ) ) {
			$current_tweet = self::start_new_tweet();
		}

		$media = array_values(
			array_filter(
				$block['media'],
				function ( $single ) {
					// Only images and videos can be uploaded.
					if ( str_starts_with( $single['type'], 'image/' ) || str_starts_with( $single['type'], 'video/' ) ) {
						return true;
					}

					return false;
				}
			)
		);

		if ( count( $media ) > 0 ) {
			if ( str_starts_with( $media[0]['type'], 'video/' ) || 'image/gif' === $media[0]['type'] ) {
				// We can only attach a single video or GIF.
				$current_tweet['media'] = array_slice( $media, 0, 1 );
			} else {
				// Since a GIF or video isn't the first element, we can remove all of them from the array.
				$filtered_media = array_values(
					array_filter(
						$media,
						function ( $single ) {
							if ( str_starts_with( $single['type'], 'video/' ) || 'image/gif' === $single['type'] ) {
								return false;
							}

							return true;
						}
					)
				);
				// We can only add the first four images found to the tweet.
				$current_tweet['media'] = array_slice( $filtered_media, 0, 4 );
			}

			self::save_current_tweet( $current_tweet, $block );
		}
	}

	/**
	 * Check if the block has a tweet that we can attach to the current tweet as a quote, and add it.
	 *
	 * @param array $block  The block to process.
	 */
	private static function add_tweet_to_tweets( $block ) {
		if ( 0 === strlen( $block['tweet'] ) ) {
			return;
		}

		$current_tweet = self::get_current_tweet();

		// We can only attach a tweet to the previous tweet if the previous tweet
		// doesn't already have a tweet quoted.
		if ( strlen( $current_tweet['tweet'] ) > 0 ) {
			$current_tweet = self::start_new_tweet();
		}

		$current_tweet['tweet'] = $block['tweet'];

		self::save_current_tweet( $current_tweet, $block );
	}

	/**
	 * Check if the block has an embed URL that we can append to the current tweet text.
	 *
	 * @param array $block  The block to process.
	 */
	private static function add_embed_to_tweets( $block ) {
		if ( 0 === strlen( $block['embed'] ) ) {
			return;
		}

		$current_tweet = self::get_current_tweet();

		$reserved_characters  = count( $current_tweet['media'] ) * self::$characters_per_media;
		$reserved_characters += 1 + self::$characters_per_url;

		// We can only attach an embed to the previous tweet if it doesn't already
		// have any URLs in it. Also, we can't attach it if it'll make the tweet too long.
		if ( preg_match( '/url-placeholder-\d+-*/', $current_tweet['text'] ) || ! self::is_valid_tweet( $current_tweet['text'], $reserved_characters ) ) {
			$current_tweet         = self::start_new_tweet();
			$current_tweet['text'] = self::generate_url_placeholder( $block['embed'] );
		} else {
			$space                  = empty( $current_tweet['text'] ) ? '' : ' ';
			$current_tweet['text'] .= $space . self::generate_url_placeholder( $block['embed'] );
		}

		self::save_current_tweet( $current_tweet, $block );
	}

	/**
	 * Given an array of blocks and optional editor information, this will extract them into
	 * the internal representation used during parsing.
	 *
	 * @param array $blocks An array of blocks and optional editor-related information.
	 * @return array An array of blocks, in our internal representation.
	 */
	private static function extract_blocks( $blocks ) {
		if ( empty( $blocks ) ) {
			return array();
		}

		$block_count = count( $blocks );

		for ( $ii = 0; $ii < $block_count; $ii++ ) {
			if ( ! self::get_block_definition( $blocks[ $ii ]['block']['blockName'] ) ) {
				unset( $blocks[ $ii ] );
				continue;
			}

			$blocks[ $ii ]['name']  = $blocks[ $ii ]['block']['blockName'];
			$blocks[ $ii ]['text']  = self::extract_text_from_block( $blocks[ $ii ]['block'] );
			$blocks[ $ii ]['media'] = self::extract_media_from_block( $blocks[ $ii ]['block'] );
			$blocks[ $ii ]['tweet'] = self::extract_tweet_from_block( $blocks[ $ii ]['block'] );
			$blocks[ $ii ]['embed'] = self::extract_embed_from_block( $blocks[ $ii ]['block'] );
		}

		return array_values( $blocks );
	}

	/**
	 * Creates a blank tweet, appends it to the tweets array, and returns the tweet.
	 *
	 * @return array The blank tweet.
	 */
	private static function start_new_tweet() {
		self::$tweets[] = array(
			// An array of blocks that make up this tweet.
			'blocks'   => array(),
			// If this tweet only contains part of a block, the boundary contains
			// information about where in the block the tweet ends.
			'boundary' => false,
			// The text content of the tweet.
			'text'     => '',
			// The media content of the tweet.
			'media'    => array(),
			// The quoted tweet in this tweet.
			'tweet'    => '',
			// Some blocks force a hard finish to the tweet, even if subsequent blocks
			// could technically be appended. This flag shows when a tweet is finished.
			'finished' => false,
			// Flag if the current tweet already has content in it.
			'changed'  => false,
		);

		return self::get_current_tweet();
	}

	/**
	 * Get the last tweet in the array.
	 *
	 * @return array The tweet.
	 */
	private static function get_current_tweet() {
		return end( self::$tweets );
	}

	/**
	 * Saves the passed tweet array as the last tweet, overwriting the former last tweet.
	 *
	 * This method adds some last minute checks: marking the tweet as "changed", as well
	 * as adding the $block to the tweet (if it was passed, and hasn't already been added).
	 *
	 * @param array $tweet       The tweet being stored.
	 * @param array $block       Optional. The block that was used to modify this tweet.
	 * @return array The saved tweet, after the last minute checks have been done.
	 */
	private static function save_current_tweet( $tweet, $block = null ) {
		$tweet['changed'] = true;

		if ( isset( $block ) ) {
			$block_def = self::get_block_definition( $block['name'] );

			// Check if this block type will be forcing a new tweet.
			if ( $block_def['force_finished'] ) {
				$tweet['finished'] = true;
			}

			// Check if this block is already recorded against this tweet.
			$last_block = end( $tweet['blocks'] );
			if ( isset( $block['clientId'] ) && ( false === $last_block || $last_block['clientId'] !== $block['clientId'] ) ) {
				$tweet['blocks'][] = $block;
			}
		}

		// Find the index of the last tweet in the array.
		end( self::$tweets );
		$tweet_index = key( self::$tweets );

		self::$tweets[ $tweet_index ] = $tweet;

		return $tweet;
	}

	/**
	 * Checks if the passed text is valid for a tweet or not.
	 *
	 * @param string $text                The text to check.
	 * @param int    $reserved_characters Optional. The number of characters to reduce the maximum tweet length by.
	 * @return bool Whether or not the text is valid.
	 */
	private static function is_valid_tweet( $text, $reserved_characters = 0 ) {
		return self::is_within_twitter_length( $text, 280 - $reserved_characters );
	}

	/**
	 * Checks if the passed text is valid for image alt text.
	 *
	 * @param string $text The text to check.
	 * @return bool Whether or not the text is valid.
	 */
	private static function is_valid_alt_text( $text ) {
		return self::is_within_twitter_length( $text, 1000 );
	}

	/**
	 * Check if a string is shorter than a given length, according to Twitter's rules for counting string length.
	 *
	 * @param string $text       The text to check.
	 * @param int    $max_length The number of characters long this string can be.
	 * @return bool Whether or not the string is no longer than the length limit.
	 */
	private static function is_within_twitter_length( $text, $max_length ) {
		// Replace all multiline separators with a \n, since that's the
		// character we actually want to count.
		$text = str_replace( self::$line_separator, "\n", $text );

		// Keep a running total of characters we've removed.
		$stripped_characters = 0;

		// Since we use '…' a lot, strip it out, so we can still use the ASCII checks.
		$ellipsis_count = 0;
		$text           = str_replace( '…', '', $text, $ellipsis_count );

		// The ellipsis glyph counts for two characters.
		$stripped_characters += $ellipsis_count * 2;

		// Try filtering out emoji first, since ASCII text + emoji is a relatively common case.
		if ( ! self::is_ascii( $text ) ) {
			// Initialise the emoji cache.
			if ( 0 === count( self::$emoji_list ) ) {
				self::$emoji_list = array_map( 'html_entity_decode', _wp_emoji_list( 'entities' ) );
			}

			$emoji_count = 0;
			$text        = str_replace( self::$emoji_list, '', $text, $emoji_count );

			// Emoji graphemes count as 2 characters each.
			$stripped_characters += $emoji_count * 2;
		}

		if ( self::is_ascii( $text ) ) {
			$stripped_characters += strlen( $text );
			if ( $stripped_characters <= $max_length ) {
				return true;
			}

			return false;
		}

		// Remove any glyphs that count as 1 character.
		// Source: https://github.com/twitter/twitter-text/blob/master/config/v3.json .
		// Note that the source ranges are in decimal, the regex ranges are converted to hex.
		$single_character_count = 0;
		$text                   = preg_replace( '/[\x{0000}-\x{10FF}\x{2000}-\x{200D}\x{2010}-\x{201F}\x{2032}-\x{2037}]/uS', '', $text, -1, $single_character_count );

		$stripped_characters += $single_character_count;

		// Check if there's any text we haven't counted yet.
		// Any remaining glyphs count as 2 characters each.
		if ( 0 !== strlen( $text ) ) {
			// WP provides a compat version of mb_strlen(), no need to check if it exists.
			$stripped_characters += mb_strlen( $text, 'UTF-8' ) * 2;
		}

		if ( $stripped_characters <= $max_length ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if a string only contains ASCII characters.
	 *
	 * @param string $text The string to check.
	 * @return bool Whether or not the string is ASCII-only.
	 */
	private static function is_ascii( $text ) {
		if ( function_exists( 'mb_check_encoding' ) ) {
			if ( mb_check_encoding( $text, 'ASCII' ) ) {
				return true;
			}
		} elseif ( ! preg_match( '/[^\x00-\x7F]/', $text ) ) {
			return true;
		}

		return false;
	}

	/**
	 * A block will generate a certain amount of text to be inserted into a tweet. If that text is too
	 * long for a tweet, we already know where the text will be split when it's published as tweet, but
	 * we need to calculate where that corresponds to in the block edit UI.
	 *
	 * The tweet template for that block may add extra characters, extra characters are added for URL
	 * placeholders, and the block may contain multiple RichText areas (corresponding to attributes),
	 * so we need to keep track of both until the this function calculates which attribute area (in the
	 * block editor, the richTextIdentifier) that offset corresponds to, and how far into that attribute
	 * area it is.
	 *
	 * @param array   $block  The block being checked.
	 * @param integer $offset The position in the tweet text where it will be split.
	 * @return array|false `false` if the boundary can't be determined. Otherwise, returns the
	 *                     position in the block editor to insert the tweet boundary annotation.
	 */
	private static function get_boundary( $block, $offset ) {
		// If we don't have a clientId, there's no point in generating a boundary, since this
		// parse request doesn't have a way to map blocks back to editor UI.
		if ( ! isset( $block['clientId'] ) ) {
			return false;
		}

		$block_def = self::get_block_definition( $block['name'] );

		if ( ! empty( $block_def['content'] ) ) {
			$tags = $block_def['content'];
		} else {
			$tags = array( 'content' );
		}

		$tag_content = self::extract_tag_content_from_html( $tags, $block['block']['innerHTML'] );

		// $tag_content is split up by tag first, then lines. We want to remap it to split it by lines
		// first, then tag.
		$lines = array();
		foreach ( $tag_content as $tag => $content ) {
			if ( 'content' === $tag ) {
				$attribute_name = 'content';
			} else {
				$attribute_name = array_search( $tag, $block_def['content'], true );
			}

			foreach ( $content as $id => $content_string ) {
				// Multiline blocks can have multiple lines, but other blocks will always only have 1.
				if ( 'multiline' === $block_def['type'] ) {
					$line_number = $id;
				} else {
					$line_number = 0;
				}

				if ( ! isset( $lines[ $line_number ] ) ) {
					$lines[ $line_number ] = array();
				}

				if ( ! isset( $lines[ $line_number ][ $attribute_name ] ) ) {
					// For multiline blocks, or the first time this attribute has been encountered
					// in single line blocks, assign the string to the line/attribute.
					$lines[ $line_number ][ $attribute_name ] = $content_string;
				} else {
					// For subsequent times this line/attribute is encountered (only in single line blocks),
					// append the string with a line break.
					$lines[ $line_number ][ $attribute_name ] .= "\n$content_string";
				}
			}
		}

		$line_count = count( $lines );

		$template_parts = preg_split( '/({{\w+}})/', $block_def['template'], -1, PREG_SPLIT_DELIM_CAPTURE );

		// Keep track of the total number of bytes we've processed from this block.
		$total_bytes_processed = 0;

		// Keep track of the number of characters that the processed data translates to in the editor.
		$characters_processed = 0;

		foreach ( $lines as $line_number => $line ) {
			// Add up the length of all the parts of this line.
			$line_byte_total = array_sum( array_map( 'strlen', $line ) );

			if ( $line_byte_total > 0 ) {
				// We have something to use in the template, so loop over each part of the template, and count it.
				foreach ( $template_parts as $template_part ) {
					$matches = array();
					if ( preg_match( '/{{(\w+)}}/', $template_part, $matches ) ) {
						$part_name = $matches[1];

						$line_part_data  = $line[ $part_name ];
						$line_part_bytes = strlen( $line_part_data );

						$cleaned_line_part_data = preg_replace( '/ \(url-placeholder-\d+-*\)/', '', $line_part_data );

						$cleaned_line_part_data = preg_replace_callback(
							'/url-placeholder-(\d+)-*/',
							function ( $matches ) {
								return self::$urls[ $matches[1] ];
							},
							$cleaned_line_part_data
						);

						if ( $total_bytes_processed + $line_part_bytes >= $offset ) {
							// We know that the offset is somewhere inside this part of the tweet, but we need to remove the length
							// of any URL placeholders that appear before the boundary, to be able to calculate the correct attribute offset.

							// $total_bytes_processed is the sum of everything we've processed so far, (including previous parts)
							// on this line. This makes it relatively easy to calculate the number of bytes into this part
							// that the boundary will occur.
							$line_part_byte_boundary = $offset - $total_bytes_processed;

							// Grab the data from this line part that appears before the boundary.
							$line_part_pre_boundary_data = substr( $line_part_data, 0, $line_part_byte_boundary );

							// Remove any URL placeholders, since these aren't shown in the editor.
							$line_part_pre_boundary_data = preg_replace( '/ \(url-placeholder-\d+-*\)/', '', $line_part_pre_boundary_data );

							$line_part_pre_boundary_data = preg_replace_callback(
								'/url-placeholder-(\d+)-*/',
								function ( $matches ) {
									return self::$urls[ $matches[1] ];
								},
								$line_part_pre_boundary_data
							);

							$boundary_start = self::utf_16_code_unit_length( $line_part_pre_boundary_data ) - 1;

							// Multiline blocks need to offset for the characters that are in the same content area,
							// but which were counted on previous lines.
							if ( 'multiline' === $block_def['type'] ) {
								$boundary_start += $characters_processed;
							}

							// Check if the boundary is happening on a line break or a space.
							if ( "\n" === $line_part_data[ $line_part_byte_boundary - 1 ] ) {
								$type = 'line-break';

								// A line break boundary can actually be multiple consecutive line breaks,
								// count them all up so we know how big the annotation needs to be.
								$matches = array();
								preg_match( '/\n+$/', substr( $line_part_data, 0, $line_part_byte_boundary ), $matches );
								$boundary_end    = $boundary_start + 1;
								$boundary_start -= strlen( $matches[0] ) - 1;
							} else {
								$type         = 'normal';
								$boundary_end = $boundary_start + 1;
							}

							return array(
								'start'     => $boundary_start,
								'end'       => $boundary_end,
								'container' => $part_name,
								'type'      => $type,
							);
						} else {
							$total_bytes_processed += $line_part_bytes;
							$characters_processed  += self::utf_16_code_unit_length( $cleaned_line_part_data );
							continue;
						}
					} else {
						$total_bytes_processed += strlen( $template_part );
					}
				}

				// Are we breaking at the end of this line?
				if ( $total_bytes_processed + 1 === $offset && $line_count > 1 ) {
					reset( $block_def['content'] );
					$container = key( $block_def['content'] );
					return array(
						'line'      => $line_number,
						'container' => $container,
						'type'      => 'end-of-line',
					);
				}

				// The newline at the end of each line is 1 byte, but we don't need to count empty lines.
				++$total_bytes_processed;
			}

			// We do need to count empty lines in the editor, since they'll be displayed.
			++$characters_processed;
		}

		return false;
	}

	/**
	 * JavaScript uses UTF-16 for encoding strings, which means we need to provide UTF-16
	 * based offsets for the block editor to render tweet boundaries in the correct location.
	 *
	 * UTF-16 is a variable-width character encoding: every code unit is 2 bytes, a single character
	 * can be one or two code units long. Fortunately for us, JavaScript's String.charAt() is based
	 * on the older UCS-2 character encoding, which only counts single code units. PHP's strlen()
	 * counts a code unit as being 2 characters, so once a string is converted to UTF-16, we have
	 * a fast way to determine how long it is in UTF-16 code units.
	 *
	 * @param string $text The natively encoded string to get the length of.
	 * @return int The length of the string in UTF-16 code units. Returns -1 if the length could not
	 *             be calculated.
	 */
	private static function utf_16_code_unit_length( $text ) {
		// If mb_convert_encoding() exists, we can use that for conversion.
		if ( function_exists( 'mb_convert_encoding' ) ) {
			// UTF-16 can add an additional code unit to the start of the string, called the
			// Byte Order Mark (BOM), which indicates whether the string is encoding as
			// big-endian, or little-endian. Since we don't want to count code unit, and the endianness
			// doesn't matter for our purposes, using PHP's UTF-16BE encoding uses big-endian
			// encoding, and ensures the BOM *won't* be prepended to the string to the string.
			return strlen( mb_convert_encoding( $text, 'UTF-16BE' ) ) / 2;
		}

		// If we can't convert this string, return a result that will avoid an incorrect annotation being added.
		return -1;
	}

	/**
	 * Extracts the tweetable text from a block.
	 *
	 * @param array $block A single block, as generated by parse_block().
	 * @return string The tweetable text from the block, in the correct template form.
	 */
	private static function extract_text_from_block( $block ) {
		// If the block doesn't have an innerHTMl, we're not going to get any text.
		if ( empty( $block['innerHTML'] ) ) {
			return '';
		}

		$block_def = self::get_block_definition( $block['blockName'] );

		// We currently only support extracting text from HTML text nodes.
		if ( ! isset( $block_def['content_location'] ) || 'html' !== $block_def['content_location'] ) {
			return '';
		}

		// Find out which tags we need to extract content from.
		if ( isset( $block_def['content'] ) && count( $block_def['content'] ) > 0 ) {
			$tags = $block_def['content'];
		} else {
			$tags = array( 'content' );
		}

		$tag_values = self::extract_tag_content_from_html( $tags, $block['innerHTML'] );

		// We can treat single line blocks as "multiline", with only one line in them.
		$lines = array();
		foreach ( $tag_values as $tag => $values ) {
			// For single-line blocks, we need to squash all the values for this tag into a single value.
			if ( 'multiline' !== $block_def['type'] ) {
				$values = array( implode( "\n", $values ) );
			}

			// Handle the special "content" tag.
			if ( 'content' === $tag ) {
				$placeholder = 'content';
			} else {
				$placeholder = array_search( $tag, $block_def['content'], true );
			}

			// Loop over each instance of this value, appling that value to the corresponding line template.
			foreach ( $values as $line_number => $value ) {
				if ( ! isset( $lines[ $line_number ] ) ) {
					$lines[ $line_number ] = $block_def['template'];
				}

				$lines[ $line_number ] = str_replace( '{{' . $placeholder . '}}', $value, $lines[ $line_number ] );
			}
		}

		// Remove any lines that didn't apply any content.
		$empty_template = preg_replace( '/{{.*?}}/', '', $block_def['template'] );
		$lines          = array_filter(
			$lines,
			function ( $line ) use ( $empty_template ) {
				return $line !== $empty_template;
			}
		);

		// Join the lines together into a single string.
		$text = implode( self::$line_separator, $lines );

		// Trim off any trailing whitespace that we no longer need.
		$text = preg_replace( '/(\s|' . self::$line_separator . ')+$/u', '', $text );

		return $text;
	}

	/**
	 * Extracts the tweetable media from a block.
	 *
	 * @param array $block A single block, as generated by parse_block().
	 * @return array {
	 *     An array of media.
	 *
	 *     @type string url The URL of the media.
	 *     @type string alt The alt text of the media.
	 * }
	 */
	private static function extract_media_from_block( $block ) {
		$block_def = self::get_block_definition( $block['blockName'] );

		$media = array();

		if ( 'image' === $block_def['type'] ) {
			$url = self::extract_attr_content_from_html(
				$block_def['content']['url'][0],
				$block_def['content']['url'][1],
				$block['innerHTML']
			);
			$alt = self::extract_attr_content_from_html(
				$block_def['content']['alt'][0],
				$block_def['content']['alt'][1],
				$block['innerHTML']
			);

			$img_count = count( $url );

			for ( $ii = 0; $ii < $img_count; $ii++ ) {
				$filedata = wp_check_filetype( basename( wp_parse_url( $url[ $ii ], PHP_URL_PATH ) ) );

				$media[] = array(
					'url'  => $url[ $ii ],
					'alt'  => self::is_valid_alt_text( $alt[ $ii ] ) ? $alt[ $ii ] : '',
					'type' => $filedata['type'],
				);
			}
		} elseif ( 'video' === $block_def['type'] ) {
			// Handle VideoPress videos.
			if ( isset( $block['attrs']['src'] ) && str_starts_with( $block['attrs']['src'], 'https://videos.files.wordpress.com/' ) ) {
				$url = array( $block['attrs']['src'] );
			} else {
				$url = self::extract_attr_content_from_html(
					$block_def['content']['url'][0],
					$block_def['content']['url'][1],
					$block['innerHTML']
				);
			}

			// We can only ever use the first video found, no need to go through all of them.
			if ( count( $url ) > 0 ) {
				$filedata = wp_check_filetype( basename( wp_parse_url( $url[0], PHP_URL_PATH ) ) );

				$media[] = array(
					'url'  => $url[0],
					'type' => $filedata['type'],
				);
			}
		}

		return $media;
	}

	/**
	 * Extracts the tweet URL from a Twitter embed block.
	 *
	 * @param array $block A single block, as generated by parse_block().
	 * @return string The tweet URL. Empty string if there is none available.
	 */
	private static function extract_tweet_from_block( $block ) {
		if (
			'core/embed' === $block['blockName']
			&& ( isset( $block['attrs']['providerNameSlug'] ) && 'twitter' === $block['attrs']['providerNameSlug'] )
		) {
			return $block['attrs']['url'];
		}

		return '';
	}

	/**
	 * Extracts URL from an embed block.
	 *
	 * @param array $block A single block, as generated by parse_block().
	 * @return string The URL. Empty string if there is none available.
	 */
	private static function extract_embed_from_block( $block ) {
		$block_def = self::get_block_definition( $block['blockName'] );

		if ( 'embed' !== $block_def['type'] ) {
			return '';
		}

		// Twitter embeds are handled in ::extract_tweet_from_block().
		if (
			'core/embed' === $block['blockName']
			&& ( isset( $block['attrs']['providerNameSlug'] ) && 'twitter' === $block['attrs']['providerNameSlug'] )
		) {
			return '';
		}

		$url = '';
		if ( 'block-attributes' === $block_def['content_location'] ) {
			$url = $block['attrs'][ $block_def['content'][0] ];
		}

		if ( 'jetpack/gif' === $block['blockName'] ) {
			$url = str_replace( '/embed/', '/gifs/', $url );
		}

		return $url;
	}

	/**
	 * There's a bunch of left-over cruft in the tweets array that we don't need to return. Removing
	 * it helps keep the size of the data down.
	 */
	private static function clean_return_tweets() {
		// Before we return, clean out unnecessary cruft from the return data.
		$tweets = array_map(
			function ( $tweet ) {
				// Remove tweets that don't have anything saved in them. eg, if the last block is a
				// header with no text, it'll force a new tweet, but we won't end up putting anything
				// in that tweet.
				if ( ! $tweet['changed'] ) {
					return false;
				}

				// Replace any URL placeholders that appear in the text.
				$tweet['urls'] = array();
				foreach ( self::$urls as $id => $url ) {
					$count = 0;

					$tweet['text'] = str_replace( str_pad( "url-placeholder-$id", self::$characters_per_url, '-' ), $url, $tweet['text'], $count );

					// If we found a URL, keep track of it for the editor.
					if ( $count > 0 ) {
						$tweet['urls'][] = $url;
					}
				}

				// Remove any inline placeholders.
				$tweet['text'] = str_replace( self::$inline_placeholder, '', $tweet['text'] );

				// If the tweet text consists only of whitespace, we can remove all of it.
				if ( preg_match( '/^\s*$/u', $tweet['text'] ) ) {
					$tweet['text'] = '';
				}

				// Remove trailing whitespace from every line.
				$tweet['text'] = preg_replace( '/\p{Z}+$/um', '', $tweet['text'] );

				// Remove all trailing whitespace (including line breaks) from the end of the text.
				$tweet['text'] = rtrim( $tweet['text'] );

				// Remove internal flags.
				unset( $tweet['changed'] );
				unset( $tweet['finished'] );

				// Remove bulky block data.
				if ( ! isset( $tweet['blocks'][0]['attributes'] ) && ! isset( $tweet['blocks'][0]['clientId'] ) ) {
					$tweet['blocks'] = array();
				} else {
					// Remove the parts of the block data that the editor doesn't need.
					$block_count = count( $tweet['blocks'] );
					for ( $ii = 0; $ii < $block_count; $ii++ ) {
						$keys = array_keys( $tweet['blocks'][ $ii ] );
						foreach ( $keys as $key ) {
							// The editor only needs these attributes, everything else will be unset.
							if ( in_array( $key, array( 'attributes', 'clientId' ), true ) ) {
								continue;
							}

							unset( $tweet['blocks'][ $ii ][ $key ] );
						}
					}
				}

				// Once we've finished cleaning up, check if there's anything left to be tweeted.
				if ( empty( $tweet['text'] ) && empty( $tweet['media'] ) && empty( $tweet['tweet'] ) ) {
					return false;
				}

				return $tweet;
			},
			self::$tweets
		);

		// Clean any removed tweets out of the result.
		return array_values( array_filter( $tweets, 'is_array' ) );
	}

	/**
	 * Given a list of tags and a HTML blob, this will extract the text content inside
	 * each of the given tags.
	 *
	 * @param array  $tags An array of tag names.
	 * @param string $html A blob of HTML.
	 * @return array An array of the extract content. The keys in the array are the $tags,
	 *               each value is an array. The value array is indexed in the same order as the tag
	 *               appears in the HTML blob, including nested tags.
	 */
	private static function extract_tag_content_from_html( $tags, $html ) {
		// Serialised blocks will sometimes wrap the innerHTML in newlines, but those newlines
		// are removed when innerHTML is parsed into an attribute. Remove them so we're working
		// with the same information.
		if ( "\n" === $html[0] && "\n" === $html[ strlen( $html ) - 1 ] ) {
			$html = substr( $html, 1, strlen( $html ) - 2 );
		}

		// Normalise <br>.
		$html = preg_replace( '/<br\s*\/?>/', '<br>', $html );

		// If there were no tags passed, assume the entire text is required.
		if ( empty( $tags ) ) {
			$tags = array( 'content' );
		}

		$values = array();

		$tokens = wp_html_split( $html );

		$validator = new Twitter_Validator();

		foreach ( $tags as $tag ) {
			$values[ $tag ] = array();

			// Since tags can be nested, keeping track of the nesting level allows
			// us to extract nested content into a flat array.
			if ( 'content' === $tag ) {
				// The special "content" tag means we should store the entire content,
				// so assume the tag is open from the beginning.
				$opened = 0;
				$closed = -1;

				$values['content'][0] = '';
			} else {
				$opened = -1;
				$closed = -1;
			}

			// When we come across a URL, we need to keep track of it, so it can then be inserted
			// in the right place.
			$current_url = '';
			foreach ( $tokens as $token ) {
				if ( 0 === strlen( $token ) ) {
					// Skip any empty tokens.
					continue;
				}

				// If we're currently storing content, check if it's a text-formatting
				// tag that we should apply.
				if ( $opened !== $closed ) {
					// End of a paragraph, put in some newlines (as long as we're not extracting paragraphs).
					if ( '</p>' === $token && 'p' !== $tag ) {
						$values[ $tag ][ $opened ] .= "\n\n";
					}

					// A line break gets one newline.
					if ( '<br>' === $token ) {
						$values[ $tag ][ $opened ] .= "\n";
					}

					// A link has opened, grab the URL for inserting later.
					if ( str_starts_with( $token, '<a ' ) ) {
						$href_values = self::extract_attr_content_from_html( 'a', 'href', $token );
						if ( ! empty( $href_values[0] ) && $validator->isValidURL( $href_values[0] ) ) {
							// Remember the URL.
							$current_url = $href_values[0];
						}
					}

					// A link has closed, insert the URL from that link if we have one.
					if ( '</a>' === $token && '' !== $current_url ) {
						// Generate a unique-to-this-block placeholder which takes up the
						// same number of characters as a URL does.
						$values[ $tag ][ $opened ] .= ' (' . self::generate_url_placeholder( $current_url ) . ')';

						$current_url = '';
					}

					// We don't return inline images, but they technically take up 1 character in the RichText.
					if ( str_starts_with( $token, '<img ' ) ) {
						$values[ $tag ][ $opened ] .= self::$inline_placeholder;
					}
				}

				if ( "<$tag>" === $token || str_starts_with( $token, "<$tag " ) ) {
					// A tag has just been opened.
					++$opened;
					// Set an empty value now, so we're keeping track of empty tags.
					if ( ! isset( $values[ $tag ][ $opened ] ) ) {
						$values[ $tag ][ $opened ] = '';
					}
					continue;
				}

				if ( "</$tag>" === $token ) {
					// The tag has been closed.
					++$closed;
					continue;
				}

				if ( '<' === $token[0] ) {
					// We can skip any other tags.
					continue;
				}

				if ( $opened !== $closed ) {
					// We're currently in a tag, with some content. Start by decoding any HTML entities.
					$token = html_entity_decode( $token, ENT_QUOTES );

					// Find any URLs in this content, and replace them with a placeholder.
					preg_match_all( Twitter_Regex::getValidUrlMatcher(), $token, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE );
					$offset = 0;
					foreach ( $matches as $match ) {
						list( $url, $start ) = $match[2];

						$token = substr_replace( $token, self::generate_url_placeholder( $url ), $start + $offset, strlen( $url ) );

						$offset += self::$characters_per_url - strlen( $url );

						// If we're in a link with a URL set, there's no need to keep two copies of the same link.
						if ( ! empty( $current_url ) ) {
							$lower_url         = strtolower( $url );
							$lower_current_url = strtolower( $current_url );

							if ( $lower_url === $lower_current_url ) {
								$current_url = '';
							}

							// Check that the link text isn't just a shortened version of the href value.
							$trimmed_current_url = preg_replace( '|^https?://|', '', $lower_current_url );
							if ( $lower_url === $trimmed_current_url || trim( $trimmed_current_url, '/' ) === $lower_url ) {
								$current_url = '';
							}
						}
					}

					// Append it to the right value.
					$values[ $tag ][ $opened ] .= $token;
				}
			}
		}

		return $values;
	}

	/**
	 * Extracts the attribute content from a tag.
	 *
	 * This method allows for the HTML to have multiple instances of the tag, and will return
	 * an array containing the attribute value (or an empty string, if the tag doesn't have the
	 * requested attribute) for each occurrence of the tag.
	 *
	 * @param string $tag          The tag we're looking for.
	 * @param string $attr         The name of the attribute we're looking for.
	 * @param string $html         The HTML we're searching through.
	 * @param array  $attr_filters Optional. Filters tags based on whether or not they have attributes with given values.
	 * @return array The array of attribute values found.
	 */
	private static function extract_attr_content_from_html( $tag, $attr, $html, $attr_filters = array() ) {
		// Given our single tag and attribute, construct a KSES filter for it.
		$kses_filter = array(
			$tag => array(
				$attr => array(),
			),
		);

		foreach ( $attr_filters as $filter_attr => $filter_value ) {
			$kses_filter[ $tag ][ $filter_attr ] = array();
		}

		// Remove all HTML except for the tag we're after. On that tag,
		// remove all attributes except for the one we're after.
		$stripped_html = wp_kses( $html, $kses_filter );

		$values = array();

		$tokens = wp_html_split( $stripped_html );
		foreach ( $tokens as $token ) {
			$found_value = '';

			if ( 0 === strlen( $token ) ) {
				// Skip any empty tokens.
				continue;
			}

			if ( '<' !== $token[0] ) {
				// We can skip any non-tag tokens.
				continue;
			}

			$token_attrs = wp_kses_attr_parse( $token );

			// Skip tags that KSES couldn't handle.
			if ( false === $token_attrs ) {
				continue;
			}

			// Remove the tag open and close chunks.
			$found_tag = array_shift( $token_attrs );
			array_pop( $token_attrs );

			// We somehow got a tag that isn't the one we're after. Skip it.
			if ( ! str_starts_with( $found_tag, "<$tag " ) ) {
				continue;
			}

			// We can only fail an attribute filter if one is set.
			$passed_filter = count( $attr_filters ) === 0;

			foreach ( $token_attrs as $token_attr_string ) {
				// The first "=" in the string will be between the attribute name/value.
				list( $token_attr_name, $token_attr_value ) = explode( '=', $token_attr_string, 2 );

				$token_attr_name  = trim( $token_attr_name );
				$token_attr_value = trim( $token_attr_value );

				// Remove a single set of quotes from around the value.
				if ( '' !== $token_attr_value && in_array( $token_attr_value[0], array( '"', "'" ), true ) ) {
					$token_attr_value = trim( $token_attr_value, $token_attr_value[0] );
				}

				// If this is the attribute we're after, save the value for the end of the loop.
				if ( $token_attr_name === $attr ) {
					$found_value = $token_attr_value;
				}

				if ( isset( $attr_filters[ $token_attr_name ] ) && $attr_filters[ $token_attr_name ] === $token_attr_value ) {
					$passed_filter = true;
				}
			}

			if ( $passed_filter ) {
				// We always want to append the found value, even if we didn't "find" a matching attribute.
				// An empty string in the return value means that we found the tag, but the attribute was
				// either empty, or not set.
				$values[] = html_entity_decode( $found_value, ENT_QUOTES );
			}
		}

		return $values;
	}

	/**
	 * Generates a placeholder for URLs, using the appropriate number of characters to imitate how
	 * Twitter counts the length of URLs in tweets.
	 *
	 * @param string $url The URL to generate a placeholder for.
	 * @return string The placeholder.
	 */
	public static function generate_url_placeholder( $url ) {
		self::$urls[] = $url;

		return str_pad( 'url-placeholder-' . ( count( self::$urls ) - 1 ), self::$characters_per_url, '-' );
	}

	/**
	 * Retrieves the Twitter card data for a list of URLs.
	 *
	 * @param array $urls The list of URLs to grab Twitter card data for.
	 * @return array The Twitter card data.
	 */
	public static function generate_cards( $urls ) {
		$validator = new Twitter_Validator();

		$requests = array_map(
			function ( $url ) use ( $validator ) {
				if (
					false !== wp_http_validate_url( $url )
					&& $validator->isValidURL( $url )
				) {
					return array(
						'url' => $url,
					);
				}

				return false;
			},
			$urls
		);

		$requests = array_filter( $requests );

		// @todo Remove this check when wpcom picks up the new Requests lib (it seems it was skipped during their update to 6.2)
		if ( ! class_exists( '\WpOrg\Requests\Hooks' ) ) {
			$hooks = new Requests_Hooks();
		} else {
			$hooks = new \WpOrg\Requests\Hooks();
		}

		$hooks->register(
			'requests.before_redirect',
			array( self::class, 'validate_redirect_url' )
		);

		// @todo Remove this check when wpcom picks up the new Requests lib (it seems it was skipped during their update to 6.2)
		$results = class_exists( '\WpOrg\Requests\Requests' )
			? \WpOrg\Requests\Requests::request_multiple( $requests, array( 'hooks' => $hooks ) )
			: Requests::request_multiple( $requests, array( 'hooks' => $hooks ) );

		foreach ( $results as $result ) {
			if ( $result instanceof Requests_Exception || $result instanceof \WpOrg\Requests\Exception ) {
				return new WP_Error(
					'invalid_url',
					__( 'Sorry, something is wrong with the requested URL.', 'jetpack' ),
					403
				);
			}
		}

		$card_data = array(
			'creator'     => array(
				'name' => 'twitter:creator',
			),
			'description' => array(
				'name'     => 'twitter:description',
				'property' => 'og:description',
			),
			'image'       => array(
				'name'     => 'twitter:image',
				'property' => 'og:image',
			),
			'title'       => array(
				'name'     => 'twitter:text:title',
				'property' => 'og:title',
			),
			'type'        => array(
				'name' => 'twitter:card',
			),
		);

		$cards = array();
		foreach ( $results as $id => $result ) {
			$url = $requests[ $id ]['url'];

			if ( ! $result->success ) {
				$cards[ $url ] = array(
					'error' => 'invalid_url',
				);
				continue;
			}

			$url_card_data = array();

			foreach ( $card_data as $key => $filters ) {
				foreach ( $filters as $attribute => $value ) {
					$found_data = self::extract_attr_content_from_html( 'meta', 'content', $result->body, array( $attribute => $value ) );
					if ( count( $found_data ) > 0 && strlen( $found_data[0] ) > 0 ) {
						$url_card_data[ $key ] = html_entity_decode( $found_data[0], ENT_QUOTES );
						break;
					}
				}
			}

			if ( count( $url_card_data ) > 0 ) {
				$cards[ $url ] = $url_card_data;
			} else {
				$cards[ $url ] = array(
					'error' => 'no_og_data',
				);
			}
		}

		return $cards;
	}

	/**
	 * Filters the redirect URLs that can appear when requesting passed URLs.
	 *
	 * @param String $redirect_url the URL to which a redirect is requested.
	 * @throws Requests_Exception        In case the URL is not validated, if WP version is less than 6.2.
	 * @throws \WpOrg\Requests\Exception In case the URL is not validated, if WP version is 6.2 or greater.
	 * @return void
	 */
	public static function validate_redirect_url( $redirect_url ) {
		if ( ! wp_http_validate_url( $redirect_url ) ) {
			// @todo Remove this check when wpcom picks up the new Requests lib (it seems it was skipped during their update to 6.2)
			if ( ! class_exists( '\WpOrg\Requests\Exception' ) ) {
				throw new Requests_Exception( __( 'A valid URL was not provided.', 'jetpack' ), 'wp_http.redirect_failed_validation' );
			}
			throw new \WpOrg\Requests\Exception( __( 'A valid URL was not provided.', 'jetpack' ), 'wp_http.redirect_failed_validation' );
		}
	}
}
