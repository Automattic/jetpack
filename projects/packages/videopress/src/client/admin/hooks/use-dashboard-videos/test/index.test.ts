import { renderHook } from '@testing-library/react';
import { useDashboardVideos } from '../index';

const mockUseVideos = jest.fn();
const mockUseLocalVideos = jest.fn();
const mockUseSearchParams = jest.fn();
const mockUsePlan = jest.fn();
const mockUseDispatch = jest.fn();

jest.mock( '../../use-videos', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUseVideos( ...args ),
	useLocalVideos: ( ...args: unknown[] ) => mockUseLocalVideos( ...args ),
} ) );

jest.mock( '../../use-search-params', () => ( {
	useSearchParams: ( ...args: unknown[] ) => mockUseSearchParams( ...args ),
} ) );

jest.mock( '../../use-plan', () => ( {
	usePlan: ( ...args: unknown[] ) => mockUsePlan( ...args ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: ( ...args: unknown[] ) => mockUseDispatch( ...args ),
	useSelect: jest.fn(),
	dispatch: jest.fn(),
	combineReducers: ( reducers: unknown ) => reducers,
	register: jest.fn(),
	createReduxStore: jest.fn(),
} ) );

jest.mock( '../../../../state', () => ( {
	STORE_ID: 'videopress/media',
} ) );

const baseVideosState = {
	items: [],
	uploading: [],
	uploadErrors: [],
	uploadedVideoCount: 30,
	isFetching: false,
	search: '',
	page: 1,
	itemsPerPage: 10,
	total: 30,
};

const setupSearchParams = ( pageParam: string | null = '1', qParam: string | null = '' ) => {
	const setParam = jest.fn();
	const update = jest.fn();
	const deleteParam = jest.fn();
	const getParam = jest.fn( ( name: string, defaultValue: string | null = null ): string | null => {
		if ( name === 'page' ) {
			return pageParam ?? defaultValue;
		}
		if ( name === 'q' ) {
			return qParam ?? defaultValue;
		}
		return defaultValue;
	} );
	mockUseSearchParams.mockReturnValue( { getParam, setParam, update, deleteParam } );
	return { getParam, setParam, update, deleteParam };
};

beforeEach( () => {
	jest.clearAllMocks();

	mockUseLocalVideos.mockReturnValue( { items: [], uploadedLocalVideoCount: 0 } );
	mockUsePlan.mockReturnValue( { hasVideoPressPurchase: true } );
	mockUseDispatch.mockReturnValue( {
		uploadVideo: jest.fn(),
		uploadVideoFromLibrary: jest.fn(),
		setVideosQuery: jest.fn(),
	} );
	mockUseVideos.mockReturnValue( baseVideosState );
	setupSearchParams( '1', '' );
} );

describe( 'useDashboardVideos', () => {
	it( 'effect does not oscillate when store and URL page disagree', () => {
		const setVideosQuery = jest.fn();
		mockUseDispatch.mockReturnValue( {
			uploadVideo: jest.fn(),
			uploadVideoFromLibrary: jest.fn(),
			setVideosQuery,
		} );
		const { setParam, update, deleteParam } = setupSearchParams( '1', '' );
		// store says page 2, URL says page 1 — the two-branch sync logic
		mockUseVideos.mockReturnValue( {
			...baseVideosState,
			page: 2,
		} );

		const { rerender } = renderHook( () => useDashboardVideos() );
		rerender();
		rerender();
		rerender();

		// With Bug 1, the effect alternates between setParam('page', 2)+update()
		// and setVideosQuery({ page: 1 }) on every rerender as tempPage.current
		// flips. After the fix, the effect stabilises to a single dispatch.
		const totalEffectCalls =
			setVideosQuery.mock.calls.length +
			setParam.mock.calls.length +
			update.mock.calls.length +
			deleteParam.mock.calls.length;
		expect( totalEffectCalls ).toBeLessThanOrEqual( 2 );
	} );

	it( 'resets URL page when total is 0 and URL is past page 1', () => {
		mockUseVideos.mockReturnValue( {
			...baseVideosState,
			total: 0,
			uploadedVideoCount: 0,
			page: 1,
		} );
		const { deleteParam, update, setParam } = setupSearchParams( '3', '' );

		renderHook( () => useDashboardVideos() );

		expect( deleteParam ).toHaveBeenCalledWith( 'page' );
		expect( update ).toHaveBeenCalledTimes( 1 );
		expect( setParam ).not.toHaveBeenCalled();
	} );

	it( 'pushes store page to URL after store-side page change', () => {
		mockUseVideos.mockReturnValue( { ...baseVideosState, page: 1 } );
		const { setParam, update } = setupSearchParams( '1', '' );

		const { rerender } = renderHook( () => useDashboardVideos() );

		// Simulate the store dispatching a new page (e.g. via setPage handler).
		mockUseVideos.mockReturnValue( { ...baseVideosState, page: 3 } );
		rerender();

		expect( setParam ).toHaveBeenCalledWith( 'page', '3' );
		expect( update ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'treats a non-numeric URL ?page= as page 1 instead of dispatching NaN', () => {
		const setVideosQuery = jest.fn();
		mockUseDispatch.mockReturnValue( {
			uploadVideo: jest.fn(),
			uploadVideoFromLibrary: jest.fn(),
			setVideosQuery,
		} );
		mockUseVideos.mockReturnValue( { ...baseVideosState, page: 1 } );
		const { deleteParam, update } = setupSearchParams( 'foo', '' );

		renderHook( () => useDashboardVideos() );

		expect( setVideosQuery ).not.toHaveBeenCalledWith( expect.objectContaining( { page: NaN } ) );
		// total > 0 and the parsed page falls back to 1, which is in range, so
		// no URL reset and no store dispatch happen for this benign input.
		expect( deleteParam ).not.toHaveBeenCalled();
		expect( update ).not.toHaveBeenCalled();
		expect( setVideosQuery ).not.toHaveBeenCalled();
	} );

	it( 'placeholder IDs are stable across re-renders while fetching', () => {
		mockUseVideos.mockReturnValue( {
			...baseVideosState,
			isFetching: true,
			page: 2,
		} );
		setupSearchParams( '2', '' );

		const { result, rerender } = renderHook( () => useDashboardVideos() );
		const firstIds = result.current.videos.map( ( v: { id: unknown } ) => v.id );

		rerender();
		const secondIds = result.current.videos.map( ( v: { id: unknown } ) => v.id );

		expect( firstIds.length ).toBeGreaterThan( 0 );
		expect( secondIds ).toEqual( firstIds );
	} );
} );
