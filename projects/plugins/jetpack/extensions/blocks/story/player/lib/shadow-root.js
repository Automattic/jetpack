import { createPortal, useCallback, useEffect, useState } from '@wordpress/element';

export const shadowRootSupported =
	window && window.Element && window.Element.prototype.hasOwnProperty( 'attachShadow' );

export default function ShadowRoot( {
	enabled,
	delegatesFocus = false,
	mode = 'open',
	globalStyleElements = [],
	adoptedStyleSheets = null,
	mountOnElement = null,
	children,
} ) {
	// component could be unmounted and remounted somewhere else (eg modal)
	// so we need to track ref changes in the placeholder
	const [ parentElement, setParentElement ] = useState( null );
	const rootElement = mountOnElement || parentElement;
	const [ shadowRoot, setShadowRoot ] = useState( null );

	const styleElements =
		typeof globalStyleElements === 'string'
			? [ ...document.querySelectorAll( globalStyleElements ) ]
			: globalStyleElements;
	const useShadow = shadowRootSupported && enabled && styleElements.length > 0;

	const placeholderRef = useCallback( placeholderElement => {
		if ( placeholderElement !== null ) {
			setParentElement( placeholderElement.parentNode );
		}
	}, [] );

	useEffect( () => {
		if ( ! rootElement ) {
			return;
		}

		// try to reuse existing shadowRoot
		if ( rootElement.shadowRoot ) {
			setShadowRoot( rootElement.shadowRoot );
			return;
		}

		const shadowElement = rootElement.attachShadow( {
			delegatesFocus,
			mode,
		} );

		// Still experimental, let's not use
		if ( adoptedStyleSheets ) {
			shadowElement.adoptedStyleSheets = adoptedStyleSheets;
		}

		setShadowRoot( shadowElement );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ rootElement ] );

	if ( useShadow && ! shadowRoot ) {
		return ! mountOnElement ? <span ref={ placeholderRef }></span> : null;
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
