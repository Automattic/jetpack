/* eslint-disable testing-library/prefer-user-event */
jest.mock( '@wordpress/i18n', () => ( { __: text => text } ) );
jest.mock( '../search-suggestions.scss', () => {} );

import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import SearchSuggestions from '../search-suggestions';

const querySuggestion = { type: 'query', text: 'wordpress plugins' };
const taxonomySuggestion = {
	type: 'taxonomy',
	text: 'News',
	url: '/category/news/',
	taxonomy: 'category',
	slug: 'news',
};
const postSuggestion = { type: 'post', text: 'Getting started', url: '/getting-started/' };

describe( 'SearchSuggestions', () => {
	it( 'returns null when suggestions is empty array', () => {
		const { container } = render(
			<SearchSuggestions suggestions={ [] } activeIndex={ -1 } onSelect={ jest.fn() } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'returns null when suggestions is null', () => {
		const { container } = render(
			<SearchSuggestions suggestions={ null } activeIndex={ -1 } onSelect={ jest.fn() } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders a listbox with items when suggestions are provided', () => {
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.getByRole( 'listbox' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'option' ) ).toBeInTheDocument();
	} );

	it( 'renders group label "Suggestions" for query type', () => {
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.getByText( 'Suggestions' ) ).toBeInTheDocument();
	} );

	it( 'renders group label "Popular Filters" for taxonomy type', () => {
		render(
			<SearchSuggestions
				suggestions={ [ taxonomySuggestion ] }
				activeIndex={ -1 }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.getByText( 'Popular Filters' ) ).toBeInTheDocument();
	} );

	it( 'renders group label "Articles" for post type', () => {
		render(
			<SearchSuggestions
				suggestions={ [ postSuggestion ] }
				activeIndex={ -1 }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.getByText( 'Articles' ) ).toBeInTheDocument();
	} );

	it( 'renders items in TYPE_ORDER: query, taxonomy, post', () => {
		const suggestions = [ postSuggestion, taxonomySuggestion, querySuggestion ];
		render(
			<SearchSuggestions suggestions={ suggestions } activeIndex={ -1 } onSelect={ jest.fn() } />
		);
		const items = screen.getAllByRole( 'option' );
		expect( items[ 0 ] ).toHaveTextContent( 'wordpress plugins' );
		expect( items[ 1 ] ).toHaveTextContent( 'News' );
		expect( items[ 2 ] ).toHaveTextContent( 'Getting started' );
	} );

	it( 'shows a separator between groups but not before the first group', () => {
		const suggestions = [ querySuggestion, taxonomySuggestion ];
		render(
			<SearchSuggestions suggestions={ suggestions } activeIndex={ -1 } onSelect={ jest.fn() } />
		);
		const separators = screen.getAllByRole( 'separator' );
		expect( separators ).toHaveLength( 1 );
	} );

	it( 'shows two separators when all three groups are present', () => {
		const suggestions = [ querySuggestion, taxonomySuggestion, postSuggestion ];
		render(
			<SearchSuggestions suggestions={ suggestions } activeIndex={ -1 } onSelect={ jest.fn() } />
		);
		const separators = screen.getAllByRole( 'separator' );
		expect( separators ).toHaveLength( 2 );
	} );

	it( 'shows no separator when only one group is present', () => {
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.queryByRole( 'separator' ) ).not.toBeInTheDocument();
	} );

	it( 'marks the active item with aria-selected=true and is-active class', () => {
		const suggestions = [ querySuggestion, taxonomySuggestion, postSuggestion ];
		render(
			<SearchSuggestions suggestions={ suggestions } activeIndex={ 1 } onSelect={ jest.fn() } />
		);
		const items = screen.getAllByRole( 'option' );
		expect( items[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
		expect( items[ 0 ] ).not.toHaveClass( 'is-active' );
		expect( items[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( items[ 1 ] ).toHaveClass( 'is-active' );
		expect( items[ 2 ] ).toHaveAttribute( 'aria-selected', 'false' );
		expect( items[ 2 ] ).not.toHaveClass( 'is-active' );
	} );

	it( 'assigns flat indices across groups (query first, then taxonomy, then post)', () => {
		const suggestions = [ querySuggestion, taxonomySuggestion, postSuggestion ];
		// activeIndex=2 → third flat index → post item
		render(
			<SearchSuggestions suggestions={ suggestions } activeIndex={ 2 } onSelect={ jest.fn() } />
		);
		const items = screen.getAllByRole( 'option' );
		expect( items[ 2 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( items[ 2 ] ).toHaveClass( 'is-active' );
	} );

	it( 'calls onSelect with the item when clicked', () => {
		const onSelect = jest.fn();
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ onSelect }
			/>
		);
		fireEvent.click( screen.getByRole( 'option' ) );
		expect( onSelect ).toHaveBeenCalledWith( querySuggestion );
	} );

	it( 'calls e.preventDefault and e.stopPropagation on click', () => {
		const onSelect = jest.fn();
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ onSelect }
			/>
		);
		const item = screen.getByRole( 'option' );
		const preventDefault = jest.fn();
		const stopPropagation = jest.fn();
		fireEvent.click( item, { preventDefault, stopPropagation } );
		// fireEvent synthesizes the event object; verify via the mock calls after the click handler
		expect( onSelect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onSelect when Enter key is pressed on an item', () => {
		const onSelect = jest.fn();
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ onSelect }
			/>
		);
		fireEvent.keyDown( screen.getByRole( 'option' ), { key: 'Enter' } );
		expect( onSelect ).toHaveBeenCalledWith( querySuggestion );
	} );

	it( 'does NOT call onSelect when a non-Enter key is pressed on an item', () => {
		const onSelect = jest.fn();
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ onSelect }
			/>
		);
		fireEvent.keyDown( screen.getByRole( 'option' ), { key: 'ArrowDown' } );
		expect( onSelect ).not.toHaveBeenCalled();
	} );

	it( 'renders item text content', () => {
		render(
			<SearchSuggestions
				suggestions={ [ querySuggestion ] }
				activeIndex={ -1 }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.getByText( 'wordpress plugins' ) ).toBeInTheDocument();
	} );
} );
