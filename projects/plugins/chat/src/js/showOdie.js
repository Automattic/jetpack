window.Odie = window.Odie || {};

/**
 * Renders the Odie chatbot in the specified DOM node or element ID.
 *
 * @param {HTMLElement|string} domNodeOrId - The DOM node or element ID to render the chatbot in.
 * @returns {Promise<boolean>} A promise that resolves to true when the chatbot has finished loading.
 * @todo pass locale.
 */
async function showOdie( domNodeOrId ) {
	return new Promise( ( resolve, reject ) => {
		if ( window.Odie && window.Odie.render ) {
			window.Odie.render( {
				domNode: typeof domNodeOrId !== 'string' ? domNodeOrId : undefined,
				onLoaded: () => resolve( true ),
			} );
		} else {
			reject( false );
		}
	} );
}

export { showOdie };
