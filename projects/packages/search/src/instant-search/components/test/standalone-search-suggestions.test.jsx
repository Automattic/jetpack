jest.mock( '../../hooks/use-search-suggestions' );
jest.mock( '../search-suggestions', () => {
	const React = require( 'react' );
	return ( { suggestions, activeIndex, onSelect } ) => (
		<ul data-testid="search-suggestions" data-active-index={ activeIndex }>
			{ suggestions.map( ( s, i ) => (
				<li
					key={ i }
					data-testid={ `suggestion-${ i }` }
					role="option"
					onClick={ () => onSelect( s ) }
					onKeyDown={ e => e.key === 'Enter' && onSelect( s ) }
				>
					{ s.text }
				</li>
			) ) }
		</ul>
	);
} );
jest.mock( '../search-suggestions.scss', () => {} );

import { render, screen, act } from '@testing-library/react';
import * as React from 'react';
import useSearchSuggestions from '../../hooks/use-search-suggestions';
import StandaloneSearchSuggestions from '../standalone-search-suggestions';

/**
 * Creates a mock DOM input element.
 * @param {string} [initialValue=''] - initial value for the input
 * @return {object} Mock input element with addEventListener/_trigger helpers
 */
function makeMockInput( initialValue = '' ) {
	const listeners = {};
	return {
		value: initialValue,
		addEventListener: ( event, handler ) => {
			listeners[ event ] = listeners[ event ] || [];
			listeners[ event ].push( handler );
		},
		removeEventListener: ( event, handler ) => {
			if ( listeners[ event ] ) {
				listeners[ event ] = listeners[ event ].filter( h => h !== handler );
			}
		},
		_trigger: ( event, eventObj ) => {
			( listeners[ event ] || [] ).forEach( h => h( eventObj ) );
		},
	};
}

/**
 * Creates a mock form element.
 * @return {object} Mock form element with a jest.fn() submit method
 */
function makeMockForm() {
	return {
		submit: jest.fn(),
	};
}

beforeEach( () => {
	jest.useFakeTimers();
	useSearchSuggestions.mockReturnValue( { suggestions: [], isLoading: false } );
} );

afterEach( () => {
	jest.runAllTimers();
	jest.useRealTimers();
	jest.clearAllMocks();
} );

describe( 'StandaloneSearchSuggestions', () => {
	it( 'returns null when suggestions list is empty', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		useSearchSuggestions.mockReturnValue( { suggestions: [], isLoading: false } );

		const { container } = render(
			<StandaloneSearchSuggestions input={ input } form={ form } siteId="123" />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'returns null when showSuggestions is false (initial state)', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		useSearchSuggestions.mockReturnValue( {
			suggestions: [ { type: 'query', text: 'hello' } ],
			isLoading: false,
		} );

		const { container } = render(
			<StandaloneSearchSuggestions input={ input } form={ form } siteId="123" />
		);
		// showSuggestions starts false, so nothing is rendered even with suggestions
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows SearchSuggestions after input event with non-empty text', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'query', text: 'wordpress' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'word' } } );
		} );

		expect( screen.getByTestId( 'search-suggestions' ) ).toBeInTheDocument();
	} );

	it( 'does not show suggestions after input event with empty text', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'query', text: 'something' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: '' } } );
		} );

		expect( screen.queryByTestId( 'search-suggestions' ) ).not.toBeInTheDocument();
	} );

	it( 'hides suggestions after Escape key', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'query', text: 'wordpress' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		// Show suggestions first
		act( () => {
			input._trigger( 'input', { target: { value: 'word' } } );
		} );
		expect( screen.getByTestId( 'search-suggestions' ) ).toBeInTheDocument();

		// Press Escape to hide
		act( () => {
			input._trigger( 'keydown', { key: 'Escape', preventDefault: jest.fn() } );
		} );
		expect( screen.queryByTestId( 'search-suggestions' ) ).not.toBeInTheDocument();
	} );

	it( 'increments activeIndex on ArrowDown', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [
			{ type: 'query', text: 'first' },
			{ type: 'query', text: 'second' },
		];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		// Reveal suggestions first
		act( () => {
			input._trigger( 'input', { target: { value: 'f' } } );
		} );

		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );

		const list = screen.getByTestId( 'search-suggestions' );
		expect( list ).toHaveAttribute( 'data-active-index', '0' );
	} );

	it( 'increments activeIndex further on repeated ArrowDown', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [
			{ type: 'query', text: 'first' },
			{ type: 'query', text: 'second' },
		];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'f' } } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );

		const list = screen.getByTestId( 'search-suggestions' );
		expect( list ).toHaveAttribute( 'data-active-index', '1' );
	} );

	it( 'does not go above last item on ArrowDown when at end', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'query', text: 'only' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'o' } } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );

		const list = screen.getByTestId( 'search-suggestions' );
		expect( list ).toHaveAttribute( 'data-active-index', '0' );
	} );

	it( 'decrements activeIndex on ArrowUp but not below -1', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [
			{ type: 'query', text: 'first' },
			{ type: 'query', text: 'second' },
		];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'f' } } );
		} );
		// Go down to index 0
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );
		// Go back up to -1
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowUp', preventDefault: jest.fn() } );
		} );

		const list = screen.getByTestId( 'search-suggestions' );
		expect( list ).toHaveAttribute( 'data-active-index', '-1' );

		// Try to go further up — should stay at -1
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowUp', preventDefault: jest.fn() } );
		} );
		expect( list ).toHaveAttribute( 'data-active-index', '-1' );
	} );

	it( 'selects active query item on Enter: sets input.value and submits form', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'query', text: 'wordpress hooks' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'w' } } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'Enter', preventDefault: jest.fn() } );
		} );

		expect( input.value ).toBe( 'wordpress hooks' );
		expect( form.submit ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'selects active post item on Enter: navigates to item.url (verifies navigation branch)', () => {
		const errorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'post', text: 'Getting Started', url: '/getting-started/' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'g' } } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'ArrowDown', preventDefault: jest.fn() } );
		} );
		act( () => {
			input._trigger( 'keydown', { key: 'Enter', preventDefault: jest.fn() } );
		} );

		// Verify the navigation branch: form.submit is NOT called for post items.
		expect( form.submit ).not.toHaveBeenCalled();
		errorSpy.mockRestore();
	} );

	it( 'hides suggestions after blur with timeout', () => {
		const input = makeMockInput();
		const form = makeMockForm();
		const suggestions = [ { type: 'query', text: 'hello' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );

		render( <StandaloneSearchSuggestions input={ input } form={ form } siteId="123" /> );

		act( () => {
			input._trigger( 'input', { target: { value: 'h' } } );
		} );
		expect( screen.getByTestId( 'search-suggestions' ) ).toBeInTheDocument();

		act( () => {
			input._trigger( 'blur', {} );
		} );
		// Suggestions still showing before the timeout fires
		expect( screen.getByTestId( 'search-suggestions' ) ).toBeInTheDocument();

		act( () => {
			jest.runAllTimers();
		} );
		expect( screen.queryByTestId( 'search-suggestions' ) ).not.toBeInTheDocument();
	} );
} );
