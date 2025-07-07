import { useDispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const UPSELL_WRAPPER_SELECTOR = '.wpcom_upsell_page_wrapper';

const UpsellSupportLinkHandler = () => {
	const helpCenterDispatch = useDispatch( 'automattic/help-center' );

	const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

	useEffect( () => {
		if ( ! setShowSupportDoc ) {
			return;
		}

		const links = Array.from(
			document.querySelectorAll( `${ UPSELL_WRAPPER_SELECTOR } a` )
		).filter( link => {
			try {
				const url = new URL( link.attributes?.href?.value );
				const allowedHosts = [ 'wordpress.com' ];
				return allowedHosts.includes( url.host ) && url.pathname.startsWith( '/support/' );
				// eslint-disable-next-line no-unused-vars
			} catch ( e ) {
				return false;
			}
		} );

		const handleClick = event => {
			event.preventDefault();
			setShowSupportDoc( event.target.href );
		};

		links.forEach( link => {
			link.addEventListener( 'click', handleClick );
		} );

		return () => {
			links.forEach( link => {
				link.removeEventListener( 'click', handleClick );
			} );
		};
	}, [ setShowSupportDoc ] );
};

domReady( () => {
	const upsellWrapper = document.querySelector( UPSELL_WRAPPER_SELECTOR );

	if ( ! upsellWrapper ) {
		return;
	}

	const rootElement = document.createElement( 'div' );
	document.body.appendChild( rootElement );
	const root = createRoot( rootElement );

	root.render( <UpsellSupportLinkHandler /> );
} );
