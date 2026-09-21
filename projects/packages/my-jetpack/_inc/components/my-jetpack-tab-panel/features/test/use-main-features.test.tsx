import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import {
	clearRequestedSwitch,
	pluginSwitchKey,
	setRequestedSwitch,
} from '../../../../data/requested-switch-state';
import { useFeatureStates } from '../feature-state';
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
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: jest.fn() } ),
	useSelect: () => undefined,
	createReduxStore: jest.fn(),
	register: jest.fn(),
	select: jest.fn(),
	dispatch: jest.fn(),
} ) );

jest.mock( '../../products/use-all-jetpack-modules', () => ( {
	useAllJetpackModules: () => ( { modules: {}, isLoading: false } ),
} ) );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: {} } ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const buildFeature = ( slug: string, plugin: string ) =>
	( {
		slug,
		name: slug,
		plugin,
		plugin_status: 'active',
		in_jetpack: false,
		product: '',
		module: '',
	} ) as MainFeature;

const akismet = buildFeature( 'anti-spam', 'akismet' );
const boost = buildFeature( 'boost', 'jetpack-boost' );

const pageState = { jetpack: 'active', features: [ akismet, boost ] } as MainFeaturesState;

// What the site reports once Akismet alone has been switched off. Boost reads as active
// here, which is the whole difficulty: this response knows nothing of Boost's own click.
const akismetOff = {
	jetpack: 'active',
	features: [ { ...akismet, plugin_status: 'inactive' }, boost ],
} as MainFeaturesState;

const wrapper = ( client: QueryClient ) =>
	function Wrapper( { children }: { children: ReactNode } ) {
		return <QueryClientProvider client={ client }>{ children }</QueryClientProvider>;
	};

const renderTab = () => {
	const client = new QueryClient( { defaultOptions: { mutations: { retry: false } } } );

	return renderHook(
		() => {
			const { states } = useFeatureStates( useMainFeatures() );

			return {
				status: ( slug: string ) => states.find( item => item.feature.slug === slug )?.status,
				akismet: useFeaturePlugin( 'akismet', 'Akismet' ),
				boost: useFeaturePlugin( 'jetpack-boost', 'Boost' ),
			};
		},
		{ wrapper: wrapper( client ) }
	);
};

beforeEach( () => {
	mockApiFetch.mockReset();
	window.myJetpackInitialState = { mainFeatures: pageState } as Window[ 'myJetpackInitialState' ];
} );

describe( 'useFeaturePlugin', () => {
	it( 'looks busy while another caller, such as a bulk switch, has asked for the plugin', () => {
		mockApiFetch.mockImplementation( () => new Promise( () => undefined ) );

		const { result } = renderTab();

		expect( result.current.akismet.isBusy ).toBe( false );

		let token = 0;
		act( () => {
			token = setRequestedSwitch( pluginSwitchKey( 'akismet' ), false );
		} );

		expect( result.current.akismet.isBusy ).toBe( true );
		expect( result.current.boost.isBusy ).toBe( false );

		act( () => clearRequestedSwitch( pluginSwitchKey( 'akismet' ), token ) );

		expect( result.current.akismet.isBusy ).toBe( false );
	} );

	it( 'shows the asked-for state before the first read of the site has landed', async () => {
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			method === 'POST'
				? new Promise( resolve => setTimeout( () => resolve( akismetOff ), 400 ) )
				: new Promise( () => undefined )
		);

		const { result } = renderTab();

		expect( result.current.status( 'anti-spam' ) ).toBe( 'active' );

		act( () => result.current.akismet.run( 'deactivate' ) );

		// Well before the request settles at 400ms, so this is the asked-for value.
		await waitFor( () => expect( result.current.status( 'anti-spam' ) ).toBe( 'inactive' ), {
			timeout: 250,
		} );
	} );

	it( 'puts the previous state back when the request fails', async () => {
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

		const { result } = renderTab();

		await waitFor( () => expect( result.current.status( 'anti-spam' ) ).toBe( 'active' ) );

		act( () => result.current.akismet.run( 'deactivate' ) );

		await waitFor( () => expect( result.current.status( 'anti-spam' ) ).toBe( 'inactive' ) );
		await waitFor( () => expect( result.current.status( 'anti-spam' ) ).toBe( 'active' ) );
	} );

	it( 'leaves a feature that is still being switched alone when another answers', async () => {
		let settleAkismet: ( state: MainFeaturesState ) => void = () => undefined;

		mockApiFetch.mockImplementation(
			( { method, data }: { method?: string; data?: { plugin: string } } ) => {
				if ( method !== 'POST' ) {
					return Promise.resolve( pageState );
				}

				// Boost's request never answers, so only its asked-for value can hold its
				// state. Left in flight on purpose — the activation queue is shared, so
				// this test runs last.
				return data?.plugin === 'akismet'
					? new Promise( resolve => ( settleAkismet = resolve ) )
					: new Promise( () => undefined );
			}
		);

		const { result } = renderTab();

		await waitFor( () => expect( result.current.status( 'boost' ) ).toBe( 'active' ) );

		act( () => result.current.akismet.run( 'deactivate' ) );
		act( () => result.current.boost.run( 'deactivate' ) );

		await waitFor( () => expect( result.current.status( 'boost' ) ).toBe( 'inactive' ) );

		// Akismet's response reports both features on. Akismet takes that value, which
		// nothing else could have produced, so the response has definitely landed.
		act( () => settleAkismet( pageState ) );

		await waitFor( () => expect( result.current.status( 'anti-spam' ) ).toBe( 'active' ) );

		// Boost's own request has not answered, so the response does not speak for it.
		expect( result.current.status( 'boost' ) ).toBe( 'inactive' );
	} );
} );
