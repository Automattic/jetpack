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
	const styleVariables = generateStyleVariables( FRONTEND_SELECTOR );

	if ( ! styleVariables ) {
		return;
	}

	const outputContainer = document.querySelector( FRONTEND_SELECTOR );
	for ( const styleVariablesKey in styleVariables ) {
		outputContainer.style.setProperty( styleVariablesKey, styleVariables[ styleVariablesKey ] );
	}
}
