<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The companion file to shortcodes.php
 *
 * This file contains the code that converts HTML embeds into shortcodes
 * for when the user copy/pastes in HTML.
 *
 * @package Jetpack
 */

add_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'filter' ), 11 );
add_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'maybe_create_links' ), 100 ); // See WPCom_Embed_Stats::init().

/**
 * Helper class for identifying and parsing known HTML blocks
 *
 * @since 4.5.0
 *
 * @author mdawaffe
 *
 * Not completely done, but seems to work okay
 * Stolen from Mike's Seaside presentation:
 * @link http://mdawaffepresents.wordpress.com/?p=36
 */
class Filter_Embedded_HTML_Objects {
	/**
	 * Array of embeds to be processed (strpos).
	 *
	 * @var array
	 */
	public static $strpos_filters = array();
	/**
	 * Array of embeds to be processed (regexp).
	 *
	 * @var array
	 */
	public static $regexp_filters = array();
	/**
	 * HTML element being processed.
	 *
	 * @var string
	 */
	public static $current_element = false;
	/**
	 * Array of embeds to be processed (strpos).
	 *
	 * @var array
	 */
	public static $html_strpos_filters = array();
	/**
	 * Array of embeds to be processed (regexp).
	 *
	 * @var array
	 */
	public static $html_regexp_filters = array();
	/**
	 * Failed embeds (stripped)
	 *
	 * @var array
	 */
	public static $failed_embeds = array();

	/**
	 * Store tokens found in Syntax Highlighter.
	 *
	 * @since 4.5.0
	 *
	 * @var array
	 */
	private static $sh_unfiltered_content_tokens;

	/**
	 * Capture tokens found in Syntax Highlighter and collect them in self::$sh_unfiltered_content_tokens.
	 *
	 * @since 4.5.0
	 *
	 * @param array $match Array of Syntax Highlighter matches.
	 *
	 * @return string
	 */
	public static function sh_regexp_callback( $match ) {
		$token                                        = sprintf(
			'[prekses-filter-token-%1$d-%2$s-%1$d]',
			wp_rand(),
			md5( $match[0] )
		);
		self::$sh_unfiltered_content_tokens[ $token ] = $match[0];
		return $token;
	}

	/**
	 * Look for and filter HTML blocks in content.
	 *
	 * @param string $html Post content.
	 */
	public static function filter( $html ) {
		if ( ! $html || ! is_string( $html ) ) {
			return $html;
		}

		$regexps = array(
			'object' => '%<object[^>]*+>(?>[^<]*+(?><(?!/object>)[^<]*+)*)</object>%i',
			'embed'  => '%<embed[^>]*+>(?:\s*</embed>)?%i',
			'iframe' => '%<iframe[^>]*+>(?>[^<]*+(?><(?!/iframe>)[^<]*+)*)</iframe>%i',
			'div'    => '%<div[^>]*+>(?>[^<]*+(?><(?!/div>)[^<]*+)*+)(?:</div>)+%i',
			'script' => '%<script[^>]*+>(?>[^<]*+(?><(?!/script>)[^<]*+)*)</script>%i',
		);

		$unfiltered_content_tokens          = array();
		self::$sh_unfiltered_content_tokens = array();

		// Check here to make sure that SyntaxHighlighter is still used. (Just a little future proofing).
		if ( class_exists( 'SyntaxHighlighter' ) ) {
			/*
			 * Replace any "code" shortcode blocks with a token that we'll later replace with its original text.
			 * This will keep the contents of the shortcode from being filtered.
			 */
			global $syntax_highlighter;

			// Check to see if the $syntax_highlighter object has been created and is ready for use.
			if ( isset( $syntax_highlighter ) && is_array( $syntax_highlighter->shortcodes ) ) {
				$shortcode_regex           = implode( '|', array_map( 'preg_quote', $syntax_highlighter->shortcodes ) );
				$html                      = preg_replace_callback(
					'/\[(' . $shortcode_regex . ')(\s[^\]]*)?\][\s\S]*?\[\/\1\]/m',
					array( __CLASS__, 'sh_regexp_callback' ),
					$html
				);
				$unfiltered_content_tokens = self::$sh_unfiltered_content_tokens;
			}
		}

		foreach ( $regexps as $element => $regexp ) {
			self::$current_element = $element;

			if ( false !== stripos( $html, "<$element" ) ) {
				$new_html = preg_replace_callback( $regexp, array( __CLASS__, 'dispatch' ), $html );
				if ( $new_html ) {
					$html = $new_html;
				}
			}

			if ( false !== stripos( $html, "&lt;$element" ) ) {
				$regexp_entities = self::regexp_entities( $regexp );
				$new_html        = preg_replace_callback( $regexp_entities, array( __CLASS__, 'dispatch_entities' ), $html );
				if ( $new_html ) {
					$html = $new_html;
				}
			}
		}

		if ( count( $unfiltered_content_tokens ) > 0 ) {
			// Replace any tokens generated earlier with their original unfiltered text.
			$html = str_replace( array_keys( $unfiltered_content_tokens ), $unfiltered_content_tokens, $html );
		}

		return $html;
	}

	/**
	 * Replace HTML entities in current HTML element regexp.
	 * This is useful when the content is HTML encoded by TinyMCE.
	 *
	 * @param string $regexp Selected regexp.
	 */
	public static function regexp_entities( $regexp ) {
		return preg_replace(
			'/\[\^&([^\]]+)\]\*\+/',
			'(?>[^&]*+(?>&(?!\1)[^&])*+)*+',
			str_replace( '?&gt;', '?' . '>', htmlspecialchars( $regexp, ENT_NOQUOTES ) )
		);
	}

	/**
	 * Allow the addition of new embed options.
	 *
	 * @param string $match          Regex or HTML for the new embed we want to add.
	 * @param string $callback       Function used to convert embed into shortcode.
	 * @param bool   $is_regexp      Is $match a regex? When it is not, this can be used to remove content from an embed.
	 * @param bool   $is_html_filter Check against raw HTML instead of a regex. False by default.
	 */
	public static function register( $match, $callback, $is_regexp = false, $is_html_filter = false ) {
		if ( $is_html_filter ) {
			if ( $is_regexp ) {
				self::$html_regexp_filters[ $match ] = $callback;
			} else {
				self::$html_strpos_filters[ $match ] = $callback;
			}
		} else {
			if ( $is_regexp ) {
				self::$regexp_filters[ $match ] = $callback;
			} else {
				self::$strpos_filters[ $match ] = $callback;
			}
		}
	}

	/**
	 * Allow deleting existing registered embed methods.
	 *
	 * @param string $match Embed regexp.
	 */
	public static function unregister( $match ) {
		// Allow themes/plugins to remove registered embeds.
		unset( self::$regexp_filters[ $match ] );
		unset( self::$strpos_filters[ $match ] );
		unset( self::$html_regexp_filters[ $match ] );
		unset( self::$html_strpos_filters[ $match ] );
	}

	/**
	 * Filter and replace HTML element entity.
	 *
	 * @param array $matches Array of matches.
	 */
	private static function dispatch_entities( $matches ) {
		$matches[0] = html_entity_decode( $matches[0] );

		return self::dispatch( $matches );
	}

	/**
	 * Filter and replace HTML element.
	 *
	 * @param array $matches Array of matches.
	 */
	private static function dispatch( $matches ) {
		$html  = preg_replace( '%&#0*58;//%', '://', $matches[0] );
		$attrs = self::get_attrs( $html );
		if ( isset( $attrs['src'] ) ) {
			$src = $attrs['src'];
		} elseif ( isset( $attrs['movie'] ) ) {
			$src = $attrs['movie'];
		} else {
			// no src found, search html.
			foreach ( self::$html_strpos_filters as $match => $callback ) {
				if ( false !== strpos( $html, $match ) ) {
					return call_user_func( $callback, $attrs );
				}
			}

			foreach ( self::$html_regexp_filters as $match => $callback ) {
				if ( preg_match( $match, $html ) ) {
					return call_user_func( $callback, $attrs );
				}
			}

			return $matches[0];
		}

		$src = trim( $src );

		// check source filter.
		foreach ( self::$strpos_filters as $match => $callback ) {
			if ( false !== strpos( $src, $match ) ) {
				return call_user_func( $callback, $attrs );
			}
		}

		foreach ( self::$regexp_filters as $match => $callback ) {
			if ( preg_match( $match, $src ) ) {
				return call_user_func( $callback, $attrs );
			}
		}

		// check html filters.
		foreach ( self::$html_strpos_filters as $match => $callback ) {
			if ( false !== strpos( $html, $match ) ) {
				return call_user_func( $callback, $attrs );
			}
		}

		foreach ( self::$html_regexp_filters as $match => $callback ) {
			if ( preg_match( $match, $html ) ) {
				return call_user_func( $callback, $attrs );
			}
		}

		// Log the strip.
		if ( function_exists( 'wp_kses_reject' ) ) {
			wp_kses_reject(
				sprintf(
					/* translators: placeholder is an HTML tag. */
					__( '<code>%s</code> HTML tag removed as it is not allowed', 'jetpack' ),
					'&lt;' . self::$current_element . '&gt;'
				),
				array( self::$current_element => $attrs )
			);
		}

		// Keep the failed match so we can later replace it with a link,
		// but return the original content to give others a chance too.
		self::$failed_embeds[] = array(
			'match' => $matches[0],
			'src'   => esc_url( $src ),
		);

		return $matches[0];
	}

	/**
	 * Failed embeds are stripped, so let's convert them to links at least.
	 *
	 * @param string $string Failed embed string.
	 *
	 * @return string $string Linkified string.
	 */
	public static function maybe_create_links( $string ) {
		if ( empty( self::$failed_embeds ) ) {
			return $string;
		}

		foreach ( self::$failed_embeds as $entry ) {
			$html = sprintf( '<a href="%s">%s</a>', esc_url( $entry['src'] ), esc_url( $entry['src'] ) );
			// Check if the string doesn't contain iframe, before replace.
			if ( ! preg_match( '/<iframe /', $string ) ) {
				$string = str_replace( $entry['match'], $html, $string );
			}
		}

		self::$failed_embeds = array();

		return $string;
	}

	/**
	 * Parse post HTML for HTML tags.
	 *
	 * @param string $html Post HTML.
	 */
	private static function get_attrs( $html ) {
		if (
			! ( class_exists( 'DOMDocument' ) && function_exists( 'libxml_use_internal_errors' ) && function_exists( 'simplexml_load_string' ) ) ) {
			trigger_error( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
				esc_html__( 'PHP’s XML extension is not available. Please contact your hosting provider to enable PHP’s XML extension.', 'jetpack' )
			);
			return array();
		}
		// We have to go through DOM, since it can load non-well-formed XML (i.e. HTML).  SimpleXML cannot.
		$dom = new DOMDocument();
		// The @ is not enough to suppress errors when dealing with libxml,
		// we have to tell it directly how we want to handle errors.
		libxml_use_internal_errors( true );
		// Suppress parser warnings.
		@$dom->loadHTML( $html ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		libxml_use_internal_errors( false );
		$xml = false;
		// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		foreach ( $dom->childNodes as $node ) {
			// find the root node (html).
			if ( XML_ELEMENT_NODE === $node->nodeType ) {
				/*
				 * Use simplexml_load_string rather than simplexml_import_dom
				 * as the later doesn't cope well if the XML is malformmed in the DOM
				 * See #1688-wpcom.
				 */
				libxml_use_internal_errors( true );
				// html->body->object.
				$xml = simplexml_load_string( $dom->saveXML( $node->firstChild->firstChild ) );
				libxml_clear_errors();
				break;
			}
		}
		// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( ! $xml ) {
			return array();
		}

		$attrs              = array();
		$attrs['_raw_html'] = $html;

		// <param> elements
		foreach ( $xml->param as $param ) {
			$attrs[ (string) $param['name'] ] = (string) $param['value'];
		}

		// <object> attributes
		foreach ( $xml->attributes() as $name => $attr ) {
			$attrs[ $name ] = (string) $attr;
		}

		// <embed> attributes
		if ( $xml->embed ) {
			foreach ( $xml->embed->attributes() as $name => $attr ) {
				$attrs[ $name ] = (string) $attr;
			}
		}

		return $attrs;
	}
}
