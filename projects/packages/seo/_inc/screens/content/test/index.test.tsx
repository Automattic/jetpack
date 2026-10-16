import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import type { View } from '@wordpress/dataviews';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
// DataViews is stubbed to capture the props the screen hands it, so we can assert
// the initial view/fields without rendering the (heavy) real grid.
let capturedView: View | undefined;
let capturedFields: Array< { id: string } > = [];

const useSearch = jest.fn< () => { needs?: string } >();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
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
	DataViews: ( props: { view: View; fields: Array< { id: string } > } ) => {
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
} );
