import autoComplete from '@tarekraafat/autocomplete.js';
import domReady from '@wordpress/dom-ready';
import './autocomplete.scss';

domReady( () => {
	document.querySelectorAll( 'input[data-jp-forms-autocomplete]' ).forEach( field => {
		const options = JSON.parse( field.dataset.jpFormsAutocomplete || [] );

		const cssPrefix = 'jp-forms-autocomplete';
		const cssResults = `${ cssPrefix }__results`;
		const cssResult = `${ cssPrefix }__result`;
		const cssResultHighlighted = `${ cssResult }-highlighted`;
		const cssResultSelected = `${ cssResult }-selected`;

		// https://tarekraafat.github.io/autoComplete.js/#/configuration
		// eslint-disable-next-line new-cap
		const ac = new autoComplete( {
			name: 'jpAutoComplete',
			selector: `#${ field.id }`,
			placeHolder: field.placeholder || '',
			data: {
				src: options,
			},
			wrapper: false,
			diacritics: true, // Language diacritics supported search
			threshold: 0, // Minimum characters to start searching, 0 keeps list open all the time
			resultsList: {
				tag: 'ul',
				id: `${ cssResults }_[id]`,
				class: cssResults,
				destination: '#jp-forms-autocomplete-results',
				position: 'afterend',
				maxResults: undefined, // All, use integer to limit results
				noResults: true,
				tabSelect: true,
			},
			resultItem: {
				tag: 'li',
				class: cssResult,
				highlight: cssResultHighlighted,
				selected: cssResultSelected,
			},
			events: {
				input: {
					// Open the list when the field is focused
					focus: () => {
						ac.open();
						ac.start();
					},
					// On pressing Enter while focused in the input
					keyup: event => {
						// When pressing enter and the list has just one item, make it selected
						if ( event.key === 'Enter' ) {
							const feedback = ac.feedback;
							if ( feedback?.results?.length === 1 ) {
								ac.input.value = feedback.results[ 0 ].value;
								ac.input.blur();
							}
						}
					},
					// On selecting an item from the list
					selection: event => {
						// Replace input value with the selected value
						ac.input.value = event.detail.selection.value;
						ac.input.blur();
					},
				},
			},
		} );
	} );
} );
