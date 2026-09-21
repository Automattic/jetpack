import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useRequestedSwitches } from '../../../../data/requested-switch-state';
import { isBulkSwitchable, useBulkFeatureSwitch } from '../use-bulk-feature-switch';
import type { FeatureState } from '../feature-state';
import type { ReactNode } from 'react';

const mockSuccess = jest.fn();
const mockError = jest.fn();
const mockFetchModules = jest.fn();

jest.mock( '@wordpress/api-fetch' );

jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: mockSuccess, createErrorNotice: mockError } ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { fetchModules: mockFetchModules } ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const moduleState = ( slug: string, status: 'active' | 'inactive', overrides = {} ) =>
	( {
		feature: { slug, name: `${ slug } feature` },
		status,
		control: {
			kind: 'module',
			module: { module: slug, available: true, activated: status === 'active', ...overrides },
		},
	} ) as FeatureState;

const pluginState = ( slug: string, status: 'active' | 'inactive' ) =>
	( {
		feature: { slug, name: `${ slug } feature` },
		status,
		control: { kind: 'plugin', plugin: slug },
	} ) as FeatureState;

const renderBulk = () => {
	const client = new QueryClient();

	return renderHook(
		() => ( { bulk: useBulkFeatureSwitch(), requested: useRequestedSwitches() } ),
		{
			wrapper: ( { children }: { children: ReactNode } ) => (
				<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
			),
		}
	);
};

const settled = ( failed: unknown[] = [] ) => Promise.resolve( { state: {}, failed } );

beforeEach( () => {
	jest.clearAllMocks();
	mockApiFetch.mockImplementation( () => settled() );
	mockFetchModules.mockResolvedValue( true );
} );

describe( 'isBulkSwitchable', () => {
	it.each( [
		[ 'a module with a plain switch', moduleState( 'stats', 'inactive' ), true ],
		[ 'a plugin switch', pluginState( 'akismet', 'active' ), true ],
		[ 'a forced module', moduleState( 'stats', 'active', { override: 'active' } ), false ],
		[
			'a feature still loading',
			{ ...moduleState( 'stats', 'inactive' ), pending: true } as FeatureState,
			false,
		],
		[
			'a feature already switching',
			{ ...pluginState( 'akismet', 'active' ), isSwitching: true } as FeatureState,
			false,
		],
		[
			'a plugin that needs installing',
			{ ...pluginState( 'akismet', 'inactive' ), control: { kind: 'install-plugin', plugin: 'a' } },
			false,
		],
		[
			'a feature with no control',
			{ ...pluginState( 'akismet', 'inactive' ), control: { kind: 'none' } },
			false,
		],
	] as [ string, FeatureState, boolean ][] )( '%s', ( _label, state, expected ) => {
		expect( isBulkSwitchable( state ) ).toBe( expected );
	} );
} );

describe( 'useBulkFeatureSwitch', () => {
	it( 'switches everything in one request, leaving out what is already in the asked-for state', async () => {
		const { result } = renderBulk();

		await act( () =>
			result.current.bulk.run(
				[
					moduleState( 'stats', 'inactive' ),
					moduleState( 'likes', 'active' ),
					pluginState( 'akismet', 'inactive' ),
				],
				true
			)
		);

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/my-jetpack/site/features/bulk',
			method: 'POST',
			data: { active: true, modules: [ 'stats' ], plugins: [ 'akismet' ] },
		} );
		expect( mockSuccess ).toHaveBeenCalledWith( '2 features activated.' );
		expect( mockError ).not.toHaveBeenCalled();
	} );

	it( 'holds every row at the asked-for value until the batch and the modules have landed', async () => {
		let answer: ( value: unknown ) => void = () => undefined;
		let refreshed: ( value: boolean ) => void = () => undefined;
		mockApiFetch.mockImplementation( () => new Promise( resolve => ( answer = resolve ) ) );
		mockFetchModules.mockImplementation( () => new Promise( resolve => ( refreshed = resolve ) ) );

		const { result } = renderBulk();

		let run: Promise< void > = Promise.resolve();
		act( () => {
			run = result.current.bulk.run(
				[ moduleState( 'stats', 'active' ), pluginState( 'akismet', 'active' ) ],
				false
			);
		} );

		const bothHeld = { 'module:stats': false, 'plugin:akismet': false };

		expect( result.current.requested ).toEqual( bothHeld );
		expect( result.current.bulk.isRunning ).toBe( true );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		await act( async () => answer( { state: {}, failed: [] } ) );

		// The response is in, but the modules store has not caught up yet.
		expect( result.current.requested ).toEqual( bothHeld );

		await act( async () => {
			refreshed( true );
			await run;
		} );

		expect( result.current.requested ).toEqual( {} );
		expect( result.current.bulk.isRunning ).toBe( false );
	} );

	it( 'names each feature the site could not switch, with the reason it gave', async () => {
		mockApiFetch.mockImplementation( () =>
			settled( [ { type: 'plugin', slug: 'akismet', message: 'This plugin runs the page.' } ] )
		);

		const { result } = renderBulk();

		await act( () =>
			result.current.bulk.run(
				[ moduleState( 'stats', 'active' ), pluginState( 'akismet', 'active' ) ],
				false
			)
		);

		expect( mockSuccess ).toHaveBeenCalledWith( '1 feature deactivated.' );
		expect( mockError ).toHaveBeenCalledWith( 'akismet feature: This plugin runs the page.' );
	} );

	it( 'gives features held back for the same reason one notice between them', async () => {
		const reason = 'Plugins can only be deactivated together while the Jetpack plugin is active.';
		mockApiFetch.mockImplementation( () =>
			settled( [
				{ type: 'plugin', slug: 'akismet', message: reason },
				{ type: 'plugin', slug: 'boost', message: reason },
			] )
		);

		const { result } = renderBulk();

		await act( () =>
			result.current.bulk.run(
				[ pluginState( 'akismet', 'active' ), pluginState( 'boost', 'active' ) ],
				false
			)
		);

		expect( mockError ).toHaveBeenCalledTimes( 1 );
		expect( mockError ).toHaveBeenCalledWith( `akismet feature, boost feature: ${ reason }` );
		expect( mockSuccess ).not.toHaveBeenCalled();
	} );

	it( 'reports a request that fails outright, and lets go of every row', async () => {
		mockApiFetch.mockImplementation( () => Promise.reject( new Error( 'Server error.' ) ) );

		const { result } = renderBulk();

		await act( () => result.current.bulk.run( [ moduleState( 'stats', 'inactive' ) ], true ) );

		expect( mockError ).toHaveBeenCalledWith( 'Server error.' );
		expect( mockSuccess ).not.toHaveBeenCalled();
		expect( result.current.requested ).toEqual( {} );
	} );

	it( 'does nothing when every feature is already in the asked-for state', async () => {
		const { result } = renderBulk();

		await act( () => result.current.bulk.run( [ moduleState( 'stats', 'inactive' ) ], false ) );

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( mockSuccess ).not.toHaveBeenCalled();
	} );
} );
