import domReady from '@wordpress/dom-ready';
import './style.scss';

let sharingWindowOpen;

function isWebShareAPIEnabled( data ) {
	if (
		! navigator ||
		typeof navigator.share !== 'function' ||
		typeof navigator.canShare !== 'function'
	) {
		return false;
	}

	return navigator.canShare( data );
}

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		const containers = document.getElementsByClassName( 'wp-block-jetpack-sharing-buttons' );

		for ( const servicesContainer of containers ) {
			servicesContainer.addEventListener( 'click', event => {
				const link = event.target.closest( 'a' );
				const service = link?.dataset?.service;

				if ( ! link || ! link.classList.contains( `share-${ service }` ) ) {
					return;
				}

				if ( service === 'mail' ) {
					return;
				}

				event.preventDefault();
				event.stopPropagation();

				if ( service === 'share' ) {
					if ( link?.href && isWebShareAPIEnabled( { url: link.href } ) ) {
						navigator.share( { url: link.href } );
					} else {
						navigator?.clipboard?.writeText( link.href );
					}
					return;
				}

				if ( service === 'print' ) {
					window.print();
					return;
				}
				if ( sharingWindowOpen ) {
					sharingWindowOpen.close();
				}

				sharingWindowOpen = window.open(
					link.getAttribute( 'href' ),
					`wpcom${ service }`,
					'menubar=1,resizable=1,width=600,height=400'
				);

				if ( sharingWindowOpen ) {
					sharingWindowOpen.focus();
				}
			} );
		}
	} );
}
