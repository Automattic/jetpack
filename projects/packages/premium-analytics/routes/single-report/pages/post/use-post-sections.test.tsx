import { useStatsEmailClicksBreakdown } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { usePostSections } from './use-post-sections';
import type { PostSummary } from './use-post-summary';
import type { SectionScopeControl } from '../adapter';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsEmailClicksBreakdown: jest.fn(),
} ) );

const mockGate = jest.mocked( useStatsEmailClicksBreakdown );

const POST_ID = 91;

const SECTIONS = [
	{ slug: 'post-traffic', label: 'Post traffic', default_layout: [], controls: null },
	{ slug: 'email-opens', label: 'Email opens', default_layout: [], controls: [] },
	{ slug: 'email-clicks', label: 'Email clicks', default_layout: [], controls: [] },
];

const SUMMARY: PostSummary = {
	title: 'Hello',
	type: 'post',
	publishedDate: '2026-06-22 00:00:00',
	allTimeStart: '2026-06-22 00:00:00',
	isLoading: false,
	isError: false,
	error: null,
	isNotFound: false,
	refetch: () => {},
};

/**
 * Mocks the clicks rate summary that gates the email sections.
 *
 * @param totalSends - The sends the gate reports; undefined leaves it unanswered.
 * @param state      - Where an unanswered gate sits.
 */
function mockSends( totalSends?: number, state: 'loading' | 'error' = 'loading' ) {
	const answered = totalSends !== undefined;
	mockGate.mockReturnValue( {
		data: answered ? { summary: { total_sends: totalSends } } : undefined,
		isLoading: ! answered && state === 'loading',
		isSuccess: answered,
		isError: ! answered && state === 'error',
	} as never );
}

const setSearch = jest.fn();

/**
 * The section states the hook answers for a summary.
 *
 * @param summary    - The summary.
 * @param activeSlug - The section the URL names.
 * @param search     - The URL's other search params.
 * @return The section states.
 */
function sectionsFor(
	summary: PostSummary = SUMMARY,
	activeSlug?: string,
	search: Record< string, unknown > = {}
) {
	return renderHook( () =>
		usePostSections( summary, SECTIONS, {
			entityId: String( POST_ID ),
			activeSlug,
			timeZone: 'UTC',
			search,
			setSearch,
		} )
	).result.current;
}

/**
 * The pinned window and its control, as an email section carries them.
 *
 * @param state       - The section state.
 * @param state.scope - Its scope, pinned.
 * @return The scope.
 */
function pinnedScope( state: { scope?: unknown } ) {
	return state.scope as { reportParams: Record< string, unknown >; control?: SectionScopeControl };
}

describe( 'usePostSections', () => {
	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( new Date( '2026-08-28T10:00:00Z' ) );
		jest.clearAllMocks();
		mockSends( 3 );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'pins the email sections to the 30 days after the send for a sent post', () => {
		const states = sectionsFor();

		expect( states.map( state => state.hidden ?? false ) ).toEqual( [ false, false, false ] );
		expect( states[ 0 ].scope ).toBeUndefined();
		const scope = pinnedScope( states[ 1 ] );
		expect( scope.reportParams ).toMatchObject( { post_id: POST_ID, interval: 'day' } );
		expect( String( scope.reportParams.from ) ).toMatch( /^2026-06-22/ );
		expect( String( scope.reportParams.to ) ).toMatch( /^2026-07-21/ );
		expect( scope.control ).toMatchObject( {
			field: { id: 'email_window', type: 'jpa/select' },
			value: 'first-30-days',
		} );
		expect( scope.control?.field.elements?.map( element => element.value ) ).toEqual( [
			'send-day',
			'first-week',
			'first-30-days',
			'all-time',
		] );
	} );

	it( 'names the all-time window by its cap for a send older than it reaches', () => {
		const old = { ...SUMMARY, allTimeStart: '2023-06-15 00:00:00' };
		const labelOf = ( summary: PostSummary ) =>
			pinnedScope( sectionsFor( summary )[ 1 ] ).control?.field.elements?.at( -1 )?.label;

		expect( labelOf( SUMMARY ) ).toBe( 'All time, by month' );
		expect( labelOf( old ) ).toBe( 'First 30 months' );
	} );

	it( 'pins the window the URL names, and falls back to the default for one it does not know', () => {
		const sendDay = pinnedScope(
			sectionsFor( SUMMARY, 'email-opens', { email_window: 'send-day' } )[ 1 ]
		);
		expect( sendDay.reportParams ).toMatchObject( { interval: 'hour' } );
		expect( String( sendDay.reportParams.to ) ).toMatch( /^2026-06-22/ );
		expect( sendDay.control?.value ).toBe( 'send-day' );

		const unknown = pinnedScope(
			sectionsFor( SUMMARY, 'email-opens', { email_window: 'first-24-hours' } )[ 1 ]
		);
		expect( unknown.reportParams ).toMatchObject( { interval: 'day' } );
		expect( unknown.control?.value ).toBe( 'first-30-days' );
	} );

	it( 'writes a chosen window to the URL, and ignores the current one or an unknown one', () => {
		const { control } = pinnedScope( sectionsFor()[ 1 ] );

		control?.onChange( 'all-time' );
		expect( setSearch ).toHaveBeenCalledWith( { email_window: 'all-time' } );

		setSearch.mockClear();
		control?.onChange( 'first-30-days' );
		control?.onChange( 'yesterday' );
		expect( setSearch ).not.toHaveBeenCalled();
	} );

	it.each( [ 'page', 'jetpack-portfolio' ] )(
		'hides the email sections for a %s, which is never sent as a newsletter',
		type => {
			const states = sectionsFor( { ...SUMMARY, type } );

			expect( states.map( state => state.hidden ?? false ) ).toEqual( [ false, true, true ] );
			expect( mockGate ).toHaveBeenCalledWith( POST_ID, 'rate', { enabled: false } );
		}
	);

	it.each( [
		[ 'page', 'Page traffic' ],
		[ 'product', 'Product traffic' ],
	] )( 'names the traffic section for a %s', ( type, label ) => {
		expect( sectionsFor( { ...SUMMARY, type } )[ 0 ] ).toEqual( { section: SECTIONS[ 0 ], label } );
	} );

	it( 'stands in a placeholder for the traffic label until the type loads', () => {
		expect( sectionsFor( { ...SUMMARY, type: undefined, isLoading: true } )[ 0 ] ).toMatchObject( {
			label: 'Post traffic',
			isPending: true,
		} );
		expect( sectionsFor()[ 0 ] ).toEqual( { section: SECTIONS[ 0 ], label: 'Post traffic' } );
	} );

	it( 'keeps a deep-linked email section while the type is unknown, and hides it otherwise', () => {
		expect( sectionsFor( { ...SUMMARY, type: undefined }, 'email-opens' )[ 1 ].hidden ).toBe(
			false
		);
		expect( sectionsFor( { ...SUMMARY, type: undefined }, 'post-traffic' )[ 1 ].hidden ).toBe(
			true
		);
	} );

	it( 'replaces an email section with the never-sent state once the gate answers with no activity', () => {
		mockSends( 0 );

		const states = sectionsFor();

		expect( states[ 1 ].emptyState?.title ).toBe( 'This post hasn’t been sent as a newsletter' );
		expect( states[ 0 ].emptyState ).toBeUndefined();
	} );

	it( 'does not flag a post as never sent until its type is known', () => {
		mockSends( 0 );

		expect(
			sectionsFor( { ...SUMMARY, type: undefined }, 'email-opens' )[ 1 ].emptyState
		).toBeUndefined();
	} );

	it( 'holds an email section while the send check or the publish day is pending', () => {
		mockSends( undefined );
		expect( sectionsFor()[ 1 ].scope ).toBe( 'pending' );

		mockSends( 3 );
		expect(
			sectionsFor( { ...SUMMARY, allTimeStart: undefined, isLoading: true } )[ 1 ].scope
		).toBe( 'pending' );
	} );

	it.each( [
		[ 'failed to load', { isError: true } ],
		[ 'was not found', { isNotFound: true } ],
	] )( 'stops holding an email section for a post that %s', ( _case, state ) => {
		expect( sectionsFor( { ...SUMMARY, allTimeStart: undefined, ...state } )[ 1 ].scope ).toBe(
			'blocked'
		);
	} );

	it( 'keeps the email sections for a legacy send with unrecorded sends', () => {
		mockGate.mockReturnValue( {
			data: { summary: { total_sends: 0, total_opens: 120, total_clicks: 5 } },
			isLoading: false,
			isSuccess: true,
			isError: false,
		} as never );

		expect( sectionsFor()[ 1 ].emptyState ).toBeUndefined();
	} );
} );
