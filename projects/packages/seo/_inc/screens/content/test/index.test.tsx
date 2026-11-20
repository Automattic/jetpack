import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import type { View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
// DataViews is stubbed to capture the props the screen hands it, so we can assert
// the initial view/fields without rendering the (heavy) real grid.
let capturedView: View | undefined;
let capturedFields: Array< { id: string; render?: ( props: { item: object } ) => ReactNode } > = [];

const navigate = jest.fn();
const useSearch = jest.fn< () => { needs?: string } >();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
	useSearch,
} ) );

jest.unstable_mockModule( '../../../data/use-seo-posts', () => ( {
	default: () => ( {
		items: [],
		isLoading: false,
		postTypeOptions: [ { value: 'post', label: 'Posts' } ],
	} ),
} ) );

jest.unstable_mockModule( '@wordpress/dataviews', () => ( {
	DataViews: ( props: { view: View; fields: typeof capturedFields } ) => {
		capturedView = props.view;
		capturedFields = props.fields;
		return null;
	},
	filterSortAndPaginate: () => ( {
		data: [],
		paginationInfo: { totalItems: 0, totalPages: 0 },
	} ),
} ) );

const { default: ContentScreen } = await import( '../index' );

describe( 'ContentScreen — ?needs= deep-link seeding', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		capturedView = undefined;
		capturedFields = [];
	} );

	it( 'seeds the SEO-title filter from ?needs=title', () => {
		useSearch.mockReturnValue( { needs: 'title' } );

		render( <ContentScreen /> );

		expect( capturedView?.filters ).toEqual( [
			{ field: 'titleFilter', operator: 'is', value: 'not_set' },
		] );
	} );

	it( 'seeds the schema filter from ?needs=schema', () => {
		useSearch.mockReturnValue( { needs: 'schema' } );

		render( <ContentScreen /> );

		expect( capturedView?.filters ).toEqual( [
			{ field: 'schemaType', operator: 'is', value: 'default' },
		] );
	} );

	it( 'seeds the meta-description filter from ?needs=description', () => {
		useSearch.mockReturnValue( { needs: 'description' } );

		render( <ContentScreen /> );

		expect( capturedView?.filters ).toEqual( [
			{ field: 'description', operator: 'is', value: 'not_set' },
		] );
	} );

	it( 'seeds the search-visibility filter from ?needs=search', () => {
		useSearch.mockReturnValue( { needs: 'search' } );

		render( <ContentScreen /> );

		expect( capturedView?.filters ).toEqual( [
			{ field: 'searchFilter', operator: 'is', value: 'hidden' },
		] );
	} );

	it( 'starts unfiltered when there is no ?needs= param', () => {
		useSearch.mockReturnValue( {} );

		render( <ContentScreen /> );

		expect( capturedView?.filters ).toEqual( [] );
	} );

	it( 'exposes a filter-only field for SEO-title set/not-set', () => {
		useSearch.mockReturnValue( {} );

		render( <ContentScreen /> );

		expect( capturedFields.some( field => field.id === 'titleFilter' ) ).toBe( true );
	} );

	it( 'opens the editor from a post-specific button without dropping the current filter', () => {
		useSearch.mockReturnValue( { needs: 'title' } );
		render( <ContentScreen /> );
		const editAction = capturedFields.find( field => field.id === 'editAction' );
		render( <>{ editAction?.render?.( { item: { id: 5, type: 'page', title: 'Hello' } } ) }</> );

		// eslint-disable-next-line testing-library/prefer-user-event -- No user-event devDep for one click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Edit SEO for Hello' } ) );

		expect( navigate ).toHaveBeenCalledWith( {
			to: '/content',
			search: { needs: 'title', postId: 5, postType: 'page' },
		} );
	} );
} );
