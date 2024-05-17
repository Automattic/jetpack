import { resizeIframeOnMessage } from './utils';

document.addEventListener( 'DOMContentLoaded', () => {
	const embeds = document.querySelectorAll( 'figure' );
	embeds.forEach( embed => {
		if ( embed.id.startsWith( 'nextdoor-block' ) ) {
			resizeIframeOnMessage( embed.id );
		}
	} );
} );
