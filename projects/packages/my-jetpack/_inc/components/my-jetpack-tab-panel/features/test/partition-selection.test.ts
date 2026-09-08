/**
 * @jest-environment node
 */
import { partitionSelection } from '../partition-selection';
import type { FeatureState } from '../feature-state';

const feature = ( slug: string, product = '', $module = '' ) =>
	( { slug, product, module: $module } ) as MainFeature;

const productState = ( slug: string, action: FeatureState[ 'action' ] ): FeatureState => ( {
	feature: feature( slug, slug ),
	action,
	status: action === 'running' ? 'active' : 'inactive',
	product: {} as FeatureState[ 'product' ],
	selectable: action === 'install' || action === 'activate' || action === 'running',
} );

const moduleState = ( slug: string, activated: boolean, selectable = true ): FeatureState => ( {
	feature: feature( slug, '', slug ),
	action: activated ? 'running' : 'activate',
	status: activated ? 'active' : 'inactive',
	module: { activated } as FeatureState[ 'module' ],
	selectable,
} );

describe( 'partitionSelection', () => {
	it( 'routes each selected product to the call that matches its state', () => {
		const states = [
			productState( 'boost', 'install' ),
			productState( 'social', 'activate' ),
			productState( 'stats', 'running' ),
		];

		expect( partitionSelection( states, [ 'boost', 'social', 'stats' ] ) ).toEqual( {
			toInstall: [ 'boost' ],
			toActivate: [ 'social' ],
			toDeactivate: [ 'stats' ],
			modulesOn: [],
			modulesOff: [],
		} );
	} );

	it( 'separates modules from products, and on from off', () => {
		const states = [
			productState( 'stats', 'running' ),
			moduleState( 'blaze', true ),
			moduleState( 'podcast', false ),
		];

		const result = partitionSelection( states, [ 'stats', 'blaze', 'podcast' ] );

		expect( result.modulesOff ).toEqual( [ 'blaze' ] );
		expect( result.modulesOn ).toEqual( [ 'podcast' ] );
		expect( result.toDeactivate ).toEqual( [ 'stats' ] );
	} );

	it( 'ignores features that were not selected', () => {
		const states = [ productState( 'boost', 'install' ), productState( 'crm', 'install' ) ];

		expect( partitionSelection( states, [ 'boost' ] ).toInstall ).toEqual( [ 'boost' ] );
	} );

	it( 'drops a selected feature that has become unselectable', () => {
		// A module pinned on by a filter reports `running`, so only the selectable flag
		// keeps it out of the deactivate call. The selection is held by slug and
		// outlives the state change that unselects it.
		const states = [ moduleState( 'blaze', true, false ) ];

		expect( partitionSelection( states, [ 'blaze' ] ).modulesOff ).toEqual( [] );
	} );

	it( 'excludes a paid feature that offers only Learn more', () => {
		const states = [ productState( 'backup', 'learn_more' ) ];

		expect( partitionSelection( states, [ 'backup' ] ) ).toEqual( {
			toInstall: [],
			toActivate: [],
			toDeactivate: [],
			modulesOn: [],
			modulesOff: [],
		} );
	} );
} );
