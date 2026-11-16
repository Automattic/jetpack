import { renderHook } from '@testing-library/react';
import { useEntitySummary } from './use-entity-summary';

type Resolution = {
	record: Record< string, unknown > | null;
	isResolving: boolean;
	hasResolved: boolean;
	status: string;
};

const mockResolutions = new Map< string, Resolution >();
const mockInvalidateResolution = jest.fn();

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecord: ( kind: string, name: string, id: number, options?: { enabled?: boolean } ) => {
		if ( options?.enabled === false ) {
			return { record: null, isResolving: false, hasResolved: true, status: 'SUCCESS' };
		}
		return (
			mockResolutions.get( `${ kind }/${ name }/${ id }` ) ?? {
				record: null,
				isResolving: false,
				hasResolved: true,
				status: 'SUCCESS',
			}
		);
	},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
	useSelect: (
		map: ( select: ( store: string ) => { getResolutionError: () => undefined } ) => unknown
	) => map( () => ( { getResolutionError: () => undefined } ) ),
} ) );

const pageEntity = { kind: 'postType', name: 'page' };
const pageHeader = { title: 'title', media: 'featured_media', description: 'excerpt' };

describe( 'useEntitySummary', () => {
	beforeEach( () => {
		mockResolutions.clear();
		mockInvalidateResolution.mockClear();
	} );

	it( 'reads the header fields off the core-data record', () => {
		mockResolutions.set( 'postType/page/42', {
			record: {
				title: { rendered: 'About' },
				excerpt: { rendered: '<p>A page.</p>' },
				featured_media: 7,
			},
			isResolving: false,
			hasResolved: true,
			status: 'SUCCESS',
		} );
		mockResolutions.set( 'postType/attachment/7', {
			record: { source_url: 'https://example.com/about.jpg' },
			isResolving: false,
			hasResolved: true,
			status: 'SUCCESS',
		} );

		const { result } = renderHook( () => useEntitySummary( pageEntity, pageHeader, '42' ) );

		expect( result.current.title ).toBe( 'About' );
		expect( result.current.description ).toBe( 'A page.' );
		expect( result.current.imageUrl ).toBe( 'https://example.com/about.jpg' );
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'reads no header text when the record names no header fields', () => {
		mockResolutions.set( 'postType/page/42', {
			record: { title: { rendered: 'About' } },
			isResolving: false,
			hasResolved: true,
			status: 'SUCCESS',
		} );

		const { result } = renderHook( () => useEntitySummary( pageEntity, null, '42' ) );

		expect( result.current.title ).toBeUndefined();
		expect( result.current.imageUrl ).toBeUndefined();
	} );
} );
