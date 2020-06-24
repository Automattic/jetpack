function moveElements( shadowRoot, elements ) {
	elements.forEach( child => {
		child.parentElement.removeChild( child );
		shadowRoot.appendChild( child );
	} );
}

function copyElements( shadowRoot, elements ) {
	elements.forEach( child => {
		shadowRoot.appendChild( child.cloneNode() );
	} );
}

export function toShadow( rootElement, { mode = 'open', styles = null } ) {
	const shadowRoot = rootElement.attachShadow( { mode } );

	const styleElements = typeof styles === 'string' ? document.querySelectorAll( styles ) : styles;

	copyElements( shadowRoot, [ ...styleElements ] );

	const newRoot = document.createElement( 'div' );
	shadowRoot.appendChild( newRoot );
	moveElements( newRoot, [ ...rootElement.children ] );

	return newRoot;
}

export function supportsShadow() {
	return !! ( document.head.attachShadow || document.head.createShadowRoot );
}
