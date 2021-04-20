export function getLoadContext( elementRef ) {
	const currentDoc = elementRef.ownerDocument;
	const currentWindow = currentDoc.defaultView || currentDoc.parentWindow;

	return { currentDoc, currentWindow };
}

export function loadThirdPartyResources( resources, callbacks, elementRef ) {
	const resourcePath = `${ window.Jetpack_Block_Assets_Base_Url.url }third-party-resources`;
	const { currentDoc, currentWindow } = getLoadContext( elementRef );

	const currentHead = currentDoc.getElementsByTagName( 'head' )[ 0 ];

	resources.forEach( resource => {
		const fileExtension = resource.file.split( '.' ).pop();
		const filename = resource.file.split( '/' ).pop();

		if ( fileExtension === 'css' ) {
			if ( currentDoc.getElementById( resource.id ) ) {
				return;
			}
			const cssLink = currentDoc.createElement( 'link' );
			cssLink.id = resource.id;
			cssLink.rel = 'stylesheet';
			cssLink.href = `${ resourcePath }/${ resource.version }-${ filename }`;
			currentHead.appendChild( cssLink );
		}

		if ( fileExtension === 'js' ) {
			const callback = callbacks[ resource.id ] ? callbacks[ resource.id ] : null;
			if ( currentDoc.getElementById( resource.id ) ) {
				return callback();
			}
			const jsScript = currentDoc.createElement( 'script' );
			jsScript.id = resource.id;
			jsScript.type = 'text/javascript';
			jsScript.src = `${ resourcePath }/${ resource.version }-${ filename }`;
			jsScript.onload = callback;
			currentHead.appendChild( jsScript );
		}
	} );
}

export function waitForObject( currentWindow, objectName ) {
	return new Promise( resolve => {
		const waitFor = () => {
			if ( currentWindow[ objectName ] ) {
				resolve( currentWindow[ objectName ] );
			} else {
				currentWindow.requestAnimationFrame( waitFor );
			}
		};
		waitFor();
	} );
}
