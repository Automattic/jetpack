import './style.scss';

const services = window?.jetpack_sharing_buttons_services || [];
let windowOpen;

( function () {
	services.forEach( service => {
		document.querySelectorAll( `a.share-${ service }` ).forEach( link => {
			link.addEventListener( 'click', event => {
				if ( service === 'mail' ) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();

				if ( service === 'print' ) {
					window.print();
					return;
				}

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
