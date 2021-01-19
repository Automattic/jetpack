/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createPortal, useCallback, useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */

export const shadowRootSupported =
	window && window.Element && window.Element.prototype.hasOwnProperty( 'attachShadow' );

function useHookWithRefCallback() {
	const ref = useRef( null );
	const setRef = useCallback( node => {
		ref.current = node;
	}, [] );

	return [ setRef ];
}

export default function ShadowRoot( {
	enabled,
	delegatesFocus = false,
	mode = 'open',
	globalStyleElements = [],
	adoptedStyleSheets = null,
	children,
} ) {
	// component could be unmounted and remounted somewhere else (eg modal)
	// so we need to track ref changes in the placeholder
	const [ placeholder, setPlaceholder ] = useState( null );
	const placeholderRef = useCallback( element => {
		if ( element !== null ) {
			setPlaceholder( element );
		}
	}, [] );

	const [ shadowRoot, setShadowRoot ] = useState( false );
	const styleElements =
		typeof globalStyleElements === 'string'
			? [ ...document.querySelectorAll( globalStyleElements ) ]
			: globalStyleElements;
	const useShadow = shadowRootSupported && enabled && styleElements.length > 0;

	useEffect( () => {
		if ( ! placeholder ) {
			return;
		}

		// try to reuse existing shadowRoot
		if ( placeholder.parentNode.shadowRoot ) {
			setShadowRoot( placeholder.parentNode.shadowRoot );
			return;
		}

		const shadowElement = placeholder.parentNode.attachShadow( {
			delegatesFocus,
			mode,
		} );

		// Still experimental, let's not use
		if ( adoptedStyleSheets ) {
			shadowElement.adoptedStyleSheets = adoptedStyleSheets;
		}

		setShadowRoot( shadowElement );
	}, [ placeholder ] );

	if ( useShadow && ! shadowRoot ) {
		return <span ref={ placeholderRef }></span>;
	}

	const App = (
		<>
			{ useShadow && <Styles globalStyleElements={ styleElements } /> }
			{ children }
		</>
	);

	if ( ! useShadow ) {
		return App;
	}

	return createPortal( App, shadowRoot );
}

function Styles( { globalStyleElements } ) {
	return (
		<>
			{ globalStyleElements.map( ( { id, tagName, attributes, innerHTML }, index ) => {
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
