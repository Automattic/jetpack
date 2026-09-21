import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { isBulkSwitchable, useBulkFeatureSwitch } from '../use-bulk-feature-switch';
import type { FeatureState } from '../feature-state';
import type { ReactNode } from 'react';

const mockSuccess = jest.fn();
const mockError = jest.fn();
const mockRequestModule = jest.fn();
const mockRequestPlugin = jest.fn();

jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: mockSuccess, createErrorNotice: mockError } ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { updateJetpackModuleStatus: jest.fn(), invalidateResolution: jest.fn() } ),
} ) );

jest.mock( '../../../../data/module-switch', () => ( {
	...jest.requireActual( '../../../../data/module-switch' ),
	requestModuleSwitch: ( ...args: unknown[] ) => mockRequestModule( ...args ),
} ) );

jest.mock( '../use-main-features', () => ( {
	...jest.requireActual( '../use-main-features' ),
	requestPluginSwitch: ( ...args: unknown[] ) => mockRequestPlugin( ...args ),
} ) );

const moduleState = ( slug: string, status: 'active' | 'inactive', overrides = {} ) =>
	( {
		feature: { slug, name: slug },
		status,
		control: {
			kind: 'module',
			module: { module: slug, available: true, activated: status === 'active', ...overrides },
		},
	} ) as FeatureState;

const pluginState = ( slug: string, status: 'active' | 'inactive' ) =>
	( {
		feature: { slug, name: slug, plugin_name: `${ slug } plugin` },
		status,
		control: { kind: 'plugin', plugin: slug },
	} ) as FeatureState;

const renderBulk = () => {
	const client = new QueryClient();

	return renderHook( () => useBulkFeatureSwitch(), {
		wrapper: ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
		),
	} );
};

beforeEach( () => {
	jest.clearAllMocks();
	mockRequestModule.mockResolvedValue( true );
	mockRequestPlugin.mockResolvedValue( {} );
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
	it( 'switches only the features not already in the asked-for state', async () => {
		const { result } = renderBulk();

		await act( () =>
			result.current.run(
				[
					moduleState( 'stats', 'inactive' ),
					moduleState( 'likes', 'active' ),
					pluginState( 'akismet', 'inactive' ),
				],
				true
			)
		);

		expect( mockRequestModule ).toHaveBeenCalledTimes( 1 );
		expect( mockRequestModule ).toHaveBeenCalledWith( expect.anything(), 'stats', true );
		expect( mockRequestPlugin ).toHaveBeenCalledWith( expect.anything(), 'akismet', 'activate' );
		expect( mockSuccess ).toHaveBeenCalledWith( '2 features activated.' );
		expect( mockError ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when every feature is already in the asked-for state', async () => {
		const { result } = renderBulk();

		await act( () => result.current.run( [ moduleState( 'stats', 'inactive' ) ], false ) );

		expect( mockRequestModule ).not.toHaveBeenCalled();
		expect( mockSuccess ).not.toHaveBeenCalled();
	} );

	it( 'reports what succeeded, and each failure with the reason the site gave', async () => {
		mockRequestModule.mockResolvedValue( false );
		mockRequestPlugin.mockImplementation( ( _client, plugin: string ) =>
			plugin === 'akismet'
				? Promise.reject( new Error( 'This plugin runs the page you are on.' ) )
				: Promise.resolve( {} )
		);

		const { result } = renderBulk();

		await act( () =>
			result.current.run(
				[
					moduleState( 'stats', 'active' ),
					pluginState( 'akismet', 'active' ),
					pluginState( 'jetpack-boost', 'active' ),
				],
				false
			)
		);

		expect( mockSuccess ).toHaveBeenCalledWith( '1 feature deactivated.' );
		expect( mockError ).toHaveBeenCalledWith( 'Could not change stats. Please try again.' );
		expect( mockError ).toHaveBeenCalledWith( 'This plugin runs the page you are on.' );
		expect( mockError ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'is running until every request has settled', async () => {
		let settle: ( value: boolean ) => void = () => undefined;
		mockRequestModule.mockReturnValue( new Promise( resolve => ( settle = resolve ) ) );

		const { result } = renderBulk();

		let run: Promise< void > = Promise.resolve();
		act( () => {
			run = result.current.run( [ moduleState( 'stats', 'inactive' ) ], true );
		} );

		expect( result.current.isRunning ).toBe( true );

		await act( async () => {
			settle( true );
			await run;
		} );

		expect( result.current.isRunning ).toBe( false );
	} );
} );
