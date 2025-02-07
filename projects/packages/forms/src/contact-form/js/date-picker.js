import domReady from '@wordpress/dom-ready';
import { DatePicker } from './../libs/date-picker/date-picker';

import './../libs/date-picker/date-picker.css';

domReady( () => {
	document.querySelectorAll( '.jp-contact-form-date' ).forEach( function ( node ) {
		DatePicker( node, {
			lang: window.jpDatePicker.lang,
			dayOffset: Number( window.jpDatePicker.offset ),
			dateFormat: node.dataset.format,
		} );
	} );
} );
