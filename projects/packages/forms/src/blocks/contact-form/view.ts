import './util/form-styles';

const { generateStyleVariables } = window.jetpackForms;
const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';

//Fallback in case of the page load event takes too long to fire up
const fallbackTimer = setTimeout( () => {
	handleFormStyles();
}, 3000 );

window.addEventListener( 'load', () => {
	clearTimeout( fallbackTimer );
	handleFormStyles();
} );

function handleFormStyles() {
	const formNodes = document.querySelectorAll( FRONTEND_SELECTOR ) as NodeListOf< HTMLElement >;

	for ( const formNode of formNodes ) {
		const styleVariables = generateStyleVariables( formNode );

		if ( ! styleVariables ) {
			return;
		}

		for ( const styleVariablesKey in styleVariables ) {
			formNode.style.setProperty( styleVariablesKey, styleVariables[ styleVariablesKey ] );
		}
	}
}
