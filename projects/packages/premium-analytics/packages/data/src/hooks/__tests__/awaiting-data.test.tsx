/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { isAwaitingData } from '../awaiting-data';
import type { ReactNode } from 'react';

// Driven against a real QueryClient, not hand-built flag objects: the point is
// how React Query itself reports a param change versus a revalidation.

type Row = { range: string };

const STALE_TIME = 5 * 60 * 1000;

function Probe( { range, enabled = true }: { range: string; enabled?: boolean } ) {
	const query = useQuery< Row >( {
		queryKey: [ 'report', range ],
		queryFn: async () => {
			await new Promise( resolve => setTimeout( resolve, 10 ) );
			return { range };
		},
		placeholderData: previousData => previousData,
		enabled,
	} );

	refetchProbe = query.refetch;

	const awaiting = isAwaitingData( query );
	renders.push( { awaiting, isPlaceholderData: query.isPlaceholderData } );

	return (
		<>
			<span data-testid="shown">{ query.data?.range ?? '—' }</span>
			<span data-testid="awaiting">{ String( awaiting ) }</span>
			<span data-testid="fetching">{ String( query.isFetching ) }</span>
		</>
	);
}

let refetchProbe: () => Promise< unknown >;

// Every render's verdict, so a test can assert on the frames between two settled
// states and not just on the settled states themselves.
const renders: Array< { awaiting: boolean; isPlaceholderData: boolean } > = [];

function read( testId: string ) {
	return screen.getByTestId( testId ).textContent;
}

describe( 'isAwaitingData', () => {
	let client: QueryClient;
	let setRange: ( range: string ) => void;
	let setState: ( state: { range: string; enabled: boolean } ) => void;

	function Host() {
		const [ range, set ] = useState( 'january' );
		setRange = set;
		return <Probe range={ range } />;
	}

	function SwitchableHost() {
		const [ state, set ] = useState( { range: 'january', enabled: true } );
		setState = set;
		return <Probe range={ state.range } enabled={ state.enabled } />;
	}

	function wrap( children: ReactNode ) {
		return <QueryClientProvider client={ client }>{ children }</QueryClientProvider>;
	}

	/**
	 * Wait for a range's rows to land. Polled, not slept through — a fixed delay
	 * races the query on a loaded runner.
	 *
	 * @param range - The range whose rows should be on screen.
	 */
	async function settleOn( range: string ) {
		await waitFor( () => expect( read( 'shown' ) ).toBe( range ) );
		await waitFor( () => expect( read( 'awaiting' ) ).toBe( 'false' ) );
	}

	beforeEach( () => {
		renders.length = 0;
		client = new QueryClient( {
			defaultOptions: { queries: { staleTime: STALE_TIME, retry: false } },
		} );
	} );

	it( 'is true on a first load, when there is nothing on screen at all', async () => {
		render( wrap( <Host /> ) );

		expect( read( 'shown' ) ).toBe( '—' );
		expect( read( 'awaiting' ) ).toBe( 'true' );

		await settleOn( 'january' );
	} );

	it( 'is true through a range change, while the previous range is still on screen', async () => {
		render( wrap( <Host /> ) );
		await settleOn( 'january' );

		await act( async () => {
			setRange( 'february' );
		} );

		// `placeholderData` keeps January mounted, so React Query calls this a
		// success — but January no longer answers what was asked.
		expect( read( 'shown' ) ).toBe( 'january' );
		expect( read( 'awaiting' ) ).toBe( 'true' );

		await settleOn( 'february' );
	} );

	it( 'stays false through a revalidation of unchanged params (WOOA7S-1934)', async () => {
		render( wrap( <Host /> ) );
		await settleOn( 'january' );

		act( () => {
			client.invalidateQueries( { queryKey: [ 'report', 'january' ] } );
		} );
		await waitFor( () => expect( read( 'fetching' ) ).toBe( 'true' ) );

		// What a window refocus past `staleTime` does. `isFetching` is true here
		// exactly as it is through the range change above; what separates them is
		// that January still answers what was asked, so it is not placeholder data.
		expect( read( 'shown' ) ).toBe( 'january' );
		expect( read( 'awaiting' ) ).toBe( 'false' );

		await settleOn( 'january' );
	} );

	it( 'stays false when a range change lands on an already cached range', async () => {
		render( wrap( <Host /> ) );
		await settleOn( 'january' );
		await act( async () => {
			setRange( 'february' );
		} );
		await settleOn( 'february' );

		await act( async () => {
			client.invalidateQueries();
			setRange( 'january' );
		} );

		// Cached under its own key, so it is served directly rather than as
		// placeholder data — already the right answer.
		expect( read( 'shown' ) ).toBe( 'january' );
		expect( read( 'awaiting' ) ).toBe( 'false' );

		// The invalidation above leaves a refetch in flight; let it land inside
		// the test rather than during teardown.
		await settleOn( 'january' );
	} );

	// The whole flag rests on React Query reporting the new key's fetch on the
	// very first render after the params change. Were there a frame where the
	// placeholder is on screen with nothing yet in flight, the widget would
	// flash the previous range as though it were the answer. React Query's
	// optimistic result covers that frame — asserted here because the flag is
	// only exact for as long as it does.
	it( 'never calls the placeholder the answer mid-transition', async () => {
		render( wrap( <Host /> ) );
		await settleOn( 'january' );

		renders.length = 0;
		await act( async () => {
			setRange( 'february' );
		} );
		await settleOn( 'february' );

		expect( renders.some( frame => frame.isPlaceholderData ) ).toBe( true );
		expect( renders.filter( frame => frame.isPlaceholderData && ! frame.awaiting ) ).toEqual( [] );
	} );

	// The stuck-skeleton bug: a widget that switches a query off (a metric the
	// current bucket cannot serve, a view that is no longer selected) changes
	// that query's params in the same render. `placeholderData` fills it from
	// the previous params and React Query calls it placeholder — but nothing
	// will ever fetch to replace it, so treating that as "awaiting" pins the
	// widget in its skeleton forever.
	it( 'stays false for a disabled query left holding placeholder data', async () => {
		render( wrap( <SwitchableHost /> ) );
		await waitFor( () => expect( read( 'shown' ) ).toBe( 'january' ) );

		await act( async () => {
			setState( { range: 'february', enabled: false } );
		} );

		expect( read( 'fetching' ) ).toBe( 'false' );
		expect( read( 'awaiting' ) ).toBe( 'false' );
	} );

	// `refetch()` deliberately ignores `enabled`, so a switched-off query can
	// still have a real request in flight — and a query that is fetching is
	// awaiting however it was configured. Reading `enabled` instead would report
	// "not awaiting" over a genuine load and leave the widget showing its empty
	// state until the request landed.
	it( 'is true while a switched-off query is refetching by hand', async () => {
		render( wrap( <Probe range="january" enabled={ false } /> ) );

		expect( read( 'awaiting' ) ).toBe( 'false' );

		let inFlight: Promise< unknown >;
		act( () => {
			inFlight = refetchProbe();
		} );

		await waitFor( () => expect( read( 'fetching' ) ).toBe( 'true' ) );
		expect( read( 'awaiting' ) ).toBe( 'true' );

		await act( async () => {
			await inFlight;
		} );
	} );
} );
