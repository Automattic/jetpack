/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createPortal, useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */

export const shadowRootSupported =
	window && window.Element && window.Element.prototype.hasOwnProperty( 'attachShadow' );

export default function ShadowRoot( {
	enabled,
	delegatesFocus = false,
	mode = 'open',
	globalStyleElements = [],
	adoptedStyleSheets = null,
	children,
} ) {
	const placeholder = useRef();
	const [ shadowRoot, setShadowRoot ] = useState( false );
	const useShadow = shadowRootSupported && enabled;

	useEffect( () => {
		if ( ! placeholder.current ) {
			return;
		}

		const shadowElement = placeholder.current.parentNode.attachShadow( {
			delegatesFocus,
			mode,
		} );

		// Still experimental, let's not use
		if ( adoptedStyleSheets ) {
			shadowElement.adoptedStyleSheets = adoptedStyleSheets;
		}

		setShadowRoot( shadowElement );
	}, [ placeholder.current ] );

	if ( useShadow && ! shadowRoot ) {
		return <span ref={ placeholder }></span>;
	}

	const App = (
		<>
			{ useShadow && <Styles globalStyleElements={ globalStyleElements } /> }
			{ children }
		</>
	);

	if ( ! useShadow ) {
		return App;
	}

	return createPortal( App, shadowRoot );
}

function Styles( { globalStyleElements } ) {
	const styleElements =
		typeof globalStyleElements === 'string'
			? [ ...document.querySelectorAll( globalStyleElements ) ]
			: globalStyleElements;

	return (
		<>
			{ styleElements.map( ( { id, tagName, attributes, innerHTML }, index ) => {
				if ( tagName === 'LINK' ) {
					return (
						<link
							key={ id || index }
							id={ id }
							rel={ attributes.rel.value }
							href={ attributes.href.value }
						/>
					);
				} else if ( tagName === 'STYLE' ) {
					return (
						<style key={ id || index } id={ id }>
							{ innerHTML }
						</style>
					);
				}
			} ) }
		</>
	);
}
