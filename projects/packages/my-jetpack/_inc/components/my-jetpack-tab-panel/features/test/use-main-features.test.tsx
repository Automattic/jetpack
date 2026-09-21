import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useFeaturePlugin, useMainFeatures } from '../use-main-features';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: jest.fn() } ),
	useSelect: () => undefined,
	createReduxStore: jest.fn(),
	register: jest.fn(),
	select: jest.fn(),
	dispatch: jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const feature = {
	slug: 'anti-spam',
	name: 'Akismet Anti-spam',
	plugin: 'akismet',
	plugin_status: 'active',
} as MainFeature;

const pageState = { jetpack: 'active', features: [ feature ] } as MainFeaturesState;

const switchedOff = {
	jetpack: 'active',
	features: [ { ...feature, plugin_status: 'inactive' } ],
} as MainFeaturesState;

const wrapper = ( client: QueryClient ) =>
	function Wrapper( { children }: { children: ReactNode } ) {
		return <QueryClientProvider client={ client }>{ children }</QueryClientProvider>;
	};

const renderBoth = () => {
	const client = new QueryClient( { defaultOptions: { mutations: { retry: false } } } );

	return renderHook(
		() => ( {
			state: useMainFeatures(),
			plugin: useFeaturePlugin( 'akismet', 'Akismet Anti-spam' ),
		} ),
		{ wrapper: wrapper( client ) }
	);
};

beforeEach( () => {
	mockApiFetch.mockReset();
	window.myJetpackInitialState = { mainFeatures: pageState } as Window[ 'myJetpackInitialState' ];
} );

describe( 'useFeaturePlugin', () => {
	it( 'shows the asked-for state before the first read of the site has landed', async () => {
		// The GET never settles, so the only state on hand is the page's own copy. The
		// POST still has to settle: the activation queue is shared, and a request left in
		// flight here would block the next test's.
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			method === 'POST'
				? // Late enough that only the optimistic write can satisfy the assertion,
					// soon enough that the shared queue is clear for the next test.
					new Promise( resolve => setTimeout( () => resolve( switchedOff ), 400 ) )
				: new Promise( () => undefined )
		);

		const { result } = renderBoth();

		expect( result.current.state.features[ 0 ].plugin_status ).toBe( 'active' );

		act( () => result.current.plugin.run( 'deactivate' ) );

		// Well before the request settles at 400ms, so this is the optimistic write.
		await waitFor(
			() => expect( result.current.state.features[ 0 ].plugin_status ).toBe( 'inactive' ),
			{ timeout: 250 }
		);
	} );

	it( 'puts the previous state back when the request fails', async () => {
		// One read to warm the cache; the re-read that follows the failure never settles,
		// so only putting the old value back can restore it.
		let reads = 0;
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) => {
			if ( method === 'POST' ) {
				// Not immediate, so the asked-for state is observable before it is undone.
				return new Promise( ( _resolve, reject ) =>
					setTimeout( () => reject( new Error( 'nope' ) ), 60 )
				);
			}

			reads += 1;
			return reads === 1 ? Promise.resolve( pageState ) : new Promise( () => undefined );
		} );

		const { result } = renderBoth();

		await waitFor( () =>
			expect( result.current.state.features[ 0 ].plugin_status ).toBe( 'active' )
		);

		act( () => result.current.plugin.run( 'deactivate' ) );

		await waitFor( () =>
			expect( result.current.state.features[ 0 ].plugin_status ).toBe( 'inactive' )
		);

		await waitFor( () =>
			expect( result.current.state.features[ 0 ].plugin_status ).toBe( 'active' )
		);
	} );
} );
