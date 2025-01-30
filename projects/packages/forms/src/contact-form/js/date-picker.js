import domReady from '@wordpress/dom-ready';
import Datepicker from 'vanillajs-datepicker/Datepicker';

import 'vanillajs-datepicker/css/datepicker.css';

domReady( () => {
	const collection = document.getElementsByClassName( 'jp-contact-form-date' );
	for ( let i = 0; i < collection.length; i++ ) {
		const dateFormat = collection[ i ].getAttribute( 'data-format' );
		new Datepicker( collection[ i ], { format: dateFormat } );
	}
} );
