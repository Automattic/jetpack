/**
 * External dependencies
 */
import { useMediaThumbnail } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { useEntitySummary } from './use-entity-summary';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	decodeHtmlText: jest.requireActual( '../../../../packages/data/src/utils/text' ).decodeHtmlText,
	getApiErrorStatus: jest.requireActual( '../../../../packages/data/src/utils/api-error' )
		.getApiErrorStatus,
	useMediaThumbnail: jest.fn(),
} ) );

// The core store is only ever passed straight back into the stubbed `select`.
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

const mockUseMediaThumbnail = jest.mocked( useMediaThumbnail );
const mockUseSelect = jest.mocked( useSelect );
const mockUseDispatch = jest.mocked( useDispatch );
const mockGetEntityRecord = jest.fn();
const mockInvalidateResolution = jest.fn();

const PAGE = { entity: { kind: 'postType', name: 'page' } };
const RECORD_ARGS = [ 'postType', 'page', 42, { context: 'view' } ];

type Resolution = {
	record?: unknown;
	hasResolved?: boolean;
	error?: unknown;
};

/**
 * Drive `useSelect` with one record and its resolution state.
 *
 * @param resolution             - What core-data answers.
 * @param resolution.record      - The entity record, if any.
 * @param resolution.hasResolved - Whether the read settled.
 * @param resolution.error       - What the read failed with, if it did.
 */
function mockResolution( { record, hasResolved = true, error = null }: Resolution ) {
	mockGetEntityRecord.mockReturnValue( record );
	mockUseSelect.mockImplementation( ( mapSelect: unknown ) =>
		( mapSelect as ( select: unknown ) => unknown )( () => ( {
			getEntityRecord: mockGetEntityRecord,
			hasFinishedResolution: () => hasResolved,
			getResolutionError: () => error,
		} ) )
	);
}

describe( 'useEntitySummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseDispatch.mockReturnValue( {
			invalidateResolution: mockInvalidateResolution,
		} as never );
		mockUseMediaThumbnail.mockReturnValue( undefined );
	} );

	it( 'reads the record in the view context and summarizes it by the convention', () => {
		mockResolution( {
			record: {
				title: { rendered: 'Caf&eacute; &amp; bar' },
				featured_media: 87,
				date: '2025-08-19T10:00:00',
				link: 'https://example.com/cafe/',
			},
		} );
		mockUseMediaThumbnail.mockReturnValue( 'https://example.com/thumb.jpg' );

		const { result } = renderHook( () => useEntitySummary( '42', PAGE ) );

		expect( mockGetEntityRecord ).toHaveBeenCalledWith( ...RECORD_ARGS );
		expect( mockUseMediaThumbnail ).toHaveBeenCalledWith( 87 );
		expect( result.current ).toMatchObject( {
			title: 'Café & bar',
			publishedDate: '2025-08-19T10:00:00',
			allTimeStart: '2025-08-19T10:00:00',
			imageUrl: 'https://example.com/thumb.jpg',
			url: 'https://example.com/cafe/',
			isLoading: false,
			isError: false,
			isNotFound: false,
		} );
	} );

	it( 'takes the name of a record without a title and leaves out what it lacks', () => {
		mockResolution( { record: { name: 'News', link: 'https://example.com/news/' } } );

		const { result } = renderHook( () => useEntitySummary( '42', PAGE ) );

		expect( mockUseMediaThumbnail ).toHaveBeenCalledWith( undefined );
		expect( result.current ).toMatchObject( {
			title: 'News',
			publishedDate: undefined,
			allTimeStart: undefined,
			url: 'https://example.com/news/',
		} );
	} );

	it.each( [
		[ 'waits while the read resolves', { hasResolved: false }, 'isLoading' ],
		[ 'finds no record behind a 404', { error: { data: { status: 404 } } }, 'isNotFound' ],
		// A raw `Response`, as core-data rejects with.
		[
			'presents a record the reader may not read as missing',
			{ error: { status: 403 } },
			'isNotFound',
		],
		[ 'finds no record for an entity core-data does not know', {}, 'isNotFound' ],
		[ 'fails on any other error', { error: { data: { status: 500 } } }, 'isError' ],
	] )( '%s', ( _name, resolution, flag ) => {
		mockResolution( resolution );

		const { result } = renderHook( () => useEntitySummary( '42', PAGE ) );

		expect( {
			isLoading: result.current.isLoading,
			isNotFound: result.current.isNotFound,
			isError: result.current.isError,
		} ).toEqual( { isLoading: false, isNotFound: false, isError: false, [ flag ]: true } );
		expect( result.current.error ).toBe(
			flag === 'isError' ? ( resolution as Resolution ).error : null
		);
	} );

	it( 'retries by invalidating the read', () => {
		mockResolution( { error: { data: { status: 500 } } } );

		const { result } = renderHook( () => useEntitySummary( '42', PAGE ) );
		result.current.refetch();

		expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEntityRecord', RECORD_ARGS );
	} );
} );
