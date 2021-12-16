<?php
// don't call the file directly
defined( 'ABSPATH' ) or die();

class VaultPress_Hotfixes {
	function __construct() {
		global $wp_version;

		add_filter( 'option_new_admin_email', array( $this, 'r18346_sanitize_admin_email' ) );

		add_filter( 'get_pagenum_link', array( $this, 'get_pagenum_link' ) );

		// Protect All-in-one SEO from non-authorized users making changes, and script injection attacks.
		add_action( 'wp_ajax_aioseop_ajax_save_meta', array( $this, 'protect_aioseo_ajax' ), 1 );

		// Protect WooCommerce from object injection via PayPal IPN notifications. Affects 2.0.20 -> 2.3.10
		add_action( 'init', array( $this , 'protect_woocommerce_paypal_object_injection' ), 1 );

		if ( version_compare( $wp_version, '4.7.1', '<=' ) ) {
			// Protect WordPress 4.4 - 4.7.1 against WP REST type abuse
			if ( version_compare( $wp_version, '4.4', '>=' ) ) {
				add_filter( 'rest_pre_dispatch', array( $this, 'protect_rest_type_juggling' ), 10, 3 );
			}

			//	Protect WordPress 4.0 - 4.7.1 against faulty youtube embeds
			if ( version_compare( $wp_version, '4.0', '>=' ) ) {
				$this->protect_youtube_embeds();
			}
		}

	}

	function protect_rest_type_juggling( $replace, $server, $request ) {
		if ( isset( $request['id'] ) ) {
			$request['id'] = intval( $request['id'] );
		}

		return $replace;
	}

	function protect_youtube_embeds() {
		if ( ! apply_filters( 'load_default_embeds', true ) ) {
			return;
		}

		wp_embed_unregister_handler( 'youtube_embed_url' );
		wp_embed_register_handler( 'youtube_embed_url', '#https?://(www.)?youtube\.com/(?:v|embed)/([^/]+)#i', array( $this, 'safe_embed_handler_youtube' ), 9, 4 );
	}

	function safe_embed_handler_youtube( $matches, $attr, $url, $rawattr ) {
		$matches[2] = urlencode( $matches[2] );
		return( wp_embed_handler_youtube( $matches, $attr, $url, $rawattr ) );
	}

	function disable_jetpack_oembed( $enabled ) {
		return false;
	}

	function get_pagenum_link( $url ) {
		return esc_url_raw( $url );
	}

	function r20493_make_url_clickable_cb($matches) {
		$url = $matches[2];

		if ( ')' == $matches[3] && strpos( $url, '(' ) ) {
			// If the trailing character is a closing parethesis, and the URL has an opening parenthesis in it, add the closing parenthesis to the URL.
			// Then we can let the parenthesis balancer do its thing below.
			$url .= $matches[3];
			$suffix = '';
		} else {
			$suffix = $matches[3];
		}

		// Include parentheses in the URL only if paired
		while ( substr_count( $url, '(' ) < substr_count( $url, ')' ) ) {
			$suffix = strrchr( $url, ')' ) . $suffix;
			$url = substr( $url, 0, strrpos( $url, ')' ) );
		}

		$url = esc_url($url);
		if ( empty($url) )
			return $matches[0];

		return $matches[1] . "<a href=\"$url\" rel=\"nofollow\">$url</a>" . $suffix;
	}

	function r20493_split_str_by_whitespace( $string, $goal ) {
		$chunks = array();

		$string_nullspace = strtr( $string, "\r\n\t\v\f ", "\000\000\000\000\000\000" );

		while ( $goal < strlen( $string_nullspace ) ) {
			$pos = strrpos( substr( $string_nullspace, 0, $goal + 1 ), "\000" );

			if ( false === $pos ) {
				$pos = strpos( $string_nullspace, "\000", $goal + 1 );
				if ( false === $pos ) {
					break;
				}
			}

			$chunks[] = substr( $string, 0, $pos + 1 );
			$string = substr( $string, $pos + 1 );
			$string_nullspace = substr( $string_nullspace, $pos + 1 );
		}

		if ( $string ) {
			$chunks[] = $string;
		}

		return $chunks;
	}

	function r18346_sanitize_admin_email( $value ) {
		return sanitize_email( $value ); // Is it enough ?
	}

	function r18346_sanitize_lang( $value ) {
		$allowed = apply_filters( 'available_languages', get_available_languages() ); // add a filter to unit test
		if ( !empty( $value ) && !in_array( $value, $allowed ) )
			return false;
		else
			return $value;
	}

	// Protect All-in-one SEO AJAX calls from script injection and changes without privileges. Affects versions <= 2.1.5
	function protect_aioseo_ajax() {
		if ( defined( 'AIOSEOP_VERSION' ) && version_compare( AIOSEOP_VERSION, '2.1.5', '>' ) )
			return;

		if ( ! isset( $_POST['post_id'] ) || ! isset( $_POST['target_meta'] ) )
			die();

		// Ensure the current user has permission to write to the post.
		if ( ! current_user_can( 'edit_post', intval( $_POST['post_id'] ) ) )
			die();

		// Limit the fields that can be written to
		if ( ! in_array( $_POST['target_meta'], array( 'title', 'description', 'keywords' ) ) )
			die();

		// Strip tags from the metadata value.
		$_POST['new_meta'] = strip_tags( $_POST['new_meta'] );
	}

	// Protect WooCommerce 2.0.20 - 2.3.10 from PayPal IPN object injection attack.
	function protect_woocommerce_paypal_object_injection() {
		global $woocommerce;
		if ( ! isset( $woocommerce ) )
			return;

		$wc_version = $woocommerce->version;
		if ( version_compare( $wc_version, '2.0.20', '<' ) || version_compare( $wc_version, '2.3.11', '>=' ) )
			return;

		if ( isset( $_REQUEST['paypalListener'] ) ) {
			$check_fields = array( 'custom', 'cm' );
			foreach ( $check_fields as $field ) {
				if ( isset( $_REQUEST[ $field ] ) && preg_match( '/[CO]:\+?[0-9]+:/', $_REQUEST[ $field ] ) ) {
					die();
				}
			}
		}
	}
}

class VaultPress_kses {
	static function wp_kses($string, $allowed_html, $allowed_protocols = array ()) {
		$string = wp_kses_no_null($string);
		$string = wp_kses_js_entities($string);
		$string = wp_kses_normalize_entities($string);
		return VaultPress_kses::wp_kses_split($string, $allowed_html, $allowed_protocols);
	}

	static function wp_kses_split($string, $allowed_html, $allowed_protocols) {
		global $pass_allowed_html, $pass_allowed_protocols;
		$pass_allowed_html = $allowed_html;
		$pass_allowed_protocols = $allowed_protocols;
		return preg_replace_callback( '%(<!--.*?(-->|$))|(<[^>]*(>|$)|>)%', 'VaultPress_kses::_vp_kses_split_callback', $string );
	}

	static function _vp_kses_split_callback( $match ) {
		global $pass_allowed_html, $pass_allowed_protocols;
		return VaultPress_kses::wp_kses_split2( $match[0], $pass_allowed_html, $pass_allowed_protocols );
	}

	static function wp_kses_split2($string, $allowed_html, $allowed_protocols) {
		$string = wp_kses_stripslashes($string);

		if (substr($string, 0, 1) != '<')
			return '&gt;';
		# It matched a ">" character

		if ( '<!--' == substr( $string, 0, 4 ) ) {
			$string = str_replace( array('<!--', '-->'), '', $string );
			while ( $string != ($newstring = VaultPress_kses::wp_kses($string, $allowed_html, $allowed_protocols)) )
				$string = $newstring;
			if ( $string == '' )
				return '';
			// prevent multiple dashes in comments
			$string = preg_replace('/--+/', '-', $string);
			// prevent three dashes closing a comment
			$string = preg_replace('/-$/', '', $string);
			return "<!--{$string}-->";
		}
		# Allow HTML comments

		if (!preg_match('%^<\s*(/\s*)?([a-zA-Z0-9]+)([^>]*)>?$%', $string, $matches))
			return '';
		# It's seriously malformed

		$slash = trim($matches[1]);
		$elem = $matches[2];
		$attrlist = $matches[3];

		if ( ! isset($allowed_html[strtolower($elem)]) )
			return '';
		# They are using a not allowed HTML element

		if ($slash != '')
			return "</$elem>";
		# No attributes are allowed for closing elements

		return VaultPress_kses::wp_kses_attr( $elem, $attrlist, $allowed_html, $allowed_protocols );
	}

	static function wp_kses_attr($element, $attr, $allowed_html, $allowed_protocols) {
		# Is there a closing XHTML slash at the end of the attributes?

		$xhtml_slash = '';
		if (preg_match('%\s*/\s*$%', $attr))
			$xhtml_slash = ' /';

		# Are any attributes allowed at all for this element?
		if ( ! isset($allowed_html[strtolower($element)]) || count($allowed_html[strtolower($element)]) == 0 )
			return "<$element$xhtml_slash>";

		# Split it
		$attrarr = VaultPress_kses::wp_kses_hair($attr, $allowed_protocols);

		# Go through $attrarr, and save the allowed attributes for this element
		# in $attr2
		$attr2 = '';

		$allowed_attr = $allowed_html[strtolower($element)];
		foreach ($attrarr as $arreach) {
			if ( ! isset( $allowed_attr[strtolower($arreach['name'])] ) )
				continue; # the attribute is not allowed

			$current = $allowed_attr[strtolower($arreach['name'])];
			if ( $current == '' )
				continue; # the attribute is not allowed

			if ( strtolower( $arreach['name'] ) == 'style' ) {
				$orig_value = $arreach['value'];
				$value = safecss_filter_attr( $orig_value );

				if ( empty( $value ) )
					continue;

				$arreach['value'] = $value;
				$arreach['whole'] = str_replace( $orig_value, $value, $arreach['whole'] );
			}

			if ( ! is_array($current) ) {
				$attr2 .= ' '.$arreach['whole'];
			# there are no checks

			} else {
				# there are some checks
				$ok = true;
				foreach ($current as $currkey => $currval) {
					if ( ! wp_kses_check_attr_val($arreach['value'], $arreach['vless'], $currkey, $currval) ) {
						$ok = false;
						break;
					}
				}

				if ( $ok )
					$attr2 .= ' '.$arreach['whole']; # it passed them
			} # if !is_array($current)
		} # foreach

		# Remove any "<" or ">" characters
		$attr2 = preg_replace('/[<>]/', '', $attr2);

		return "<$element$attr2$xhtml_slash>";
	}

	static function wp_kses_hair($attr, $allowed_protocols) {
		$attrarr = array ();
		$mode = 0;
		$attrname = '';
		$uris = array('xmlns', 'profile', 'href', 'src', 'cite', 'classid', 'codebase', 'data', 'usemap', 'longdesc', 'action');

		# Loop through the whole attribute list

		while (strlen($attr) != 0) {
			$working = 0; # Was the last operation successful?

			switch ($mode) {
				case 0 : # attribute name, href for instance

					if (preg_match('/^([-a-zA-Z]+)/', $attr, $match)) {
						$attrname = $match[1];
						$working = $mode = 1;
						$attr = preg_replace('/^[-a-zA-Z]+/', '', $attr);
					}

					break;

				case 1 : # equals sign or valueless ("selected")

					if (preg_match('/^\s*=\s*/', $attr)) # equals sign
						{
						$working = 1;
						$mode = 2;
						$attr = preg_replace('/^\s*=\s*/', '', $attr);
						break;
					}

					if (preg_match('/^\s+/', $attr)) # valueless
						{
						$working = 1;
						$mode = 0;
						if(false === array_key_exists($attrname, $attrarr)) {
							$attrarr[$attrname] = array ('name' => $attrname, 'value' => '', 'whole' => $attrname, 'vless' => 'y');
						}
						$attr = preg_replace('/^\s+/', '', $attr);
					}

					break;

				case 2 : # attribute value, a URL after href= for instance

					if (preg_match('%^"([^"]*)"(\s+|/?$)%', $attr, $match))
						# "value"
						{
						$thisval = $match[1];
						if ( in_array(strtolower($attrname), $uris) )
							$thisval = VaultPress_kses::wp_kses_bad_protocol($thisval, $allowed_protocols);

						if(false === array_key_exists($attrname, $attrarr)) {
							$attrarr[$attrname] = array ('name' => $attrname, 'value' => $thisval, 'whole' => "$attrname=\"$thisval\"", 'vless' => 'n');
						}
						$working = 1;
						$mode = 0;
						$attr = preg_replace('/^"[^"]*"(\s+|$)/', '', $attr);
						break;
					}

					if (preg_match("%^'([^']*)'(\s+|/?$)%", $attr, $match))
						# 'value'
						{
						$thisval = $match[1];
						if ( in_array(strtolower($attrname), $uris) )
							$thisval = VaultPress_kses::wp_kses_bad_protocol($thisval, $allowed_protocols);

						if(false === array_key_exists($attrname, $attrarr)) {
							$attrarr[$attrname] = array ('name' => $attrname, 'value' => $thisval, 'whole' => "$attrname='$thisval'", 'vless' => 'n');
						}
						$working = 1;
						$mode = 0;
						$attr = preg_replace("/^'[^']*'(\s+|$)/", '', $attr);
						break;
					}

					if (preg_match("%^([^\s\"']+)(\s+|/?$)%", $attr, $match))
						# value
						{
						$thisval = $match[1];
						if ( in_array(strtolower($attrname), $uris) )
							$thisval = VaultPress_kses::wp_kses_bad_protocol($thisval, $allowed_protocols);

						if(false === array_key_exists($attrname, $attrarr)) {
							$attrarr[$attrname] = array ('name' => $attrname, 'value' => $thisval, 'whole' => "$attrname=\"$thisval\"", 'vless' => 'n');
						}
						# We add quotes to conform to W3C's HTML spec.
						$working = 1;
						$mode = 0;
						$attr = preg_replace("%^[^\s\"']+(\s+|$)%", '', $attr);
					}

					break;
			} # switch

			if ($working == 0) # not well formed, remove and try again
			{
				$attr = wp_kses_html_error($attr);
				$mode = 0;
			}
		} # while

		if ($mode == 1 && false === array_key_exists($attrname, $attrarr))
			# special case, for when the attribute list ends with a valueless
			# attribute like "selected"
			$attrarr[$attrname] = array ('name' => $attrname, 'value' => '', 'whole' => $attrname, 'vless' => 'y');

		return $attrarr;
	}

	static function wp_kses_bad_protocol($string, $allowed_protocols) {
		$string = wp_kses_no_null($string);
		$iterations = 0;

		do {
			$original_string = $string;
			$string = VaultPress_kses::wp_kses_bad_protocol_once($string, $allowed_protocols);
		} while ( $original_string != $string && ++$iterations < 6 );

		if ( $original_string != $string )
			return '';

		return $string;
	}

	static function wp_kses_bad_protocol_once($string, $allowed_protocols, $count = 1) {
		$string2 = preg_split( '/:|&#0*58;|&#x0*3a;/i', $string, 2 );
		if ( isset($string2[1]) && ! preg_match('%/\?%', $string2[0]) ) {
			$string = trim( $string2[1] );
			$protocol = VaultPress_kses::wp_kses_bad_protocol_once2( $string2[0], $allowed_protocols );
			if ( 'feed:' == $protocol ) {
				if ( $count > 2 )
					return '';
				$string = VaultPress_kses::wp_kses_bad_protocol_once( $string, $allowed_protocols, ++$count );
				if ( empty( $string ) )
					return $string;
			}
			$string = $protocol . $string;
		}

		return $string;
	}

	static function wp_kses_bad_protocol_once2( $string, $allowed_protocols ) {
		$string2 = wp_kses_decode_entities($string);
		$string2 = preg_replace('/\s/', '', $string2);
		$string2 = wp_kses_no_null($string2);
		$string2 = strtolower($string2);

		$allowed = false;
		foreach ( (array) $allowed_protocols as $one_protocol ) {
			if ( strtolower( $one_protocol ) == $string2 ) {
				$allowed = true;
				break;
			}
		}

		if ($allowed)
			return "$string2:";
		else
			return '';
	}

}

if ( !function_exists( 'get_available_languages' ) ) {
	function get_available_languages( $dir = null ) {
		$languages = array();
		foreach( glob( ( is_null( $dir) ? WP_LANG_DIR : $dir ) . '/*.mo' ) as $lang_file )
			if ( false === strpos( $lang_file, 'continents-cities' ) )
				$languages[] = basename($lang_file, '.mo');
		return $languages;
	}
}
