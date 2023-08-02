document.addEventListener( 'DOMContentLoaded', function () {
	const button = document.createElement( 'button' );
	button.textContent = 'Show Odie';

	button.addEventListener( 'click', function () {
		if ( window.Odie && window.Odie.render ) {
			window.Odie.render( {
				...window.JetpackXhrParams,
				domNode: document.getElementById( 'jetpack-odie-root' ),
				// eslint-disable-next-line no-console
				onLoaded: () => console.log( 'Odie is loaded.' ),
			} );
		}
	} );

	const widgetContainer = document.getElementById( 'jetpack-odie-root' );
	widgetContainer.appendChild( button );
} );
