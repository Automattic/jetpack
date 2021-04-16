export function getVendorLoadContext( elementRef ) {
	const vendorDoc = elementRef.ownerDocument;
	const vendorWindow = vendorDoc.defaultView || vendorDoc.parentWindow;

	return { vendorDoc, vendorWindow };
}

export function loadVendorResources( resources, elementRef ) {
	const { vendorDoc } = getVendorLoadContext( elementRef );

	const currentHead = vendorDoc.getElementsByTagName( 'head' )[ 0 ];

	if ( resources.css ) {
		resources.css.forEach( css => {
			const cssLink = vendorDoc.createElement( 'link' );
			cssLink.rel = 'stylesheet';
			cssLink.href = css.href;
			currentHead.appendChild( cssLink );
		} );
	}
	if ( resources.js ) {
		resources.js.forEach( js => {
			const jsScript = vendorDoc.createElement( 'script' );
			jsScript.type = 'text/javascript';
			jsScript.src = js.src;
			jsScript.onload = js.onload;
			currentHead.appendChild( jsScript );
		} );
	}
}
