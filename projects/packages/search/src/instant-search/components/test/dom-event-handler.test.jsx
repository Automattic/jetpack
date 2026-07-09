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

	/**
	 * Creates a mock submit event targeting a form with the given action URL.
	 *
	 * @param {string} action - The form action URL.
	 * @return {object} A mock submit event with `target` and `preventDefault`.
	 */
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

	/**
	 * Creates a DomEventHandler instance with test props injected.
	 *
	 * @param {object} extraProps - Additional props to merge.
	 * @return {DomEventHandler} The handler instance.
	 */
	function makeHandler( extraProps = {} ) {
		const handler = new DomEventHandler( defaultProps );
		handler.props = { ...defaultProps, setSearchQuery, showResults, ...extraProps };
		return handler;
	}

	it( 'intercepts same-origin form submissions', () => {
		const handler = makeHandler();
		const event = makeSubmitEvent( window.location.origin + '/search' );
		handler.handleSubmit( event );

		expect( preventDefault ).toHaveBeenCalled();
	} );

	it( 'does not intercept third-party form submissions', () => {
		const handler = makeHandler();
		const event = makeSubmitEvent( 'https://third-party.example.com/subscribe' );
		handler.handleSubmit( event );

		expect( preventDefault ).not.toHaveBeenCalled();
		expect( showResults ).not.toHaveBeenCalled();
	} );

	it( 'does not intercept form submissions with a different subdomain', () => {
		const handler = makeHandler();
		const event = makeSubmitEvent( 'https://other.example.com/form' );
		handler.handleSubmit( event );

		expect( preventDefault ).not.toHaveBeenCalled();
	} );

	it( 'does not intercept form submissions with a malformed action URL', () => {
		const handler = makeHandler();
		// Use a plain mock target so `action` is not resolved by jsdom into an
		// absolute URL. An empty string passed to `new URL()` throws a TypeError,
		// which exercises the catch-and-return branch in handleSubmit.
		const event = {
			target: { action: '' },
			preventDefault,
		};
		handler.handleSubmit( event );

		expect( preventDefault ).not.toHaveBeenCalled();
		expect( showResults ).not.toHaveBeenCalled();
	} );
} );
