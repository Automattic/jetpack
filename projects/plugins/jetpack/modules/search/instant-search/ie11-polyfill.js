// self-invoked wrapper for scoping the `document` variable
! ( function ( d ) {
	// currentScript is supported by all modern browsers, but not by IE.
	// https://caniuse.com/document-currentscript
	if ( ! d.currentScript ) {
		const s = d.createElement( 'script' );
		s.src = window.JetpackInstantSearchIe11PolyfillPath;
		d.head.appendChild( s );
	}
} )( document );
