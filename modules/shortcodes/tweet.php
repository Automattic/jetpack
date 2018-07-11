<?php
/**
 * Tweet shortcode.
 * Params map to key value pairs, and all but tweet are optional:
 * tweet = id or permalink url* (Required)
 * align = none|left|right|center
 * width = number in pixels  example: width="300"
 * lang  =  en|fr|de|ko|etc...  language country code.
 * hide_thread = true | false **
 * hide_media  = true | false **
 *
 * Basic:
 * [tweet https://twitter.com/jack/statuses/20 width="350"]
 *
 * More parameters and another tweet syntax admitted:
 * [tweet tweet="https://twitter.com/jack/statuses/20" align="left" width="350" align="center" lang="es"]
 */

add_shortcode( 'tweet', array( 'Jetpack_Tweet', 'jetpack_tweet_shortcode' ) );
add_action( 'enqueue_block_editor_assets', array( 'Jetpack_Tweet', 'enqueue_block_editor_assets' ) );

class Jetpack_Tweet {

	static $provider_args;

	/**
	 * Parse shortcode arguments and render its output.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts Shortcode parameters.
	 *
	 * @return string
	 */
	static public function jetpack_tweet_shortcode( $atts ) {
		$default_atts = array(
			'tweet'       => '',
			'align'       => 'none',
			'width'       => '',
			'lang'        => 'en',
			'hide_thread' => 'false',
			'hide_media'  => 'false',
		);

		$attr = shortcode_atts( $default_atts, $atts );

		self::$provider_args = $attr;

		// figure out the tweet id for the requested tweet
		// supporting both omitted attributes and tweet="tweet_id"
		// and supporting both an id and a URL
		if ( empty( $attr['tweet'] ) && ! empty( $atts[0] ) ) {
			$attr['tweet'] = $atts[0];
		}

		if ( ctype_digit( $attr['tweet'] ) ) {
			$id = 'https://twitter.com/jetpack/status/' . $attr['tweet'];
		} else {
			preg_match( '/^http(s|):\/\/twitter\.com(\/\#\!\/|\/)([a-zA-Z0-9_]{1,20})\/status(es)*\/(\d+)$/', $attr['tweet'], $urlbits );

			if ( isset( $urlbits[5] ) && intval( $urlbits[5] ) ) {
				$id = 'https://twitter.com/' . $urlbits[3] . '/status/' . intval( $urlbits[5] );
			} else {
				return '<!-- Invalid tweet id -->';
			}
		}

		// Add shortcode arguments to provider URL
		add_filter( 'oembed_fetch_url', array( 'Jetpack_Tweet', 'jetpack_tweet_url_extra_args' ), 10, 3 );

		// Fetch tweet
		$output = wp_oembed_get( $id, $atts );

		// Clean up filter
		remove_filter( 'oembed_fetch_url', array( 'Jetpack_Tweet', 'jetpack_tweet_url_extra_args' ), 10 );

		// Add Twitter widgets.js script to the footer.
		add_action( 'wp_footer', array( 'Jetpack_Tweet', 'jetpack_tweet_shortcode_script' ) );

		/** This action is documented in modules/widgets/social-media-icons.php */
		do_action( 'jetpack_bump_stats_extras', 'embeds', 'tweet' );

		return $output;
	}

	/**
	 * Adds parameters to URL used to fetch the tweet.
	 *
	 * @since 4.5.0
	 *
	 * @param string $provider URL of provider that supplies the tweet we're requesting.
	 * @param string $url      URL of tweet to embed.
	 * @param array  $args     Parameters supplied to shortcode and passed to wp_oembed_get
	 *
	 * @return string
	 */
	static public function jetpack_tweet_url_extra_args( $provider, $url, $args = array() ) {
		foreach ( self::$provider_args as $key => $value ) {
			switch ( $key ) {
				case 'align':
				case 'lang':
				case 'hide_thread':
				case 'hide_media':
					$provider = add_query_arg( $key, $value, $provider );
					break;
			}
		}

		// Disable script since we're enqueing it in our own way in the footer
		$provider = add_query_arg( 'omit_script', 'true', $provider );

		// Twitter doesn't support maxheight so don't send it
		$provider = remove_query_arg( 'maxheight', $provider );

		/**
		 * Filter the Twitter Partner ID.
		 *
		 * @module shortcodes
		 *
		 * @since 4.6.0
		 *
		 * @param string $partner_id Twitter partner ID.
		 */
		$partner = apply_filters( 'jetpack_twitter_partner_id', 'jetpack' );

		// Add Twitter partner ID to track embeds from Jetpack
		if ( ! empty( $partner ) ) {
			$provider = add_query_arg( 'partner', $partner, $provider );
		}

		return $provider;
	}

	/**
	 * Enqueue front end assets.
	 *
	 * @since 4.5.0
	 */
	static public function jetpack_tweet_shortcode_script() {
		if ( ! wp_script_is( 'twitter-widgets', 'registered' ) ) {
			wp_register_script( 'twitter-widgets', 'https://platform.twitter.com/widgets.js', array(), JETPACK__VERSION, true );
			wp_print_scripts( 'twitter-widgets' );
		}
	}

	static public function enqueue_block_editor_assets() {
		wp_register_script(
			'jetpack-shortcode-tweet-gutenberg',
			null,
			array( 'wp-blocks', 'wp-i18n', 'wp-element', 'shortcode' )
		);
		wp_enqueue_script( 'jetpack-shortcode-tweet-gutenberg' );

		ob_start();
		self::jetpack_shortcode_tweet_gutenberg_script();
		$content = ob_get_clean();

		wp_script_add_data( 'jetpack-shortcode-tweet-gutenberg', 'data', $content );
	}

	static public function jetpack_shortcode_tweet_gutenberg_script() {
?>
// <script>
( function( wp ) {
	var el = wp.element.createElement;

	wp.blocks.registerBlockType( 'jetpack/tweet', {
		title: wp.i18n.__( 'Tweet', 'jetpack' ),
		icon: 'twitter',
		category: 'layout',

		attributes : function( content ) {
			console.log( content );
			var shortcode = wp.shortcode.next( 'tweet', content ),
				data = {};

			if ( shortcode.attrs.named.tweet ) {
				data.tweet = shortcode.attrs.named.tweet;
			} else if ( shortcode.attrs.numeric[0] ) {
				data.tweet = shortcode.attrs.numeric[0];
			}

			if ( shortcode.attrs.named.align ) {
				data.align = shortcode.attrs.named.align;
			}

			if ( shortcode.attrs.named.width ) {
				data.width = shortcode.attrs.named.width;
			}

			if ( shortcode.attrs.named.lang ) {
				data.lang = shortcode.attrs.named.lang;
			}

			if ( shortcode.attrs.named.hide_thread ) {
				data.hide_thread = shortcode.attrs.named.hide_thread;
			}

			if ( shortcode.attrs.named.hide_media ) {
				data.hide_media = shortcode.attrs.named.hide_media;
			}

			return data;
		},

		edit : function( props ) {
			return [
				!! props.focus && el(
					wp.blocks.BlockControls,
					{ key : 'controls' },
					el(
						wp.blocks.AlignmentToolbar,
						{
							key : '<?php echo md5( __FILE__ . __LINE__ ); ?>',
							value    : props.attributes.align,
							onChange : function( newAlignment ) {
								props.setAttributes( {
									align : newAlignment
								} );
							}
						}
					)
				),
				!! props.focus && el(
					wp.blocks.InspectorControls,
					{ key : 'inspector' },
					[
						el(
							wp.blocks.BlockDescription,
							{ key : '<?php echo md5( __FILE__ . __LINE__ ); ?>' },
							el(
								'p',
								null,
								wp.i18n.__( 'Optional embed settings:' )
							)
						),
						el(
							'label',
							{ key : '<?php echo md5( __FILE__ . __LINE__ ); ?>' },
							el(
								'label',
								{ key : '<?php echo md5( __FILE__ . __LINE__ ); ?>' },
								[
									wp.i18n.__( 'Width:' ),
									el(
										'input',
										{
											key : '<?php echo md5( __FILE__ . __LINE__ ); ?>',
											type : 'number',
											min : 100,
											value : props.attributes.width,
											onChange : function( newWidth ) {
												props.setAttributes( {
													width : newWidth.target.value
												} );
											}
										}
									)
								]
							)
						),
					]
				),
				el(
					'input',
					{
						key : '<?php echo md5( __FILE__ . __LINE__ ); ?>',
						name : 'tweet',
						type : 'url',
						value : props.attributes.tweet,
						onChange: function( event ) {
							props.setAttributes({
								tweet : event.target.value
							});
						}
					},
					null
				)
			];
		},

		save : function( props ) {
			var args = {
				tag     : 'tweet',
				type    : 'single',
				attrs   : {
					named   : {},
					numeric : [
						props.attributes.tweet
					]
				}
			};

			// Populate optional attributes.
			if ( props.attributes.align && props.attributes.align !== 'none' ) {
				args.attrs.named.align = props.attributes.align;
			}
			if ( props.attributes.width && props.attributes.width !== '' ) {
				args.attrs.named.width = props.attributes.width;
			}
			if ( props.attributes.lang && props.attributes.lang !== 'en' ) {
				args.attrs.named.lang = props.attributes.lang;
			}
			if ( props.attributes.hide_thread && props.attributes.hide_thread !== 'none' ) {
				args.attrs.named.hide_thread = props.attributes.hide_thread;
			}
			if ( props.attributes.hide_media && props.attributes.hide_media !== 'none' ) {
				args.attrs.named.hide_media = props.attributes.hide_media;
			}

			// If there's a className to be set, wrap it in a div so it can be set on that.
			if ( props.className || props.attributes.className ) {
				return el(
					'div',
					{
						// This is necessary so React doesn't turn `"` into `&quot;`
						dangerouslySetInnerHTML: {
							__html: wp.shortcode.string( args )
						}
					}
				);
			}

			return wp.shortcode.string( args );
		}

	} );
} )( window.wp );
// </script>
<?php
	}

} // class end
