<?php

class AMP_DOM_Utils {
	public static function get_dom_from_content( $content ) {
		$libxml_previous_state = libxml_use_internal_errors( true );

		$dom = new DOMDocument;
		// Wrap in dummy tags, since XML needs one parent node.
		// It also makes it easier to loop through nodes.
		// We can later use this to extract our nodes.
		// Add utf-8 charset so loadHTML does not have problems parsing it. See: http://php.net/manual/en/domdocument.loadhtml.php#78243
		$result = $dom->loadHTML( '<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8"></head><body>' . $content . '</body></html>' );

		libxml_clear_errors();
		libxml_use_internal_errors( $libxml_previous_state );

		if ( ! $result ) {
			return false;
		}

		return $dom;
	}

	public static function get_content_from_dom( $dom ) {
		// Only want children of the body tag, since we have a subset of HTML.
		$out = '';
		$body = $dom->getElementsByTagName( 'body' )->item( 0 );

		// AMP elements always need closing tags.
		// To force them, we can't use saveHTML (node support is 5.3+) and LIBXML_NOEMPTYTAG results in issues with self-closing tags like `br` and `hr`.
		// So, we're manually forcing closing tags.
		self::recursive_force_closing_tags( $dom, $body );

		foreach ( $body->childNodes as $node ) {
			$out .= $dom->saveXML( $node );
		}
		return $out;
	}

	public static function create_node( $dom, $tag, $attributes ) {
		$node = $dom->createElement( $tag );
		self::add_attributes_to_node( $node, $attributes );
		return $node;
	}

	public static function get_node_attributes_as_assoc_array( $node ) {
		$attributes = array();
		if ( ! $node->hasAttributes() ) {
			return $attributes;
		}

		foreach ( $node->attributes as $attribute ) {
			$attributes[ $attribute->nodeName ] = $attribute->nodeValue;
		}
		return $attributes;
	}

	public static function add_attributes_to_node( $node, $attributes ) {
		foreach ( $attributes as $name => $value ) {
			$node->setAttribute( $name, $value );
		}
	}

	public static function is_node_empty( $node ) {
		return false === $node->hasChildNodes()
			&& empty( $node->textContent );
	}

	public static function recursive_force_closing_tags( $dom, $node ) {
		if ( XML_ELEMENT_NODE !== $node->nodeType ) {
			return;
		}

		if ( self::is_self_closing_tag( $node->nodeName ) ) {
			return;
		}

		if ( self::is_node_empty( $node ) ) {
			$text_node = $dom->createTextNode( '' );
			$node->appendChild( $text_node );
			return;
		}

		$num_children = $node->childNodes->length;
		for ( $i = $num_children - 1; $i >= 0; $i-- ) {
			$child = $node->childNodes->item( $i );
			self::recursive_force_closing_tags( $dom, $child );
		}
	}

	private static function is_self_closing_tag( $tag ) {
		// This function is called a lot; the static var prevents having to re-create the array every time.
		static $self_closing_tags;
		if ( ! isset( $self_closing_tags ) ) {
			// https://www.w3.org/TR/html5/syntax.html#serializing-html-fragments
			// Not all are valid AMP, but we include them for completeness.
			$self_closing_tags = array(
				'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'embed', 'frame', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr',
			);
		}

		return in_array( $tag, $self_closing_tags );
	}
}
