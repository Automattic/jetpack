import { renderHook } from '@testing-library/react';
import {
	getScopedStorageKey,
	hasPublishedVideo,
	hasSeenOnboarding,
	markFirstPublish,
	resolveFirstRunState,
	saveDismissal,
	useSettledFirstRunState,
} from '../use-first-run-state';
import { useLibrary } from '../use-library';

jest.mock( '../use-library', () => ( {
	useLibrary: jest.fn(),
	LIBRARY_QUERY_KEY: 'library',
} ) );

// The library count is the only input that varies across these cases; the rest
// of `useLibrary`'s surface is unused by the first-run hooks.
const mockLibraryCount = ( {
	totalItems,
	isLoading,
}: {
	totalItems: number;
	isLoading: boolean;
} ) => {
	( useLibrary as jest.Mock ).mockReturnValue( {
		items: [],
		isLoading,
		isError: false,
		paginationInfo: { totalItems, totalPages: 1 },
	} );
};

// The module reads site/user identity to scope its storage keys; `useFreeTier`
// (pulled in by the hook) also reaches for `isWoASite`.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { id: 7 } },
	} ),
	isWoASite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => false ),
} ) );

describe( 'resolveFirstRunState', () => {
	// The rule in one line: first run is *only* a cold flag over an empty
	// library. Any other combination is the returning-user dashboard.
	it( 'is first-run for a cold flag over an empty library', () => {
		expect( resolveFirstRunState( { hasPublished: false, videoCount: 0 } ) ).toBe( 'first-run' );
	} );

	// The important one: a cleared localStorage, a new browser, or a site that
	// had videos before this shipped must never drop somebody back into
	// onboarding when they already have a library.
	it( 'is home for a cold flag over a non-empty library', () => {
		expect( resolveFirstRunState( { hasPublished: false, videoCount: 1 } ) ).toBe( 'home' );
		expect( resolveFirstRunState( { hasPublished: false, videoCount: 42 } ) ).toBe( 'home' );
	} );

	// The published flag survives an emptied library, so a user who activated
	// and then deleted everything still gets home rather than a second first run.
	it( 'is home for a published user with an empty library', () => {
		expect( resolveFirstRunState( { hasPublished: true, videoCount: 0 } ) ).toBe( 'home' );
	} );

	it( 'is home for a published user with a non-empty library', () => {
		expect( resolveFirstRunState( { hasPublished: true, videoCount: 3 } ) ).toBe( 'home' );
	} );
} );

describe( 'first-run storage helpers', () => {
	beforeEach( () => {
		window.localStorage.clear();
	} );

	it( 'scopes every key to the current site and user', () => {
		expect( getScopedStorageKey( 'jetpack-videopress-first-publish' ) ).toBe(
			'jetpack-videopress-first-publish-123-7'
		);
	} );

	it( 'reports no published video until markFirstPublish runs', () => {
		expect( hasPublishedVideo() ).toBe( false );

		markFirstPublish();

		expect( hasPublishedVideo() ).toBe( true );
		expect( window.localStorage.getItem( 'jetpack-videopress-first-publish-123-7' ) ).toBe( '1' );
	} );

	// The onboarding modal and the first-run redirect both read this flag, so
	// moving it out of the modal must not change its behaviour.
	it( 'reports the onboarding modal as unseen until it is dismissed', () => {
		expect( hasSeenOnboarding() ).toBe( false );

		saveDismissal();

		expect( hasSeenOnboarding() ).toBe( true );
		expect( window.localStorage.getItem( 'jetpack-videopress-onboarding-seen-123-7' ) ).toBe( '1' );
	} );

	// The two flags answer different questions and must not share a key:
	// dismissing the welcome modal is not an activation.
	it( 'keeps the dismissal and publish flags on separate keys', () => {
		saveDismissal();

		expect( hasSeenOnboarding() ).toBe( true );
		expect( hasPublishedVideo() ).toBe( false );
	} );
} );

describe( 'useSettledFirstRunState', () => {
	beforeEach( () => {
		window.localStorage.clear();
		jest.clearAllMocks();
	} );

	// The regression this exists to prevent. `videoCount` is 0 until the library
	// count comes back, which is byte-identical to an empty library, so a caller
	// that decides early sends every existing user to the empty upload screen.
	it( 'withholds a verdict while the library count is still loading', () => {
		mockLibraryCount( { totalItems: 0, isLoading: true } );

		const { result } = renderHook( () => useSettledFirstRunState() );

		expect( result.current ).toBe( 'loading' );
	} );

	// Same inputs as above, one bit different: now the 0 is real.
	it( 'is first-run once a settled count confirms the library is empty', () => {
		mockLibraryCount( { totalItems: 0, isLoading: false } );

		const { result } = renderHook( () => useSettledFirstRunState() );

		expect( result.current ).toBe( 'first-run' );
	} );

	it( 'is home once a settled count reports videos', () => {
		mockLibraryCount( { totalItems: 40, isLoading: false } );

		const { result } = renderHook( () => useSettledFirstRunState() );

		expect( result.current ).toBe( 'home' );
	} );

	// A loading count must not be rescued by the publish flag either — 'loading'
	// means "do not act", not "probably home".
	it( 'stays loading even when the publish flag is already set', () => {
		markFirstPublish();
		mockLibraryCount( { totalItems: 0, isLoading: true } );

		const { result } = renderHook( () => useSettledFirstRunState() );

		expect( result.current ).toBe( 'loading' );
	} );

	// The regression that shipped past the first fix: first run used to read
	// `useFreeTier().videoCount`, which counts VideoPress-hosted videos only
	// because that is what the upload cap applies to. A site holding 27 local
	// video attachments and no VideoPress ones therefore reported 0, and an
	// established user was greeted as brand new. The count here must be the
	// whole library, whatever each video's type.
	it( 'is home for a library of videos that are not VideoPress-hosted', () => {
		mockLibraryCount( { totalItems: 27, isLoading: false } );

		const { result } = renderHook( () => useSettledFirstRunState() );

		expect( result.current ).toBe( 'home' );
	} );

	it( 'is home for a published user with a settled empty count', () => {
		markFirstPublish();
		mockLibraryCount( { totalItems: 0, isLoading: false } );

		const { result } = renderHook( () => useSettledFirstRunState() );

		expect( result.current ).toBe( 'home' );
	} );
} );
