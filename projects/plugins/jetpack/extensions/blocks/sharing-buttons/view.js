import domReady from '@wordpress/dom-ready';
import './style.scss';

let sharingWindowOpen;

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		const servicesContainer = document.getElementById( 'jetpack-sharing-serivces-list' );
		if ( ! servicesContainer ) {
			return;
		}
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
	} );
}
