<?php
/**
 * Module Name: Publicize
 * Module Description: Connect your site to popular social networks and automatically share new posts with your friends.
 * Sort Order: 1
 * First Introduced: 2.0
 */

class Jetpack_Publicize {

	var $in_jetpack = true;

	function __construct() {
		global $publicize_ui;

		$this->in_jetpack = ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'enable_module_configurable' ) ) ? true : false;

		if ( $this->in_jetpack && method_exists( 'Jetpack', 'module_configuration_load' ) ) {
			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'jetpack_configuration_load' ) );
			Jetpack_Sync::sync_posts( __FILE__ );
		}

		require_once dirname( __FILE__ ) . '/publicize/publicize.php';

		if ( $this->in_jetpack )
			require_once dirname( __FILE__ ) . '/publicize/publicize-jetpack.php';
		else {
			require_once dirname( dirname( __FILE__ ) ) . '/mu-plugins/keyring/keyring.php';
			require_once dirname( __FILE__ ) . '/publicize/publicize-wpcom.php';
		}

		require_once dirname( __FILE__ ) . '/publicize/ui.php';
		$publicize_ui = new Publicize_UI();
		$publicize_ui->in_jetpack = $this->in_jetpack;

		// Jetpack specific checks / hooks
		if ( $this->in_jetpack) {
			add_action( 'jetpack_activate_module_publicize',   array( $this, 'module_state_toggle' ) );
			add_action( 'jetpack_deactivate_module_publicize', array( $this, 'module_state_toggle' ) );

			// if sharedaddy isn't active, the sharing menu hasn't been added yet
			$active = Jetpack::get_active_modules();
			if ( in_array( 'publicize', $active ) && !in_array( 'sharedaddy', $active ) )
				add_action( 'admin_menu', array( &$publicize_ui, 'sharing_menu' ) );
		}
	}

	function module_state_toggle() {
		// extra check that we are on the JP blog, just incase
		if ( class_exists( 'Jetpack' ) && $this->in_jetpack ) {
			$jetpack = Jetpack::init();
			$jetpack->sync->register( 'noop' );
		}
	}

	function jetpack_configuration_load() {
		wp_safe_redirect( menu_page_url( 'sharing', false ) );
		exit;
	}
}

global $publicize_ui;
new Jetpack_Publicize;

/**
* Helper functions for shared use in the services files
*/
class Publicize_Util {
	/**
	 * Truncates a string to be shorter than or equal to the length specified
	 * Attempts to truncate on word boundaries
	 *
	 * @param string $string
	 * @param int $length
	 * @return string
	 */
	function crop_str( $string, $length = 256 ) {
		$string = wp_strip_all_tags( (string) $string, true ); // true: collapse Linear Whitespace into " "
		$length = absint( $length );

		if ( mb_strlen( $string, 'UTF-8' ) <= $length ) {
			return $string;
		}

		// @see wp_trim_words()
		if ( 'characters' == _x( 'words', 'word count: words or characters?', 'jetpack' ) ) {
			return trim( mb_substr( $string, 0, $length - 1, 'UTF-8' ) ) . "\xE2\x80\xA6"; // ellipsis
		}

		$words = explode( ' ', $string );

		$return = '';
		while ( strlen( $word = array_shift( $words ) ) ) {
			$new_return = $return ? "$return $word" : $word;
			$new_return_length = mb_strlen( $new_return, 'UTF-8' );
			if ( $new_return_length < $length - 1 ) {
				$return = $new_return;
				continue;
			} elseif ( $new_return_length == $length - 1 ) {
				$return = $new_return;
				break;
			}

			if ( !$return ) {
				$return = mb_substr( $new_return, 0, $length - 1, 'UTF-8' );
			}

			break;
		}

		return "$return\xE2\x80\xA6"; // ellipsis
	}

	/**
	 * Truncates HTML so that its textContent (text without markup) is shorter than or equal to the length specified.
	 * The length of the returned string may be larger than the specified length due to the markup.
	 * Attempts to truncate on word boundaries.
	 *
	 * @param string $string
	 * @param int $length
	 * @param array $allowed_tags KSES input
	 * @return string
	 */
	function crop_html( $string, $length = 256, $allowed_tags = array() ) {
		$tags = $GLOBALS['allowedtags']; // Markup allowed in comments...

		$tags['img'] = array( // ... plus images ...
			'alt' => true,
			'height' => true,
			'src' => true,
			'width' => true,
		);

		// ... and some other basics
		$tags['p'] = array();
		$tags['ul'] = array();
		$tags['ol'] = array();
		$tags['li'] = array();
		$tags['br'] = array();

		$tags = array_merge( $tags, $allowed_tags );

		// Clean up, then KSES to really lock it down
		$string = trim( (string) $string );
		$string = preg_replace( '@<(script|style)[^>]*?>.*?</\\1>@si', '', $string );
		$string = wp_kses( $string, $tags );

		if ( mb_strlen( $string, 'UTF-8' ) <= $length ) {
			return $string;
		}

		$string = mb_convert_encoding( $string, 'HTML-ENTITIES', 'UTF-8' );
		$dom = new DOMDocument( '1.0', 'UTF-8' );
		@$dom->loadHTML( "<html><body>$string</body></html>" ); // suppress parser warning

		$body = false;
		foreach ( $dom->childNodes as $child ) {
			if ( XML_ELEMENT_NODE === $child->nodeType && 'html' === strtolower( $child->tagName ) ) {
				$body = $child->firstChild;
				break;
			}
		}

		if ( !$body ) {
			return self::crop_str( $string, $length );
		}

		// If the text (without the markup) is shorter than $length, just return
		if ( mb_strlen( $body->textContent, 'UTF-8' ) <= $length ) {
			return $string;
		}

		$node = false;
		do {
			$node = self::remove_innermost_last_child( $body, $node_removed_from );
			$new_string_length = mb_strlen( $body->textContent, 'UTF-8' );
		} while ( $new_string_length > $length );

		$new_string = $dom->saveHTML( $body );
		$new_string = mb_substr( $new_string, 6, -7, 'UTF-8' ); // 6: <body>, 7: </body>

		if ( !$node ) {
			return $new_string ? $new_string : self::crop_str( $string, $length );
		}

		$append_string_length = $length - $new_string_length;

		if ( !$append_string_length ) {
			return $new_string;
		}

		if ( $append_string_length > 1 && XML_TEXT_NODE === $node->nodeType ) { // 1: ellipsis
			$append_string = self::crop_str( $node->textContent, $append_string_length ); // includes ellipsis
			$append_node = $dom->createTextNode( $append_string );
			$node_removed_from->appendChild( $append_node );
			$new_string = $dom->saveHTML( $body );
			$new_string = mb_substr( $new_string, 6, -7, 'UTF-8' );
		} elseif ( $append_string_length > 9 && XML_ELEMENT_NODE === $node->nodeType && 'p' == strtolower( $node->nodeName ) ) { // 9: '<p>X{\xE2\x80\xA6}</p>'
			$new_string .= '<p>' . self::crop_str( $node->textContent, $append_string_length - 8 ) . '</p>';
		}

		// Clean up any empty Paragraphs that might have occurred after removing their children
		return trim( preg_replace( '#<p>\s*</p>#i', '', $new_string ) );
	}

	function remove_innermost_last_child( $node, &$node_removed_from ) {
		$node_removed_from = $node;

		if ( !$node->lastChild ) {
			return false;
		}

		if ( $node->lastChild->hasChildNodes() ) {
			return self::remove_innermost_last_child( $node->lastChild, $node_removed_from );
		}

		$innermost_last_child = $node->lastChild;
		$node->removeChild( $innermost_last_child );

		return $innermost_last_child;
	}

	function bump_stats_extras_publicize_url( $bin, $post_id ) {
		static $done = array();
		if ( isset( $done[$post_id] ) ) {
			return;
		}
		$done[$post_id] = true;

		if ( function_exists( 'bump_stats_extras' ) )
			bump_stats_extras( 'publicize_url', $bin );
	}

	function build_sprintf( $args ) {
		$search = array();
		$replace = array();
		foreach ( $args as $k => $arg ) {
			if ( 0 == $k ) {
				$string = $arg;
				continue;
			}
			$search[] = "%$arg%";
			$replace[] = "%$k\$s";
		}
		return str_replace( $search, $replace, $string );
	}
}
