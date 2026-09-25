import { renderHook } from '@testing-library/react';
import {
	getScopedStorageKey,
	hasEstablishedLibrary,
	hasPublishedVideo,
	hasSeenOnboarding,
	markEstablishedLibrary,
	markFirstPublish,
	resolveFirstRunState,
	saveDismissal,
	useFirstRunState,
	useObserveFirstRunSignals,
	useSettledFirstRunState,
} from '../use-first-run-state';
import { useLibrary } from '../use-library';
import { useOnboardingCounts } from '../use-onboarding-counts';

jest.mock( '../use-library', () => ( {
	useLibrary: jest.fn(),
	LIBRARY_QUERY_KEY: 'library',
} ) );

// The observer reads the per-type counts through this hook; mocked separately so
// a case can put the whole-library count and the VideoPress one at different
// values, which is the whole reason the two flags exist.
jest.mock( '../use-onboarding-counts', () => ( {
	useOnboardingCounts: jest.fn(),
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

	// Third question, third key: "has a library at all" is not "has published",
	// and a site full of local video attachments answers them differently.
	it( 'keeps the library flag on its own key', () => {
		expect( hasEstablishedLibrary() ).toBe( false );

		markEstablishedLibrary();

		expect( hasEstablishedLibrary() ).toBe( true );
		expect( window.localStorage.getItem( 'jetpack-videopress-library-seen-123-7' ) ).toBe( '1' );
		expect( hasPublishedVideo() ).toBe( false );
	} );
} );

describe( 'useFirstRunState', () => {
	beforeEach( () => {
		window.localStorage.clear();
		jest.clearAllMocks();
	} );

	// The flash this closes: with nothing written down, EVERY load re-guessed
	// from a count that reads 0 until it lands, so a returning user watched the
	// first-run shape paint and correct itself a few hundred milliseconds later
	// — on every single arrival, for as long as they used the product.
	it( 'answers home from a remembered library before the count comes back', () => {
		markEstablishedLibrary();
		mockLibraryCount( { totalItems: 0, isLoading: true } );

		const { result } = renderHook( () => useFirstRunState() );

		expect( result.current ).toBe( 'home' );
	} );

	// The property the optimism exists for, and the reason the fix is a
	// remembered answer rather than an inverted default: a brand-new user has
	// nothing written down, and must not watch the returning-user shell go past.
	it( 'still reads a loading count as first-run when nothing is remembered', () => {
		mockLibraryCount( { totalItems: 0, isLoading: true } );

		const { result } = renderHook( () => useFirstRunState() );

		expect( result.current ).toBe( 'first-run' );
	} );

	// Reading is not observing: the flags are written from one place, mounted by
	// every route (see `useObserveFirstRunSignals`), and this hook is rendered by
	// the tab strip, which several routes never mount.
	it( 'writes nothing of its own', () => {
		mockLibraryCount( { totalItems: 3, isLoading: false } );

		renderHook( () => useFirstRunState() );

		expect( hasEstablishedLibrary() ).toBe( false );
	} );

	// The flag outlives the library it describes, exactly as the publish flag
	// does: emptying a library is not a second first run.
	it( 'keeps home once a remembered library has been emptied', () => {
		markEstablishedLibrary();
		mockLibraryCount( { totalItems: 0, isLoading: false } );

		const { result } = renderHook( () => useFirstRunState() );

		expect( result.current ).toBe( 'home' );
	} );
} );

describe( 'useObserveFirstRunSignals', () => {
	const mockTypeCounts = ( {
		videoPressCount,
		isSettled,
	}: {
		videoPressCount: number;
		isSettled: boolean;
	} ) => {
		( useOnboardingCounts as jest.Mock ).mockReturnValue( {
			videoPressCount,
			localCount: 0,
			isSettled,
		} );
	};

	beforeEach( () => {
		window.localStorage.clear();
		jest.clearAllMocks();
		mockTypeCounts( { videoPressCount: 0, isSettled: true } );
	} );

	it( 'remembers a non-empty library so later loads have something to read', () => {
		mockLibraryCount( { totalItems: 3, isLoading: false } );

		renderHook( () => useObserveFirstRunSignals() );

		expect( hasEstablishedLibrary() ).toBe( true );
	} );

	// The bug this closes: `markFirstPublish` used to be called only where
	// `OnboardingModal` mounts, and the /video/:id route mounts neither it nor
	// any other dashboard chrome. A returning user who opened a video link in a
	// fresh browser was therefore recorded as nobody — and deleting that video
	// handed them the first-run welcome modal.
	it( 'remembers that VideoPress has been used', () => {
		mockLibraryCount( { totalItems: 1, isLoading: false } );
		mockTypeCounts( { videoPressCount: 1, isSettled: true } );

		renderHook( () => useObserveFirstRunSignals() );

		expect( hasPublishedVideo() ).toBe( true );
	} );

	// The two flags answer different questions, so a library of local video
	// attachments proves one and not the other: these people are exactly the
	// audience for the welcome modal's migration pitch.
	it( 'records a library of non-VideoPress videos as a library only', () => {
		mockLibraryCount( { totalItems: 27, isLoading: false } );
		mockTypeCounts( { videoPressCount: 0, isSettled: true } );

		renderHook( () => useObserveFirstRunSignals() );

		expect( hasEstablishedLibrary() ).toBe( true );
		expect( hasPublishedVideo() ).toBe( false );
	} );

	// A settled zero is the one count that proves nothing about the next load.
	it( 'remembers nothing for a settled empty library', () => {
		mockLibraryCount( { totalItems: 0, isLoading: false } );

		renderHook( () => useObserveFirstRunSignals() );

		expect( hasEstablishedLibrary() ).toBe( false );
		expect( hasPublishedVideo() ).toBe( false );
	} );

	// 'loading' means "do not act", not "probably home". An in-flight count reads
	// 0, so writing on it would be writing a guess into storage — where the next
	// load would read it back as an answer.
	it( 'writes nothing from counts that have not settled', () => {
		mockLibraryCount( { totalItems: 0, isLoading: true } );
		mockTypeCounts( { videoPressCount: 0, isSettled: false } );

		renderHook( () => useObserveFirstRunSignals() );

		expect( hasEstablishedLibrary() ).toBe( false );
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
