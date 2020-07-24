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

export const constructableStylesheetsSupported =
	window &&
	window.ShadowRoot &&
	window.ShadowRoot.prototype.hasOwnProperty( 'adoptedStyleSheets' ) &&
	window.CSSStyleSheet &&
	window.CSSStyleSheet.prototype.hasOwnProperty( 'replace' );

export const shadowRootSupported =
	window && window.Element && window.Element.prototype.hasOwnProperty( 'attachShadow' );

/*
 * Adapted from https://github.com/apearce/react-shadow-root
 */
export default function ReactShadowRoot( {
	delegatesFocus = false,
	mode = 'open',
	stylesheets,
	children,
} ) {
	const placeholder = useRef();
	const [ shadowRoot, setShadowRoot ] = useState( false );

	useEffect( () => {
		const shadowElement = placeholder.current.parentNode.attachShadow( {
			delegatesFocus,
			mode,
		} );

		if ( stylesheets ) {
			shadowElement.adoptedStyleSheets = stylesheets;
		}

		setShadowRoot( shadowElement );
	}, [] );

	if ( ! shadowRoot ) {
		return <span ref={ placeholder }></span>;
	}

	return createPortal( children, shadowRoot );
}
