export const getVideoPressSandboxScripts = scripts => {
	const sandboxScripts = Array.isArray( scripts ) ? [ ...scripts ] : [];

	if ( window.videopressAjax ) {
		const videopressAjaxURLBlob = new Blob(
			[
				`var videopressAjax = ${ JSON.stringify( {
					...window.videopressAjax,
					context: 'sandbox',
				} ) };`,
			],
			{
				type: 'text/javascript',
			}
		);

		sandboxScripts.push( URL.createObjectURL( videopressAjaxURLBlob ) );

		if ( window.videopressAjax.bridgeUrl ) {
			sandboxScripts.push( window.videopressAjax.bridgeUrl );
		}
	}

	if ( window?.videoPressEditorState?.playerBridgeUrl ) {
		sandboxScripts.push( window.videoPressEditorState.playerBridgeUrl );
	}

	return sandboxScripts;
};
