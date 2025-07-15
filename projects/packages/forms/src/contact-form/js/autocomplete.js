import autoComplete from '@tarekraafat/autocomplete.js';
import domReady from '@wordpress/dom-ready';

domReady( () => {
	document.querySelectorAll( '.jp-autocomplete' ).forEach( node => {
		// https://tarekraafat.github.io/autoComplete.js/#/configuration
		// eslint-disable-next-line new-cap
		new autoComplete( {
			selector: `#${ node.id }`,
			placeHolder: 'Search for fruit...',
			data: {
				src: [ 'Orange', 'Banana', 'Melon' ],
			},
			resultItem: {
				highlight: true,
			},
		} );
	} );
} );
