/**
 * @jest-environment node
 */
import { partitionSelection } from '../partition-selection';
import type { FeatureState } from '../feature-state';

const productFeature = ( slug: string, action: FeatureState[ 'action' ] ): FeatureState =>
	( {
		feature: { slug, product: slug, module: '' } as MainFeature,
		action,
		status: action === 'running' ? 'active' : 'inactive',
		product: {} as FeatureState[ 'product' ],
		switchable: true,
	} ) as FeatureState;

const moduleFeature = ( slug: string, moduleSlug: string, activated: boolean ): FeatureState =>
	( {
		feature: { slug, product: '', module: moduleSlug } as MainFeature,
		action: activated ? 'running' : 'activate',
		status: activated ? 'active' : 'inactive',
		module: { module: moduleSlug, activated } as FeatureState[ 'module' ],
		switchable: true,
	} ) as FeatureState;

describe( 'partitionSelection', () => {
	it( 'routes each selected product to the call that matches its state', () => {
		const states = [
			productFeature( 'boost', 'install' ),
			productFeature( 'social', 'activate' ),
			productFeature( 'stats', 'running' ),
		];

		expect( partitionSelection( states, [ 'boost', 'social', 'stats' ] ) ).toEqual( {
			toInstall: [ 'boost' ],
			toActivate: [ 'social' ],
			toDeactivate: [ 'stats' ],
			modulesOn: [],
			modulesOff: [],
		} );
	} );

	it( 'sends a module-backed feature by its module slug, on the side it is not already on', () => {
		const states = [
			moduleFeature( 'sharing', 'sharedaddy', false ),
			moduleFeature( 'comments', 'comments', true ),
		];

		expect( partitionSelection( states, [ 'sharing', 'comments' ] ) ).toEqual( {
			toInstall: [],
			toActivate: [],
			toDeactivate: [],
			modulesOn: [ 'sharedaddy' ],
			modulesOff: [ 'comments' ],
		} );
	} );

	it( 'ignores anything selected that is not switchable', () => {
		const paid = { ...productFeature( 'ai', 'learn_more' ), switchable: false } as FeatureState;
		const states = [ paid, productFeature( 'social', 'activate' ) ];

		expect( partitionSelection( states, [ 'ai', 'social' ] ) ).toEqual( {
			toInstall: [],
			toActivate: [ 'social' ],
			toDeactivate: [],
			modulesOn: [],
			modulesOff: [],
		} );
	} );

	it( 'ignores anything switchable that is not selected', () => {
		const states = [ productFeature( 'social', 'activate' ), productFeature( 'stats', 'running' ) ];

		expect( partitionSelection( states, [ 'social' ] ) ).toEqual( {
			toInstall: [],
			toActivate: [ 'social' ],
			toDeactivate: [],
			modulesOn: [],
			modulesOff: [],
		} );
	} );
} );
