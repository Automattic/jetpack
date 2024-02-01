type AttributeSet = {
	[ attribute: string ]: EventListenerOrEventListenerObject | number | string;
};

export type TemplateVars = {
	[ name: string ]: [ string, AttributeSet, string ] | [ string, AttributeSet ];
};

/**
 * Copy DOM elements from source to target, replacing tags which match a key in
 * vars with the specified element(s).
 *
 * @param {Node}         source DOM node to copy from
 * @param {Node}         target DOM node to copy into
 * @param {TemplateVars} vars   Specification of tags to replace
 */
export function copyDomTemplate( source: Node, target: Node, vars: TemplateVars ): void {
	for ( const child of Array.from( source.childNodes ) as Element[] ) {
		let newNode: Element;

		if ( vars[ child.nodeName ] ) {
			const [ tag, attributes, content ] = vars[ child.nodeName ];
			newNode = createNode( tag, attributes, content );

			// Keep attributes from template.
			copyAttributes( child, newNode );
		} else if ( child.tagName ) {
			newNode = document.createElement( child.tagName );
			copyAttributes( child, newNode );
		} else {
			newNode = child.cloneNode() as Element;
		}

		target.appendChild( newNode );
		copyDomTemplate( child, newNode, vars );
	}
}

/**
 * Copy attributes from one DOM element to another.
 *
 * @param {Element} from Element to copy attributes from
 * @param {Element} to   Element to copy attributes to
 */
function copyAttributes( from: Element, to: Element ): void {
	for ( let i = 0; i < from.attributes.length; i++ ) {
		const attribute = from.attributes.item( i );
		to.setAttribute( attribute.name, attribute.value );
	}
}

/**
 * Helper function - creates a node based on the specified tag, attributes, and
 * child content.
 *
 * @param {string}             tag        tag name of new node
 * @param {AttributeSet}       attributes attributes for the new node
 * @param {string | undefined} content    optional content to pack into the node.
 * @return {Node} the node
 */
function createNode( tag: string, attributes: AttributeSet, content?: string ): Element {
	const node = document.createElement( tag );

	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( key.startsWith( 'on' ) && value instanceof Function ) {
			node.addEventListener( key.substring( 2 ), value );
		} else {
			node.setAttribute( key, value.toString() );
		}
	}

	if ( content ) {
		node.append( content );
	}

	return node;
}
