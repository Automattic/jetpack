import { render } from '@testing-library/react';
import * as React from 'react';
import DomEventHandler from '../dom-event-handler';

const noop = () => {};

const defaultProps = {
	themeOptions: {
		searchInputSelector: 'input[name="s"]',
		overlayTriggerSelector: '',
		filterInputSelector: '',
	},
	overlayOptions: { overlayTrigger: 'immediate' },
	isVisible: false,
	initializeQueryValues: noop,
	setSearchQuery: noop,
	setFilter: noop,
	showResults: noop,
};

describe( 'DomEventHandler.handleSubmit', () => {
	let setSearchQuery;
	let showResults;
	let preventDefault;

	beforeEach( () => {
		setSearchQuery = jest.fn();
		showResults = jest.fn();
		preventDefault = jest.fn();
	} );

	function makeSubmitEvent( action ) {
		const input = document.createElement( 'input' );
		input.name = 's';
		input.value = 'test';
		const form = document.createElement( 'form' );
		form.action = action;
		form.appendChild( input );
		return {
			target: form,
			preventDefault,
		};
	}

	function renderHandler( extraProps = {} ) {
		return render(
			<DomEventHandler
				{ ...defaultProps }
				setSearchQuery={ setSearchQuery }
				showResults={ showResults }
				{ ...extraProps }
			/>
		);
	}

	it( 'intercepts same-origin form submissions', () => {
		const { instance } = renderHandler();
		// Access the class instance via the rendered component ref is not straightforward with RTL;
		// call handleSubmit directly on a new instance.
		const handler = new DomEventHandler( defaultProps );
		handler.props = { ...defaultProps, setSearchQuery, showResults };

		const event = makeSubmitEvent( window.location.origin + '/search' );
		handler.handleSubmit( event );

		expect( preventDefault ).toHaveBeenCalled();
	} );

	it( 'does not intercept third-party form submissions', () => {
		const handler = new DomEventHandler( defaultProps );
		handler.props = { ...defaultProps, setSearchQuery, showResults };

		const event = makeSubmitEvent( 'https://third-party.example.com/subscribe' );
		handler.handleSubmit( event );

		expect( preventDefault ).not.toHaveBeenCalled();
		expect( showResults ).not.toHaveBeenCalled();
	} );

	it( 'does not intercept form submissions with a different subdomain', () => {
		const handler = new DomEventHandler( defaultProps );
		handler.props = { ...defaultProps, setSearchQuery, showResults };

		const event = makeSubmitEvent( 'https://other.example.com/form' );
		handler.handleSubmit( event );

		expect( preventDefault ).not.toHaveBeenCalled();
	} );
} );
