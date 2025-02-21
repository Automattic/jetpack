import { DatePicker } from './../libs/date-picker/date-picker';

import './../libs/date-picker/date-picker.css';

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '.jp-contact-form-date' ).forEach( function ( node ) {
		DatePicker( node, {
			lang: window.jpDatePicker.lang,
			dayOffset: Number( window.jpDatePicker.offset ),
			dateFormat: node.dataset.format,
		} );
	} );
} );
