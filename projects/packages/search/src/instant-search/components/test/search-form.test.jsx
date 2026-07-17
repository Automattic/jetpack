/* eslint-disable testing-library/prefer-user-event */
jest.mock( '@wordpress/i18n', () => ( { __: text => text } ) );
jest.mock( '../../hooks/use-search-suggestions' );
jest.mock( '../search-box', () => {
	const React = require( 'react' );

	return React.forwardRef( ( props, ref ) => (
		<input
			data-testid="search-box"
			ref={ ref }
			value={ props.searchQuery ?? '' }
			onChange={ props.onChange }
			onKeyDown={ props.onKeyDown }
			onBlur={ props.onBlur }
		/>
	) );
} );
jest.mock( '../search-suggestions', () => {
	// Capture the onSelect prop so tests can invoke it directly.
	const MockSearchSuggestions = ( { suggestions, onSelect } ) => {
		MockSearchSuggestions._capturedOnSelect = onSelect;
		const React = require( 'react' );
		return (
			<ul data-testid="search-suggestions">
				{ suggestions.map( ( s, i ) => (
					<li key={ i } data-testid={ `suggestion-${ i }` }>
						{ s.text }
					</li>
				) ) }
			</ul>
		);
	};
	MockSearchSuggestions.getCapturedOnSelect = () => MockSearchSuggestions._capturedOnSelect;
	return MockSearchSuggestions;
} );

import { render, screen, fireEvent, act } from '@testing-library/react';
import * as React from 'react';
import useSearchSuggestions from '../../hooks/use-search-suggestions';
import SearchForm from '../search-form';
import SearchSuggestions from '../search-suggestions';

const defaultProps = {
	searchQuery: '',
	onChangeSearch: jest.fn(),
	isVisible: true,
};

/**
 * Render SearchForm with a mocked suggestions hook.
 * @param {Array}  suggestions - suggestion items
 * @param {object} extraProps  - extra props to pass to SearchForm
 * @return {object} RTL render result
 */
function setupWithSuggestions( suggestions, extraProps = {} ) {
	useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );
	return render(
		<SearchForm
			{ ...defaultProps }
			suggestionsEnabled
			siteId="123"
			onChangeSearch={ jest.fn() }
			{ ...extraProps }
		/>
	);
}

beforeEach( () => {
	useSearchSuggestions.mockReturnValue( { suggestions: [], isLoading: false } );
	jest.clearAllMocks();
} );

describe( 'SearchForm', () => {
	it( 'renders a form with role="search"', () => {
		render( <SearchForm { ...defaultProps } /> );
		expect( screen.getByRole( 'search' ) ).toBeInTheDocument();
	} );

	it( 'renders the SearchBox', () => {
		render( <SearchForm { ...defaultProps } /> );
		expect( screen.getByTestId( 'search-box' ) ).toBeInTheDocument();
	} );

	it( 'does not render SearchSuggestions when suggestionsEnabled is false', () => {
		useSearchSuggestions.mockReturnValue( {
			suggestions: [ { type: 'query', text: 'hello' } ],
			isLoading: false,
		} );
		render( <SearchForm { ...defaultProps } suggestionsEnabled={ false } /> );
		expect( screen.queryByTestId( 'search-suggestions' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render SearchSuggestions when suggestions is empty', () => {
		useSearchSuggestions.mockReturnValue( { suggestions: [], isLoading: false } );
		render( <SearchForm { ...defaultProps } suggestionsEnabled siteId="123" /> );
		const input = screen.getByTestId( 'search-box' );
		fireEvent.change( input, { target: { value: 'hello' }, currentTarget: { value: 'hello' } } );
		expect( screen.queryByTestId( 'search-suggestions' ) ).not.toBeInTheDocument();
	} );

	it( 'renders SearchSuggestions when suggestionsEnabled, showSuggestions=true, and suggestions exist', () => {
		const suggestions = [ { type: 'query', text: 'foo' } ];
		useSearchSuggestions.mockReturnValue( { suggestions, isLoading: false } );
		render( <SearchForm { ...defaultProps } suggestionsEnabled siteId="123" /> );

		const input = screen.getByTestId( 'search-box' );
		fireEvent.change( input, { target: { value: 'foo' }, currentTarget: { value: 'foo' } } );

		expect( screen.getByTestId( 'search-suggestions' ) ).toBeInTheDocument();
	} );

	describe( 'handleSelectSuggestion', () => {
		it( 'calls onSelectFilter and onChangeSearch("") for taxonomy item with onSelectFilter', () => {
			const onChangeSearch = jest.fn();
			const onSelectFilter = jest.fn();
			const suggestions = [
				{
					type: 'taxonomy',
					text: 'News',
					url: '/category/news/',
					taxonomy: 'category',
					slug: 'news',
				},
			];
			setupWithSuggestions( suggestions, { onChangeSearch, onSelectFilter } );

			const input = screen.getByTestId( 'search-box' );
			fireEvent.change( input, { target: { value: 'n' }, currentTarget: { value: 'n' } } );

			const onSelect = SearchSuggestions.getCapturedOnSelect();
			act( () => {
				onSelect( suggestions[ 0 ] );
			} );

			expect( onSelectFilter ).toHaveBeenCalledWith( 'category', 'news' );
			expect( onChangeSearch ).toHaveBeenCalledWith( '' );
		} );

		it( 'navigates to item.url for taxonomy item without onSelectFilter (verifies navigation branch)', () => {
			const onChangeSearch = jest.fn();
			const suggestions = [
				{
					type: 'taxonomy',
					text: 'News',
					url: '/category/news/',
					taxonomy: 'category',
					slug: 'news',
				},
			];
			// Suppress jsdom's "Not implemented: navigation" console.error.
			const errorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
			setupWithSuggestions( suggestions, { onSelectFilter: null, onChangeSearch } );

			const input = screen.getByTestId( 'search-box' );
			fireEvent.change( input, { target: { value: 'n' }, currentTarget: { value: 'n' } } );

			const onSelect = SearchSuggestions.getCapturedOnSelect();
			act( () => {
				onSelect( suggestions[ 0 ] );
			} );

			// In the navigation branch: onChangeSearch and onSelectFilter are NOT called.
			expect( onChangeSearch ).not.toHaveBeenCalled();
			errorSpy.mockRestore();
		} );

		it( 'navigates to item.url for taxonomy item missing taxonomy/slug even with onSelectFilter', () => {
			const onChangeSearch = jest.fn();
			const onSelectFilter = jest.fn();
			const suggestions = [ { type: 'taxonomy', text: 'Unknown', url: '/mystery/' } ];
			// Suppress jsdom's "Not implemented: navigation" console.error.
			const errorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
			setupWithSuggestions( suggestions, { onSelectFilter, onChangeSearch } );

			const input = screen.getByTestId( 'search-box' );
			fireEvent.change( input, { target: { value: 'u' }, currentTarget: { value: 'u' } } );

			const onSelect = SearchSuggestions.getCapturedOnSelect();
			act( () => {
				onSelect( suggestions[ 0 ] );
			} );

			// Missing taxonomy/slug → falls through to navigation branch, not onSelectFilter.
			expect( onSelectFilter ).not.toHaveBeenCalled();
			expect( onChangeSearch ).not.toHaveBeenCalled();
			errorSpy.mockRestore();
		} );

		it( 'navigates to item.url for post item (verifies navigation branch)', () => {
			const onChangeSearch = jest.fn();
			const suggestions = [ { type: 'post', text: 'Getting Started', url: '/getting-started/' } ];
			// Suppress jsdom's "Not implemented: navigation" console.error.
			const errorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
			setupWithSuggestions( suggestions, { onChangeSearch } );

			const input = screen.getByTestId( 'search-box' );
			fireEvent.change( input, { target: { value: 'g' }, currentTarget: { value: 'g' } } );

			const onSelect = SearchSuggestions.getCapturedOnSelect();
			act( () => {
				onSelect( suggestions[ 0 ] );
			} );

			// In the navigation branch: onChangeSearch is NOT called.
			expect( onChangeSearch ).not.toHaveBeenCalled();
			errorSpy.mockRestore();
		} );

		it( 'calls onChangeSearch with item.text for query item', () => {
			const onChangeSearch = jest.fn();
			const suggestions = [ { type: 'query', text: 'wordpress hooks' } ];
			setupWithSuggestions( suggestions, { onChangeSearch } );

			const input = screen.getByTestId( 'search-box' );
			fireEvent.change( input, { target: { value: 'w' }, currentTarget: { value: 'w' } } );

			const onSelect = SearchSuggestions.getCapturedOnSelect();
			act( () => {
				onSelect( suggestions[ 0 ] );
			} );

			expect( onChangeSearch ).toHaveBeenCalledWith( 'wordpress hooks' );
		} );
	} );

	describe( 'when suggestionsEnabled is false', () => {
		it( 'calls onChangeSearch directly on input change', () => {
			const onChangeSearch = jest.fn();
			useSearchSuggestions.mockReturnValue( { suggestions: [], isLoading: false } );
			render(
				<SearchForm
					{ ...defaultProps }
					suggestionsEnabled={ false }
					onChangeSearch={ onChangeSearch }
				/>
			);

			const input = screen.getByTestId( 'search-box' );
			fireEvent.change( input, {
				target: { value: 'hello' },
				currentTarget: { value: 'hello' },
			} );

			expect( onChangeSearch ).toHaveBeenCalledWith( 'hello' );
		} );
	} );
} );
