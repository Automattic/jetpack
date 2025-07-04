import { useDispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';
import { useEffect } from 'react';

const SupportLinkHandler = () => {
	const helpCenterDispatch = useDispatch( 'automattic/help-center' );
	const setShowHelpCenter = helpCenterDispatch?.setShowHelpCenter;

	useEffect( () => {
		document.querySelectorAll( '.jetpack-support-link' ).forEach( link => {
			// eslint-disable-next-line no-console
			console.debug( 'link', link );
			link.addEventListener( 'click', event => {
				if ( setShowHelpCenter ) {
					event.preventDefault();
					setShowHelpCenter( true );
				}
			} );
		} );
	}, [ setShowHelpCenter ] );
};

domReady( () => {
	// eslint-disable-next-line no-console
	console.debug( '*** SupportLinkHandler mounted' );
	registerPlugin( 'wpcom-support-link-handler', {
		render: () => <SupportLinkHandler />,
	} );
} );
