import { DatePicker } from './../libs/date-picker/date-picker';

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '.jp-contact-form-date' ).forEach( function ( node ) {
		DatePicker( node, {
			lang: window.jpDatePicker.lang,
			dayOffset: Number( window.jpDatePicker.offset ),
			dateFormat: node.dataset.format,
			hasFooter: false,
		} ).on( 'close', function () {
			var event = new Event( 'blur', {
				bubbles: true,
				cancelable: true,
			} );
			node.dispatchEvent( event );
		} );
	} );
} );
