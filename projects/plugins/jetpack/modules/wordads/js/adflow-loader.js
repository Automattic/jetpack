function a8c_adflow_callback( data ) {
	if ( data && data.scripts && Array.isArray( data.scripts ) ) {
		if ( data.config ) {
			let configurationScript = document.createElement( 'script' );
			configurationScript.id = 'adflow-configuration';
			configurationScript.type = 'application/configuration';
			configurationScript.innerHTML = JSON.stringify( data.config );

			// Add the adflow-configuration script element to the document's body.
			document.head.appendChild( configurationScript );
		}

		// Load each adflow script.
		window.isWatlV1 = window.isWatlV1 ?? false;
		data.scripts.forEach( function ( scriptUrl ) {
			let script = document.createElement( 'script' );
			script.src = scriptUrl;
			document.head.appendChild( script );
			if ( scriptUrl.indexOf( 'watl.js' ) !== -1 ) {
				window.isWatlV1 = true;
			}
		} );

		window.loadIPONWEB = window.loadIPONWEB ?? function () {}; // Satisfy linter

		if ( window.isWatlV1 ) {
			// Then load IPONWEB scripts.
			if ( document.readyState === 'loading' ) {
				document.addEventListener( 'DOMContentLoaded', window.loadIPONWEB );
			} else {
				window.loadIPONWEB();
			}
		}
	}
}
window.a8c_adflow_callback = a8c_adflow_callback;
