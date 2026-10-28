import { useStatsEmailClicksBreakdown } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { usePostSections } from './use-post-sections';
import type { PostSummary } from './use-post-summary';

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

/**
 * The section states the hook answers for a summary.
 *
 * @param summary    - The summary.
 * @param activeSlug - The section the URL names.
 * @return The section states.
 */
function sectionsFor( summary: PostSummary = SUMMARY, activeSlug?: string ) {
	return renderHook( () =>
		usePostSections( summary, SECTIONS, { entityId: POST_ID, activeSlug, timeZone: 'UTC' } )
	).result.current;
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
		const scope = states[ 1 ].scope as { reportParams: Record< string, unknown > };
		expect( scope.reportParams ).toMatchObject( { post_id: POST_ID, interval: 'day' } );
		expect( String( scope.reportParams.from ) ).toMatch( /^2026-06-22/ );
		expect( String( scope.reportParams.to ) ).toMatch( /^2026-07-21/ );
	} );

	it.each( [ 'page', 'jetpack-portfolio' ] )(
		'hides the email sections for a %s, which is never sent as a newsletter',
		type => {
			const states = sectionsFor( { ...SUMMARY, type } );

			expect( states.map( state => state.hidden ?? false ) ).toEqual( [ false, true, true ] );
			expect( mockGate ).toHaveBeenCalledWith( POST_ID, 'rate', { enabled: false } );
		}
	);

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

	it( 'mounts the fixed email layout when the summary failed and the window never comes', () => {
		expect( sectionsFor( { ...SUMMARY, allTimeStart: undefined, isError: true } )[ 1 ].scope ).toBe(
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
