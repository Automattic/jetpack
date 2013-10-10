<?php

class VaultPress_Hotfixes {
	function __construct() {
		global $wp_version;

		if ( version_compare( $wp_version, '3.0.2', '<' ) )
			add_filter( 'query', array( $this, 'r16625' ) );

		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST && version_compare( $wp_version, '3.0.3', '<' ) )
			add_action( 'xmlrpc_call', array( $this, 'r16803' ) );

		if ( version_compare( $wp_version, '3.3.2', '<' ) ) {
			add_filter( 'pre_kses', array( $this, 'r17172_wp_kses' ), 1, 3 );
			add_filter( 'clean_url', array( $this, 'r17172_esc_url' ), 1, 3 );
		}

		if ( version_compare( $wp_version, '3.1.3', '<' ) ) {
			add_filter( 'sanitize_file_name', array( $this, 'r17990' ) );

			if ( !empty( $_POST ) )
				$this->r17994( $_POST );
			// Protect add_meta, update_meta used by the XML-RPC API
			add_filter( 'wp_xmlrpc_server_class', create_function( '$class', 'return \'VaultPress_XMLRPC_Server_r17994\';' ) );

			// clean post_mime_type and guid (r17994)
			add_filter( 'pre_post_mime_type', array( $this, 'r17994_sanitize_mime_type' ) );
			add_filter( 'post_mime_type', array( $this, 'r17994_sanitize_mime_type' ) );
			add_filter( 'pre_post_guid', 'esc_url_raw' );
			add_filter( 'post_guid', 'esc_url' );
		}

		if ( version_compare( $wp_version, '3.1.4', '<' ) ) {
			add_filter( 'wp_insert_post_data', array( $this, 'r18368' ), 1, 2 );

			// Add click jacking protection
			// login_init does not exist before 17826.
			$action = isset( $_REQUEST['action'] ) ? $_REQUEST['action'] : 'login';
			add_action( 'login_form_' . $action, array( $this, 'r17826_send_frame_options_header' ), 10, 0 );
			add_action( 'admin_init', array( $this, 'r17826_send_frame_options_header' ), 10, 0 );

			add_filter( 'sanitize_option_WPLANG', array( $this, 'r18346_sanitize_lang_on_save' ) );
			add_filter( 'sanitize_option_new_admin_email', array( $this, 'r18346_sanitize_admin_email_on_save' ) );
		}
		add_filter( 'option_new_admin_email', array( $this, 'r18346_sanitize_admin_email' ) );

		if ( version_compare( $wp_version, '3.3.2', '<' ) ) {
			remove_filter( 'comment_text', 'make_clickable' );
			add_filter( 'comment_text', array( $this, 'r20493_make_clickable' ), 9 );

			add_filter( 'comment_post_redirect', array( $this, 'r20486_comment_post_redirect' ) );
		}

		// WooThemes < 3.8.3, foxypress, asset-manager, wordpress-member-private-conversation.
		$end_execution = false;
		if ( isset( $_SERVER['SCRIPT_FILENAME'] ) )
			foreach ( array( 'preview-shortcode-external.php', 'uploadify.php', 'doupload.php', 'cef-upload.php', 'upload.php' ) as $vulnerable_script )
				if ( $vulnerable_script == basename( $_SERVER['SCRIPT_FILENAME'] ) ) {
					switch( $vulnerable_script ) {
						case 'upload.php':
							$pma_config_file = realpath( dirname( $_SERVER['SCRIPT_FILENAME'] ) . DIRECTORY_SEPARATOR . 'paam-config-ajax.php' );
							if ( !in_array( $pma_config_file, get_included_files() ) )
								break;
						default:
							$end_execution = true;
							break 2;
					}
				}
		if ( $end_execution )
			die( 'Disabled for security reasons' );

		if ( version_compare(  $wp_version, '3.3.2', '>') && version_compare( $wp_version, '3.4.1', '<' ) ) {
			add_filter( 'map_meta_cap', array( $this, 'r21138_xmlrpc_edit_posts' ), 10, 4 );
			add_action( 'map_meta_cap', array( $this, 'r21152_unfiltered_html' ), 10, 4 );
		}

		// https://core.trac.wordpress.org/changeset/21083
		if ( version_compare( $wp_version, '3.3', '>=') && version_compare( $wp_version, '3.3.3', '<' ) )
			add_filter( 'editable_slug', 'esc_textarea' ); 

		add_filter( 'get_pagenum_link', array( $this, 'get_pagenum_link' ) );
	}

	function r21138_xmlrpc_edit_posts( $caps, $cap, $user_id, $args ) {
		if ( ! isset( $args[0] ) || isset( $args[1] ) && $args[1] === 'hotfixed' )
			return $caps;
		foreach ( get_post_types( array(), 'objects' ) as $post_type_object ) {
			if ( $cap === $post_type_object->cap->edit_posts )
				return map_meta_cap( $post_type_object->cap->edit_post, $user_id, $args[0], 'hotfixed' );
		}
		return $caps;
	}

	function r21152_unfiltered_html( $caps, $cap, $user_id, $args ) {
		if ( $cap !== 'unfiltered_html' )
			return $caps;
		if ( defined( 'DISALLOW_UNFILTERED_HTML' ) && DISALLOW_UNFILTERED_HTML )
			return $caps;
		$key = array_search( 'do_not_allow', $caps );
		if ( false !== $key )
			return $caps;
		if ( is_multisite() && ! is_super_admin( $user_id ) )
			$caps[$key] = 'do_not_allow';
		return $caps;
	}

	function get_pagenum_link( $url ) {
		return esc_url_raw( $url );
	}

	function r20486_comment_post_redirect( $location ) {
		$location = wp_sanitize_redirect( $location );
		$location = wp_validate_redirect( $location, admin_url() );

		return $location;
	}

	function r20493_make_clickable( $text ) {
		$r = '';
		$textarr = preg_split( '/(<[^<>]+>)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE ); // split out HTML tags
		foreach ( $textarr as $piece ) {
			if ( empty( $piece ) || ( $piece[0] == '<' && ! preg_match('|^<\s*[\w]{1,20}+://|', $piece) ) ) {
				$r .= $piece;
				continue;
			}

			// Long strings might contain expensive edge cases ...
			if ( 10000 < strlen( $piece ) ) {
				// ... break it up
				foreach ( $this->r20493_split_str_by_whitespace( $piece, 2100 ) as $chunk ) { // 2100: Extra room for scheme and leading and trailing paretheses
					if ( 2101 < strlen( $chunk ) ) {
						$r .= $chunk; // Too big, no whitespace: bail.
					} else {
						$r .= $this->r20493_make_clickable( $chunk );
					}
				}
			} else {
				$ret = " $piece "; // Pad with whitespace to simplify the regexes

				$url_clickable = '~
					([\\s(<.,;:!?])                                        # 1: Leading whitespace, or punctuation
					(                                                      # 2: URL
						[\\w]{1,20}+://                                # Scheme and hier-part prefix
						(?=\S{1,2000}\s)                               # Limit to URLs less than about 2000 characters long
						[\\w\\x80-\\xff#%\\~/@\\[\\]*(+=&$-]*+         # Non-punctuation URL character
						(?:                                            # Unroll the Loop: Only allow puctuation URL character if followed by a non-punctuation URL character
							[\'.,;:!?)]                            # Punctuation URL character
							[\\w\\x80-\\xff#%\\~/@\\[\\]*(+=&$-]++ # Non-punctuation URL character
						)*
					)
					(\)?)                                                  # 3: Trailing closing parenthesis (for parethesis balancing post processing)
				~xS'; // The regex is a non-anchored pattern and does not have a single fixed starting character.
				      // Tell PCRE to spend more time optimizing since, when used on a page load, it will probably be used several times.

				$ret = preg_replace_callback( $url_clickable, array( $this, 'r20493_make_url_clickable_cb') , $ret );

				$ret = preg_replace_callback( '#([\s>])((www|ftp)\.[\w\\x80-\\xff\#$%&~/.\-;:=,?@\[\]+]+)#is', '_make_web_ftp_clickable_cb', $ret );
				$ret = preg_replace_callback( '#([\s>])([.0-9a-z_+-]+)@(([0-9a-z-]+\.)+[0-9a-z]{2,})#i', '_make_email_clickable_cb', $ret );

				$ret = substr( $ret, 1, -1 ); // Remove our whitespace padding.
				$r .= $ret;
			}
		}

		// Cleanup of accidental links within links
		$r = preg_replace( '#(<a( [^>]+?>|>))<a [^>]+?>([^>]+?)</a></a>#i', "$1$3</a>", $r );
		return $r;
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

	function r16625( $query ) {
		// Hotfixes: http://core.trac.wordpress.org/changeset/16625

		// Punt as fast as possible if this isn't an UPDATE
		if ( substr( $query, 0, 6 ) != "UPDATE" )
			return $query;
		global $wpdb;

		// Determine what the prefix of the bad query would look like and punt if this query doesn't match
		$badstring = "UPDATE $wpdb->posts SET to_ping = TRIM(REPLACE(to_ping, '";
		if ( substr( $query, 0, strlen( $badstring ) ) != $badstring )
			return $query;

		// Pull the post_id which is the last thing in the origin query, after a space, no quotes
		$query_parts = explode( " ", $query );
		$post_id = array_pop( $query_parts );

		// Chop off the beginning and end of the original query to get our unsanitized $tb_ping
		$tb_ping = substr(
			$query,
			strlen( $badstring ),
			(
				strlen( $query ) - (
					strlen( $badstring ) + strlen( sprintf( "', '')) WHERE ID = %d", $post_id ) )
				)
			)
		);

		// Return the fixed query
		return $wpdb->prepare( "UPDATE $wpdb->posts SET to_ping = TRIM(REPLACE(to_ping, %s, '')) WHERE ID = %d", $tb_ping, $post_id );
	}

	function r16803( $xmlrpc_method ) {
		// Hotfixes: http://core.trac.wordpress.org/changeset/16803
		global $wp_xmlrpc_server;
		// Pretend that we are an xmlrpc method, freshly called
		$args = $wp_xmlrpc_server->message->params;
		$error_code = 401;
		switch( $xmlrpc_method ) {
				case 'metaWeblog.newPost':
						$content_struct = $args[3];
						$publish = isset( $args[4] ) ? $args[4] : 0;
						if ( !empty( $content_struct['post_type'] ) ) {
								if ( $content_struct['post_type'] == 'page' ) {
										if ( $publish || 'publish' == $content_struct['page_status'] )
												$cap  = 'publish_pages';
										else
												$cap = 'edit_pages';
										$error_message = __( 'Sorry, you are not allowed to publish pages on this site.' );
								} elseif ( $content_struct['post_type'] == 'post' ) {
										if ( $publish || 'publish' == $content_struct['post_status'] )
												$cap  = 'publish_posts';
										else
												$cap = 'edit_posts';
										$error_message = __( 'Sorry, you are not allowed to publish posts on this site.' );
								} else {
										$error_message = __( 'Invalid post type.' );
								}
						} else {
								if ( $publish || 'publish' == $content_struct['post_status'] )
										$cap  = 'publish_posts';
								else
										$cap = 'edit_posts';
								$error_message = __( 'Sorry, you are not allowed to publish posts on this site.' );
						}
						if ( current_user_can( $cap ) )
								return true;
						break;
				case 'metaWeblog.editPost':
						$post_ID = (int) $args[0];
						$content_struct = $args[3];
						$publish = $args[4];
						$cap = ( $publish ) ? 'publish_posts' : 'edit_posts';
						$error_message = __( 'Sorry, you are not allowed to publish posts on this site.' );
						if ( !empty( $content_struct['post_type'] ) ) {
								if ( $content_struct['post_type'] == 'page' ) {
										if ( $publish || 'publish' == $content_struct['page_status'] )
												$cap  = 'publish_pages';
										else
												$cap = 'edit_pages';
										$error_message = __( 'Sorry, you are not allowed to publish pages on this site.' );
								} elseif ( $content_struct['post_type'] == 'post' ) {
										if ( $publish || 'publish' == $content_struct['post_status'] )
												$cap  = 'publish_posts';
										else
												$cap = 'edit_posts';
										$error_message = __( 'Sorry, you are not allowed to publish posts on this site.' );
								} else {
										$error_message = __( 'Invalid post type.' );
								}
						} else {
								if ( $publish || 'publish' == $content_struct['post_status'] )
										$cap  = 'publish_posts';
								else
										$cap = 'edit_posts';
								$error_message = __( 'Sorry, you are not allowed to publish posts on this site.' );
						}
						if ( current_user_can( $cap ) )
								return true;
						break;
				case 'mt.publishPost':
						$post_ID = (int) $args[0];
						if ( current_user_can( 'publish_posts' ) && current_user_can( 'edit_post', $post_ID ) )
								return true;
						$error_message = __( 'Sorry, you cannot edit this post.' );
						break;
				case 'blogger.deletePost':
						$post_ID = (int) $args[1];
						if ( current_user_can( 'delete_post', $post_ID ) )
								return true;
						$error_message = __( 'Sorry, you do not have the right to delete this post.' );
						break;
				case 'wp.getPageStatusList':
						if ( current_user_can( 'edit_pages' ) )
								return true;
						$error_code = 403;
						$error_message = __( 'You are not allowed access to details about this site.' );
						break;
				case 'wp.deleteComment':
				case 'wp.editComment':
						$comment_ID = (int) $args[3];
						if ( !$comment = get_comment( $comment_ID ) )
								return true; // This will be handled in the calling function explicitly
						if ( current_user_can( 'edit_post', $comment->comment_post_ID ) )
								return true;
						$error_code = 403;
						$error_message = __( 'You are not allowed to moderate comments on this site.' );
						break;
				default:
						return true;
		}
		// If we are here then this was a handlable xmlrpc call and the capability checks above all failed
		// ( otherwise they would have returned to the do_action from the switch statement above ) so it's
		// time to exit with whatever error we've determined is the problem (thus short circuiting the
		// original XMLRPC method call, and enforcing the above capability checks -- with an ax.  We'll
		// mimic the behavior from the end of IXR_Server::serve()
		$r = new IXR_Error( $error_code, $error_message );
		$resultxml = $r->getXml();
		$xml = <<<EOD
<methodResponse>
  <params>
	<param>
	  <value>
		$resultxml
	  </value>
	</param>
  </params>
</methodResponse>
EOD;
		$wp_xmlrpc_server->output( $xml );
		// For good measure...
		die();
	}

	function r17172_esc_url( $url, $original_url, $_context ) {
		$url = $original_url;

		if ( '' == $url )
			return $url;
		$url = preg_replace('|[^a-z0-9-~+_.?#=!&;,/:%@$\|*\'()\\x80-\\xff]|i', '', $url);
		$strip = array('%0d', '%0a', '%0D', '%0A');
		$url = _deep_replace($strip, $url);
		$url = str_replace(';//', '://', $url);
		/* If the URL doesn't appear to contain a scheme, we
		 * presume it needs http:// appended (unless a relative
		 * link starting with /, # or ? or a php file).
		 */
		if ( strpos($url, ':') === false && ! in_array( $url[0], array( '/', '#', '?' ) ) &&
			! preg_match('/^[a-z0-9-]+?\.php/i', $url) )
			$url = 'http://' . $url;

		// Replace ampersands and single quotes only when displaying.
		if ( 'display' == $_context ) {
			$url = wp_kses_normalize_entities( $url );
			$url = str_replace( '&amp;', '&#038;', $url );
			$url = str_replace( "'", '&#039;', $url );
		}

		$protocols = array ('http', 'https', 'ftp', 'ftps', 'mailto', 'news', 'irc', 'gopher', 'nntp', 'feed', 'telnet', 'mms', 'rtsp', 'svn');
		if ( VaultPress_kses::wp_kses_bad_protocol( $url, $protocols ) != $url )
			return '';
		return $url;
	}

	// http://core.trac.wordpress.org/changeset/17172
	// http://core.trac.wordpress.org/changeset/20541
	function r17172_wp_kses( $string, $html, $protocols ) {
		return VaultPress_kses::wp_kses( $string, $html, $protocols );
	}

	// http://core.trac.wordpress.org/changeset/17990
	function r17990( $filename ) {
		$parts = explode('.', $filename);
		$filename = array_shift($parts);
		$extension = array_pop($parts);
		$mimes = get_allowed_mime_types();

		// Loop over any intermediate extensions.  Munge them with a trailing underscore if they are a 2 - 5 character
		// long alpha string not in the extension whitelist.
		foreach ( (array) $parts as $part) {
			$filename .= '.' . $part;

			if ( preg_match("/^[a-zA-Z]{2,5}\d?$/", $part) ) {
				$allowed = false;
				foreach ( $mimes as $ext_preg => $mime_match ) {
					$ext_preg = '!^(' . $ext_preg . ')$!i';
					if ( preg_match( $ext_preg, $part ) ) {
						$allowed = true;
						break;
					}
				}
				if ( !$allowed )
					$filename .= '_';
			}
		}
		$filename .= '.' . $extension;
		return $filename;
	}

	/*
	 * Hotfixes: http://core.trac.wordpress.org/changeset/18368
	 */
	function r18368( $post, $raw_post ) {
		if ( isset( $post['filter'] ) || isset ( $raw_post['filter'] ) ) {
			unset( $post['filter'], $raw_post['filter'] ); // to ensure the post is properly sanitized
			$post = sanitize_post($post, 'db');
		}
		if ( empty( $post['ID'] ) )
			unset( $post['ID'] ); // sanitize_post
		unset( $post['filter'] ); // sanitize_post
		return $post;
	}

	/**
	 * Protect WordPress internal metadata.
	 *
	 * The post data is passed as a parameter to (unit) test this method.
	 * @param $post_data|array the $_POST array.
	 */
	function r17994( &$post_data ) {
		// Protect admin-ajax add_meta
		$metakeyselect = isset( $post_data['metakeyselect'] ) ? stripslashes( trim( $post_data['metakeyselect'] ) ) : '';
		$metakeyinput = isset( $post_data['metakeyinput'] ) ? stripslashes( trim( $post_data['metakeyinput'] ) ) : '';

		if ( ( $metakeyselect && '_' == $metakeyselect[0] ) || ( $metakeyinput && '_' == $metakeyinput[0] ) ) {
			unset( $_POST['metakeyselect'], $_POST['metakeyinput'] );
		}

		// Protect admin-ajax update_meta
		if ( isset( $post_data['meta'] ) ) {
			foreach ( (array)$post_data['meta'] as $mid => $value ) {
				$key = stripslashes( $post_data['meta'][$mid]['key'] );
				if ( $key && '_' == $key[0] )
					unset( $post_data['meta'][$mid] );
			}
		}
	}

	function r17994_sanitize_mime_type( $mime_type ) {
		$sani_mime_type = preg_replace( '/[^\-*.a-zA-Z0-9\/+]/', '', $mime_type );
		return apply_filters( 'sanitize_mime_type', $sani_mime_type, $mime_type );
	}

	function r17826_send_frame_options_header() {
 		@header( 'X-Frame-Options: SAMEORIGIN' );
 	}

	function r18346_sanitize_admin_email_on_save($value) {
		$value = sanitize_email( $value );
		if ( !is_email( $value ) ) {
			$value = get_option( 'new_admin_email' ); // Resets option to stored value in the case of failed sanitization
			if ( function_exists( 'add_settings_error' ) )
				add_settings_error( 'new_admin_email', 'invalid_admin_email', __( 'The email address entered did not appear to be a valid email address. Please enter a valid email address.' ) );
		}
		return $value;
	}

	function r18346_sanitize_admin_email( $value ) {
		return sanitize_email( $value ); // Is it enough ?
	}

	function r18346_sanitize_lang_on_save( $value ) {
		$value = $this->r18346_sanitize_lang( $value ); // sanitize the new value.
		if ( empty( $value ) )
			$value = get_option( 'WPLANG' );
		return $value;
	}

	function r18346_sanitize_lang( $value ) {
		$allowed = apply_filters( 'available_languages', get_available_languages() ); // add a filter to unit test
		if ( !empty( $value ) && !in_array( $value, $allowed ) )
			return false;
		else
			return $value;
	}
}

global $wp_version;
$needs_class_fix = version_compare( $wp_version, '3.1', '>=') && version_compare( $wp_version, '3.1.3', '<' );
if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST && $needs_class_fix ) {
	include_once( ABSPATH . WPINC . '/class-IXR.php' );
	include_once( ABSPATH . WPINC . '/class-wp-xmlrpc-server.php' );

	class VaultPress_XMLRPC_Server_r17994 extends wp_xmlrpc_server {
		function set_custom_fields( $post_id, $fields ) {
			foreach( $fields as $k => $meta ) {
				$key = stripslashes( trim( $meta['key'] ) );
				if ( $key && '_' ==  $key[0] )
					unset( $fields[$k] );
			}
			parent::set_custom_fields( $post_id, $fields );
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
		foreach ( (array) $allowed_protocols as $one_protocol )
			if ( strtolower($one_protocol) == $string2 ) {
				$allowed = true;
				break;
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
