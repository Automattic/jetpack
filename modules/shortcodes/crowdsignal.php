<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Crowosignal (ne PollDaddy) shortcode.
 *
 * Formats:
 * [polldaddy type="iframe" survey="EB151947E5950FCF" height="auto" domain="jeherve" id="a-survey-with-branches"]
 * https://polldaddy.com/poll/7910844/
 * https://jeherve.survey.fm/a-survey
 * https://jeherve.survey.fm/a-survey-with-branches
 * [crowdsignal type="iframe" survey="7676FB1FF2B56CE9" height="auto" domain="jeherve" id="a-survey"]
 * [crowdsignal poll=9541291]
 *
 * @package Jetpack
 */

// Keep compatibility with the PollDaddy plugin.
if (
	! class_exists( 'CrowdsignalShortcode' )
	&& ! class_exists( 'PolldaddyShortcode' )
) {
	/**
	 * Class wrapper for Crowdsignal shortcodes
	 */
	class CrowdsignalShortcode {

		/**
		 * Should the Crowdsignal JavaScript be added to the page?
		 *
		 * @var bool
		 */
		private static $add_script = false;

		/**
		 * Array of Polls / Surveys present on the page, and that need to be added.
		 *
		 * @var bool|array
		 */
		private static $scripts = false;

		/**
		 * Add all the actions & resgister the shortcode.
		 */
		public function __construct() {
			add_shortcode( 'crowdsignal', array( $this, 'crowdsignal_shortcode' ) );
			add_shortcode( 'polldaddy', array( $this, 'crowdsignal_shortcode' ) );

			add_filter( 'pre_kses', array( $this, 'crowdsignal_embed_to_shortcode' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'check_infinite' ) );
			add_action( 'infinite_scroll_render', array( $this, 'crowdsignal_shortcode_infinite' ), 11 );
		}

		/**
		 * JavaScript code for a specific survey / poll.
		 *
		 * @param array  $settings Array of information about a survey / poll.
		 * @param string $survey_link HTML link tag for a specific survey or poll.
		 */
		private function get_async_code( array $settings, $survey_link ) {
			$include = <<<CONTAINER
( function( d, c, j ) {
	if ( !d.getElementById( j ) ) {
		var pd = d.createElement( c ), s;
		pd.id = j;
		pd.src = 'https://polldaddy.com/survey.js';
		s = d.getElementsByTagName( c )[0];
		s.parentNode.insertBefore( pd, s );
	}
}( document, 'script', 'pd-embed' ) );
CONTAINER;

			// Compress it a bit.
			$include = $this->compress_it( $include );

			$placeholder = sprintf(
				'<div class="cs-embed pd-embed" data-settings="%s"></div>',
				esc_attr( wp_json_encode( $settings ) )
			);

			if ( 'button' === $settings['type'] ) {
				$placeholder = sprintf(
					'<a class="cs-embed pd-embed" href="%1$s" data-settings="%2$s">%3$s</a>',
					esc_attr( $survey_link ),
					esc_attr( wp_json_encode( $settings ) ),
					esc_html( $settings['title'] )
				);
			}

			$js_include  = $placeholder . "\n";
			$js_include .= '<script type="text/javascript"><!--//--><![CDATA[//><!--' . "\n";
			$js_include .= $include . "\n";
			$js_include .= "//--><!]]></script>\n";

			if ( 'button' !== $settings['type'] ) {
				$js_include .= '<noscript>' . $survey_link . "</noscript>\n";
			}

			return $js_include;
		}

		/**
		 * Compress a JavaScript snippet before it's added to the page.
		 *
		 * @param string $js JavaScript snippet.
		 */
		private function compress_it( $js ) {
			$js = str_replace( array( "\n", "\t", "\r" ), '', $js );
			$js = preg_replace( '/\s*([,:\?\{;\-=\(\)])\s*/', '$1', $js );
			return $js;
		}

		/**
		 * Crowdsignal Poll Embed script - transforms code that looks like that:
		 * <script type="text/javascript" charset="utf-8" async src="http://static.polldaddy.com/p/123456.js"></script>
		 * <noscript><a href="http://polldaddy.com/poll/123456/">What is your favourite color?</a></noscript>
		 * into the [crowdsignal poll=...] shortcode format
		 *
		 * @param string $content Post content.
		 */
		public function crowdsignal_embed_to_shortcode( $content ) {

			if ( ! is_string( $content ) || false === strpos( $content, 'polldaddy.com/p/' ) ) {
				return $content;
			}

			$regexes = array();

			$regexes[] = '#<script[^>]+?src="https?://(secure|static)\.polldaddy\.com/p/([0-9]+)\.js"[^>]*+>\s*?</script>\r?\n?(<noscript>.*?</noscript>)?#i';

			$regexes[] = '#&lt;script(?:[^&]|&(?!gt;))+?src="https?://(secure|static)\.polldaddy\.com/p/([0-9]+)\.js"(?:[^&]|&(?!gt;))*+&gt;\s*?&lt;/script&gt;\r?\n?(&lt;noscript&gt;.*?&lt;/noscript&gt;)?#i';

			foreach ( $regexes as $regex ) {
				if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) ) {
					continue;
				}

				foreach ( $matches as $match ) {
					if ( ! isset( $match[2] ) ) {
						continue;
					}

					$id = (int) $match[2];

					if ( $id > 0 ) {
						$content = str_replace( $match[0], " [crowdsignal poll=$id]", $content );
						/** This action is documented in modules/shortcodes/youtube.php */
						do_action( 'jetpack_embed_to_shortcode', 'crowdsignal', $id );
					}
				}
			}

			return $content;
		}

		/**
		 * Shortcode for polldadddy
		 * [crowdsignal poll|survey|rating="123456"]
		 *
		 * @param array $atts Shortcode attributes.
		 */
		public function crowdsignal_shortcode( $atts ) {
			global $post;
			global $content_width;

			$attributes = shortcode_atts(
				array(
					'survey'     => null,
					'link_text'  => esc_html__( 'Take Our Survey', 'jetpack' ),
					'poll'       => 'empty',
					'rating'     => 'empty',
					'unique_id'  => null,
					'item_id'    => null,
					'title'      => null,
					'permalink'  => null,
					'cb'         => 0,
					'type'       => 'button',
					'body'       => '',
					'button'     => '',
					'text_color' => '000000',
					'back_color' => 'FFFFFF',
					'align'      => '',
					'style'      => '',
					'width'      => $content_width,
					'height'     => floor( $content_width * 3 / 4 ),
					'delay'      => 100,
					'visit'      => 'single',
					'domain'     => '',
					'id'         => '',
				),
				$atts,
				'crowdsignal'
			);

			if ( ! is_array( $atts ) ) {
				return '<!-- Crowdsignal shortcode passed invalid attributes -->';
			}

			$inline          = ! in_the_loop();
			$no_script       = false;
			$infinite_scroll = false;

			if ( is_home() && current_theme_supports( 'infinite-scroll' ) ) {
				$infinite_scroll = true;
			}

			if ( defined( 'PADPRESS_LOADED' ) ) {
				$inline = true;
			}

			if ( function_exists( 'get_option' ) && get_option( 'polldaddy_load_poll_inline' ) ) {
				$inline = true;
			}

			if ( is_feed() || ( defined( 'DOING_AJAX' ) && ! $infinite_scroll ) ) {
				$no_script = false;
			}

			self::$add_script = $infinite_scroll;

			if ( intval( $attributes['rating'] ) > 0 && ! $no_script ) { // rating embed.

				if ( empty( $attributes['unique_id'] ) ) {
					$attributes['unique_id'] = is_page() ? 'wp-page-' . $post->ID : 'wp-post-' . $post->ID;
				}

				if ( empty( $attributes['item_id'] ) ) {
					$attributes['item_id'] = is_page() ? '_page_' . $post->ID : '_post_' . $post->ID;
				}

				if ( empty( $attributes['title'] ) ) {
					/** This filter is documented in core/src/wp-includes/general-template.php */
					$attributes['title'] = apply_filters( 'wp_title', $post->post_title, '', '' );
				}

				if ( empty( $attributes['permalink'] ) ) {
					$attributes['permalink'] = get_permalink( $post->ID );
				}

				$rating    = intval( $attributes['rating'] );
				$unique_id = preg_replace( '/[^\-_a-z0-9]/i', '', wp_strip_all_tags( $attributes['unique_id'] ) );
				$item_id   = wp_strip_all_tags( $attributes['item_id'] );
				$item_id   = preg_replace( '/[^_a-z0-9]/i', '', $item_id );

				$settings = wp_json_encode(
					array(
						'id'        => $rating,
						'unique_id' => $unique_id,
						'title'     => rawurlencode( trim( $attributes['title'] ) ),
						'permalink' => esc_url( $attributes['permalink'] ),
						'item_id'   => $item_id,
					)
				);

				$item_id = esc_js( $item_id );

				if ( Jetpack_AMP_Support::is_amp_request() ) {
					return sprintf(
						'<a href="%s" target="_blank">%s</a>',
						esc_url( $attributes['permalink'] ),
						esc_html( trim( $attributes['title'] ) )
					);
				} elseif ( $inline ) {
					return <<<SCRIPT
<div class="cs-rating pd-rating" id="pd_rating_holder_{$rating}{$item_id}"></div>
<script type="text/javascript" charset="UTF-8"><!--//--><![CDATA[//><!--
PDRTJS_settings_{$rating}{$item_id}={$settings};
//--><!]]></script>
<script type="text/javascript" charset="UTF-8" async src="https://polldaddy.com/js/rating/rating.js"></script>
SCRIPT;
				} else {
					if ( false === self::$scripts ) {
						self::$scripts = array();
					}

					$data = array(
						'id'       => $rating,
						'item_id'  => $item_id,
						'settings' => $settings,
					);

					self::$scripts['rating'][] = $data;

					add_action( 'wp_footer', array( $this, 'generate_scripts' ) );

					$data = esc_attr( wp_json_encode( $data ) );

					if ( $infinite_scroll ) {
						return <<<CONTAINER
<div class="cs-rating pd-rating" id="pd_rating_holder_{$rating}{$item_id}" data-settings="{$data}"></div>
CONTAINER;
					} else {
						return <<<CONTAINER
<div class="cs-rating pd-rating" id="pd_rating_holder_{$rating}{$item_id}"></div>
CONTAINER;
					}
				}
			} elseif ( intval( $attributes['poll'] ) > 0 ) { // poll embed.

				if ( empty( $attributes['title'] ) ) {
					$attributes['title'] = esc_html__( 'Take Our Poll', 'jetpack' );
				}

				$poll      = intval( $attributes['poll'] );
				$poll_url  = sprintf( 'https://poll.fm/%d', $poll );
				$poll_js   = sprintf( 'https://secure.polldaddy.com/p/%d.js', $poll );
				$poll_link = sprintf( '<a href="%s" target="_blank">%s</a>', esc_url( $poll_url ), esc_html( $attributes['title'] ) );

				if ( $no_script || Jetpack_AMP_Support::is_amp_request() ) {
					return $poll_link;
				} else {
					if (
						'slider' === $attributes['type']
						&& ! $inline
					) {

						if ( ! in_array(
							$attributes['visit'],
							array( 'single', 'multiple' ),
							true
						) ) {
							$attributes['visit'] = 'single';
						}

						$settings = array(
							'type'  => 'slider',
							'embed' => 'poll',
							'delay' => intval( $attributes['delay'] ),
							'visit' => $attributes['visit'],
							'id'    => intval( $poll ),
						);

						return $this->get_async_code( $settings, $poll_link );
					} else {
						if ( 1 === $attributes['cb'] ) {
							$attributes['cb'] = '?cb=' . mktime();
						} else {
							$attributes['cb'] = false;
						}
						$margins = '';
						$float   = '';

						if ( in_array(
							$attributes['align'],
							array( 'right', 'left' ),
							true
						) ) {
							$float = sprintf( 'float: %s;', $attributes['align'] );

							if ( 'left' === $attributes['align'] ) {
								$margins = 'margin: 0px 10px 0px 0px;';
							} elseif ( 'right' === $attributes['align'] ) {
								$margins = 'margin: 0px 0px 0px 10px';
							}
						}

						/*
						 * Force the normal style embed on single posts/pages
						 * otherwise it's not rendered on infinite scroll themed blogs
						 * ('infinite_scroll_render' isn't fired)
						 */
						if ( is_singular() ) {
							$inline = true;
						}

						if ( false === $attributes['cb'] && ! $inline ) {
							if ( false === self::$scripts ) {
								self::$scripts = array();
							}

							$data = array( 'url' => $poll_js );

							self::$scripts['poll'][ intval( $poll ) ] = $data;

							add_action( 'wp_footer', array( $this, 'generate_scripts' ) );

							$data = esc_attr( wp_json_encode( $data ) );

							$script_url = esc_url_raw( plugins_url( 'js/polldaddy-shortcode.js', __FILE__ ) );
							$str        = <<<CONTAINER
<a name="pd_a_{$poll}"></a>
<div class="CSS_Poll PDS_Poll" id="PDI_container{$poll}" data-settings="{$data}" style="display:inline-block;{$float}{$margins}"></div>
<div id="PD_superContainer"></div>
<noscript>{$poll_link}</noscript>
CONTAINER;

							$loader = <<<SCRIPT
( function( d, c, j ) {
	if ( ! d.getElementById( j ) ) {
		var pd = d.createElement( c ), s;
		pd.id = j;
		pd.src = '{$script_url}';
		s = d.getElementsByTagName( c )[0];
		s.parentNode.insertBefore( pd, s );
	} else if ( typeof jQuery !== 'undefined' ) {
		jQuery( d.body ).trigger( 'pd-script-load' );
	}
} ( document, 'script', 'pd-polldaddy-loader' ) );
SCRIPT;

							$loader = $this->compress_it( $loader );
							$loader = "<script type='text/javascript'>\n" . $loader . "\n</script>";

							return $str . $loader;
						} else {
							if ( $inline ) {
								$attributes['cb'] = '';
							}

							return <<<CONTAINER
<a id="pd_a_{$poll}"></a>
<div class="CSS_Poll PDS_Poll" id="PDI_container{$poll}" style="display:inline-block;{$float}{$margins}"></div>
<div id="PD_superContainer"></div>
<script type="text/javascript" charset="UTF-8" async src="{$poll_js}{$attributes['cb']}"></script>
<noscript>{$poll_link}</noscript>
CONTAINER;
						}
					}
				}
			} elseif ( ! empty( $attributes['survey'] ) ) { // survey embed.

				if ( in_array(
					$attributes['type'],
					array( 'iframe', 'button', 'banner', 'slider' ),
					true
				) ) {

					if ( empty( $attributes['title'] ) ) {
						$attributes['title'] = esc_html__( 'Take Our Survey', 'jetpack' );
						if ( ! empty( $attributes['link_text'] ) ) {
							$attributes['title'] = $attributes['link_text'];
						}
					}

					if (
						'banner' === $attributes['type']
						|| 'slider' === $attributes['type']
					) {
						$inline = false;
					}

					$survey      = preg_replace( '/[^a-f0-9]/i', '', $attributes['survey'] );
					$survey_url  = esc_url( "https://survey.fm/{$survey}" );
					$survey_link = sprintf( '<a href="%s" target="_blank">%s</a>', $survey_url, esc_html( $attributes['title'] ) );

					$settings = array();

					// Do we want a full embed code or a link?
					if ( $no_script || $inline || $infinite_scroll || Jetpack_AMP_Support::is_amp_request() ) {
						return $survey_link;
					}

					if ( 'iframe' === $attributes['type'] ) {
						if ( 'auto' !== $attributes['height'] ) {
							if (
								isset( $content_width )
								&& is_numeric( $attributes['width'] )
								&& $attributes['width'] > $content_width
							) {
								$attributes['width'] = $content_width;
							}

							if ( ! $attributes['width'] ) {
								$attributes['width'] = '100%';
							} else {
								$attributes['width'] = (int) $attributes['width'];
							}

							if ( ! $attributes['height'] ) {
								$attributes['height'] = '600';
							} else {
								$attributes['height'] = (int) $attributes['height'];
							}

							return <<<CONTAINER
<iframe src="{$survey_url}?iframe=1" frameborder="0" width="{$attributes['width']}" height="{$attributes['height']}" scrolling="auto" allowtransparency="true" marginheight="0" marginwidth="0">{$survey_link}</iframe>
CONTAINER;
						} elseif (
							! empty( $attributes['domain'] )
							&& ! empty( $attributes['id'] )
						) {

							$domain = preg_replace( '/[^a-z0-9\-]/i', '', $attributes['domain'] );
							$id     = preg_replace( '/[\/\?&\{\}]/', '', $attributes['id'] );

							$auto_src = esc_url( "https://{$domain}.survey.fm/{$id}" );
							$auto_src = wp_parse_url( $auto_src );

							if ( ! is_array( $auto_src ) || 0 === count( $auto_src ) ) {
								return '<!-- no crowdsignal output -->';
							}

							if ( ! isset( $auto_src['host'] ) || ! isset( $auto_src['path'] ) ) {
								return '<!-- no crowdsignal output -->';
							}

							$domain = $auto_src['host'] . '/';
							$id     = ltrim( $auto_src['path'], '/' );

							$settings = array(
								'type'   => $attributes['type'],
								'auto'   => true,
								'domain' => $domain,
								'id'     => $id,
							);
						}
					} else {
						$text_color = preg_replace( '/[^a-f0-9]/i', '', $attributes['text_color'] );
						$back_color = preg_replace( '/[^a-f0-9]/i', '', $attributes['back_color'] );

						if (
							! in_array(
								$attributes['align'],
								array(
									'right',
									'left',
									'top-left',
									'top-right',
									'middle-left',
									'middle-right',
									'bottom-left',
									'bottom-right',
								),
								true
							)
						) {
							$attributes['align'] = '';
						}

						if (
							! in_array(
								$attributes['style'],
								array(
									'inline',
									'side',
									'corner',
									'rounded',
									'square',
								),
								true
							)
						) {
							$attributes['style'] = '';
						}

						$settings = array_filter(
							array(
								'title'      => wp_strip_all_tags( $attributes['title'] ),
								'type'       => $attributes['type'],
								'body'       => wp_strip_all_tags( $attributes['body'] ),
								'button'     => wp_strip_all_tags( $attributes['button'] ),
								'text_color' => $text_color,
								'back_color' => $back_color,
								'align'      => $attributes['align'],
								'style'      => $attributes['style'],
								'id'         => $survey,
							)
						);
					}

					if ( empty( $settings ) ) {
						return '<!-- no crowdsignal output -->';
					}

					return $this->get_async_code( $settings, $survey_link );
				}
			} else {
				return '<!-- no crowdsignal output -->';
			}
		}

		/**
		 * Enqueue JavaScript containing all ratings / polls on the page.
		 * Hooked into wp_footer
		 *
		 * @echo string $script.
		 */
		public function generate_scripts() {
			$script = '';

			if ( is_array( self::$scripts ) ) {
				if ( isset( self::$scripts['rating'] ) ) {
					$script = "<script type='text/javascript' charset='UTF-8' id='polldaddyRatings'><!--//--><![CDATA[//><!--\n";
					foreach ( self::$scripts['rating'] as $rating ) {
						$script .= "PDRTJS_settings_{$rating['id']}{$rating['item_id']}={$rating['settings']}; if ( typeof PDRTJS_RATING !== 'undefined' ){if ( typeof PDRTJS_{$rating['id']}{$rating['item_id']} == 'undefined' ){PDRTJS_{$rating['id']}{$rating['item_id']} = new PDRTJS_RATING( PDRTJS_settings_{$rating['id']}{$rating['item_id']} );}}";
					}
					$script .= "\n//--><!]]></script><script type='text/javascript' charset='UTF-8' async src='https://polldaddy.com/js/rating/rating.js'></script>";

				}

				if ( isset( self::$scripts['poll'] ) ) {
					foreach ( self::$scripts['poll'] as $poll ) {
						$script .= "<script type='text/javascript' charset='UTF-8' async src='{$poll['url']}'></script>";
					}
				}
			}

			self::$scripts = false;
			echo $script;
		}

		/**
		 * If the theme uses infinite scroll, include jquery at the start
		 */
		public function check_infinite() {
			if (
				current_theme_supports( 'infinite-scroll' )
				&& class_exists( 'The_Neverending_Home_Page' )
				&& The_Neverending_Home_Page::archive_supports_infinity()
			) {
				wp_enqueue_script( 'jquery' );
			}
		}

		/**
		 * Dynamically load the .js, if needed
		 *
		 * This hooks in late (priority 11) to infinite_scroll_render to determine
		 * a posteriori if a shortcode has been called.
		 */
		public function crowdsignal_shortcode_infinite() {
			// only try to load if a shortcode has been called and theme supports infinite scroll.
			if ( self::$add_script ) {
				$script_url = esc_url_raw( plugins_url( 'js/polldaddy-shortcode.js', __FILE__ ) );

				/*
				 * if the script hasn't been loaded, load it
				 * if the script loads successfully, fire an 'pd-script-load' event
				 */
				echo <<<SCRIPT
<script type='text/javascript'>
//<![CDATA[
( function( d, c, j ) {
	if ( !d.getElementById( j ) ) {
		var pd = d.createElement( c ), s;
		pd.id = j;
		pd.async = true;
		pd.src = '{$script_url}';
		s = d.getElementsByTagName( c )[0];
		s.parentNode.insertBefore( pd, s );
	} else if ( typeof jQuery !== 'undefined' ) {
		jQuery( d.body ).trigger( 'pd-script-load' );
	}
} ( document, 'script', 'pd-polldaddy-loader' ) );
//]]>
</script>
SCRIPT;

			}
		}
	}

	// Kick it all off.
	new CrowdsignalShortcode();

	if ( ! function_exists( 'crowdsignal_link' ) ) {
		/**
		 * Replace link by embed.
		 * Example: http://polldaddy.com/poll/1562975/?view=results&msg=voted
		 *
		 * @param string $content Post content.
		 */
		function crowdsignal_link( $content ) {
			if ( Jetpack_AMP_Support::is_amp_request() ) {
				return $content;
			}

			return preg_replace( '!(?:\n|\A)https?://(polldaddy\.com/poll|poll\.fm)/([0-9]+?)(/.*)?(?:\n|\Z)!i', "\n<script type='text/javascript' charset='utf-8' src='//static.polldaddy.com/p/$2.js'></script><noscript> <a href='https://poll.fm/$2'>View Poll</a></noscript>\n", $content );
		}

		// higher priority because we need it before auto-link and autop get to it.
		add_filter( 'the_content', 'crowdsignal_link', 1 );
		add_filter( 'the_content_rss', 'crowdsignal_link', 1 );
	}

		/**
		 * Note that Core has the oembed of '#https?://survey\.fm/.*#i' as of 5.1.
		 * This should be removed after Core has the current regex is in our minimum version.
		 *
		 * @see https://core.trac.wordpress.org/ticket/46467
		 * @todo Confirm patch landed and remove once 5.2 is the minimum version.
		 */
	wp_oembed_add_provider( '#https?://.+\.survey\.fm/.*#i', 'https://api.crowdsignal.com/oembed', true );
}
