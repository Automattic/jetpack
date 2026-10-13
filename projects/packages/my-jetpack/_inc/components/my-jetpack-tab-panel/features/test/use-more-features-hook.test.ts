import { renderHook } from '@testing-library/react';
import { useAllJetpackModules } from '../use-all-jetpack-modules';
import { useMoreFeatures } from '../use-more-features';
import type { MyJetpackModule } from '../../../../types';

jest.mock( '../use-all-jetpack-modules', () => ( {
	useAllJetpackModules: jest.fn(),
} ) );
jest.mock( '../../../../data/requested-switch-state', () => ( {
	...jest.requireActual( '../../../../data/requested-switch-state' ),
	useRequestedSwitches: () => ( {} ),
} ) );

const googleFonts = ( activated: boolean ) => ( {
	'google-fonts': {
		module: 'google-fonts',
		name: 'Google Fonts',
		available: true,
		activated,
	} as MyJetpackModule,
} );

const state = {
	jetpack: 'active',
	features: [],
	module_groups: [ { label: 'Design', modules: [ 'google-fonts' ] } ],
} as MainFeaturesState;

const labels = ( groups: ReturnType< typeof useMoreFeatures > ) => groups.map( g => g.label );

describe( 'useMoreFeatures', () => {
	it( 'keeps a deprecated module switched off after load until the page reloads', () => {
		const mocked = jest.mocked( useAllJetpackModules );
		mocked.mockReturnValue( { modules: {}, isLoading: false } as never );
		const { result, rerender } = renderHook( () => useMoreFeatures( state ) );

		mocked.mockReturnValue( { modules: googleFonts( true ), isLoading: false } as never );
		rerender();
		expect( labels( result.current ) ).toEqual( [ 'Design' ] );

		mocked.mockReturnValue( { modules: googleFonts( false ), isLoading: false } as never );
		rerender();
		expect( labels( result.current ) ).toEqual( [ 'Design' ] );
	} );
} );
