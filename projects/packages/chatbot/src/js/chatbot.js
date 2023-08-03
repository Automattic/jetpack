document.addEventListener( 'DOMContentLoaded', function () {
	const button = document.createElement( 'button' );
	button.textContent = 'Show Chat';

	button.addEventListener( 'click', function () {
		if ( window.Odie && window.Odie.render ) {
			window.Odie.render( {
				...window.chatbotData,
				domNode: document.getElementById( 'jetpack-chatbot-root' ),
				// eslint-disable-next-line no-console
				onLoaded: () => console.log( 'Chat is loaded.' ),
			} );
		}
	} );

	const widgetContainer = document.getElementById( 'jetpack-chatbot-root' );
	widgetContainer.appendChild( button );
} );
