import { resizeIframeOnMessage } from './utils';

document.addEventListener( 'DOMContentLoaded', () => {
	const iframes = document.querySelectorAll( 'iframe' );
	iframes.forEach( iframe => {
		if ( iframe.id.startsWith( 'nextdoor-block' ) ) {
			resizeIframeOnMessage( iframe.id );
		}
	} );
} );
