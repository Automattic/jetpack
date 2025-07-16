import autoComplete from '@tarekraafat/autocomplete.js';
import domReady from '@wordpress/dom-ready';

domReady( () => {
	document.querySelectorAll( 'input[jp-autocomplete]' ).forEach( field => {
		// https://tarekraafat.github.io/autoComplete.js/#/configuration
		// eslint-disable-next-line new-cap
		new autoComplete( {
			selector: `#${ field.id }`,
			placeHolder: field.placeholder || '',
			data: {
				src: [ 'Orange', 'Banana', 'Melon' ],
			},
			resultItem: {
				highlight: true,
			},
		} );
	} );
} );
