// From src/blocks/contact-form/view.js
// TODO: extract this to a separate file
const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';

const initForm = form => {
	form.setAttribute( 'noValidate', true );
	form.addEventListener( 'submit', e => {
		e.preventDefault();

		// TODO
	} );
};

const initPageForms = () => {
	document.querySelectorAll( `${ FRONTEND_SELECTOR } form.contact-form` ).forEach( initForm );
};

document.addEventListener( 'DOMContentLoaded', () => {
	initPageForms();
} );
