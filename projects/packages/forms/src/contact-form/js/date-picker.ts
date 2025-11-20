/*
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';
/*
 * Internal dependencies
 */
import { DatePicker } from '../libs/date-picker/date-picker.ts';

domReady( () => {
	(
		document.querySelectorAll( '.jp-contact-form-date' ) as NodeListOf< HTMLInputElement >
	 ).forEach( node => {
		DatePicker( node, {
			lang: window.jpDatePicker.lang,
			dayOffset: Number( window.jpDatePicker.offset ),
			dateFormat: node.dataset.format,
			hasFooter: false,
		} ).on( 'close', () => {
			const event = new Event( 'blur', {
				bubbles: true,
				cancelable: true,
			} );
			node.dispatchEvent( event );
		} );
	} );
} );
