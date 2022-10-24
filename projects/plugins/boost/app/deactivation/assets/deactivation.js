// eslint-disable-next-line no-undef
const deactivateButton = document.getElementById( `deactivate-${ jbDeactivation.pluginSlug }` );

// Add the dialog html to the page
let dialog;

deactivateButton.addEventListener( `click`, event => {
	event.preventDefault();
	setupDialog();
	attachEventListeners();
} );

function setupDialog() {
	dialog = document.createElement( 'div' );
	// eslint-disable-next-line no-undef
	dialog.innerHTML = jbDeactivation.dialogContent;
	document.body.appendChild( dialog );
}

function attachEventListeners() {
	dialog.addEventListener( 'deactivationDialog:close', closeDialog );
	dialog.addEventListener( 'deactivationDialog:deactivate', deactivate );
}

function closeDialog() {
	if ( dialog !== null ) {
		dialog.remove();
		dialog = null;
	}
}

function deactivate( event ) {
	if ( event.detail.feedback ) {
		window.open( 'https://example.com', '_blank' );
	}
	window.location.href = deactivateButton.href;
	closeDialog();
}

// eslint-disable-next-line no-unused-vars
const jbDeactivationEvents = {
	close: new Event( 'deactivationDialog:close', { bubbles: true } ),
	deactivate: new CustomEvent( 'deactivationDialog:deactivate', {
		bubbles: true,
		detail: { feedback: false },
	} ),
	deactivateWithFeedback: new CustomEvent( 'deactivationDialog:deactivate', {
		bubbles: true,
		detail: { feedback: true },
	} ),
};
