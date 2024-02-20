// eslint-disable-next-line no-unused-vars
function a8c_cmp_callback( data ) {
	if ( data && data.scripts && Array.isArray( data.scripts ) ) {
		if ( data.config ) {
			let configurationScript = document.createElement( 'script' );
			configurationScript.id = 'cmp-configuration';
			configurationScript.type = 'application/configuration';
			configurationScript.innerHTML = JSON.stringify( data.config );

			// Add the cmp-configuration script element to the document's body
			document.head.appendChild( configurationScript );
		}

		// Load each cmp script
		data.scripts.forEach( function ( scriptUrl ) {
			let script = document.createElement( 'script' );
			script.src = scriptUrl;
			document.head.appendChild( script );
		} );
	}
}
