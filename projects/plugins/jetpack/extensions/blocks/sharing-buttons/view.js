//import './style.scss';
import variations from '../sharing-button/variations.js';

const services = variations.map( variation => variation.name );
let windowOpen;

( function () {
	services.forEach( service => {
		document.querySelectorAll( `a.share-${ service }` ).forEach( link => {
			link.addEventListener( 'click', event => {
				if ( service === 'print' || service === 'mail' ) {
					return;
				}
				event.preventDefault();

				const el = event.target.closest( `a.share-${ service }` );
				if ( ! el ) {
					return;
				}

				if ( windowOpen !== undefined ) {
					windowOpen.close();
				}

				const options = 'menubar=1,resizable=1,width=600,height=400';
				windowOpen = window.open( el.getAttribute( 'href' ), `wpcom${ service }`, options );
				if ( windowOpen ) {
					windowOpen.focus();
				}
			} );
		} );
	} );
} )();
