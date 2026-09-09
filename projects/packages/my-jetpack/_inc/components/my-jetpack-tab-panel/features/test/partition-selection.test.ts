/**
 * @jest-environment node
 */
import { partitionSelection } from '../partition-selection';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureState } from '../feature-state';
import type { BulkTarget } from '../partition-selection';

const productTarget = ( slug: string, action: FeatureState[ 'action' ] ): BulkTarget => ( {
	kind: 'feature',
	slug,
	state: {
		feature: { slug, product: slug, module: '' } as MainFeature,
		action,
		status: action === 'running' ? 'active' : 'inactive',
		product: {} as FeatureState[ 'product' ],
		selectable: action === 'install' || action === 'activate' || action === 'running',
	},
} );

const moduleFeatureTarget = (
	slug: string,
	moduleSlug: string,
	activated: boolean
): BulkTarget => ( {
	kind: 'feature',
	slug,
	state: {
		feature: { slug, product: '', module: moduleSlug } as MainFeature,
		action: activated ? 'running' : 'activate',
		status: activated ? 'active' : 'inactive',
		module: { module: moduleSlug, activated } as FeatureState[ 'module' ],
		selectable: true,
	},
} );

const moduleTarget = ( slug: string, activated: boolean, selectable = true ): BulkTarget => ( {
	kind: 'module',
	slug,
	module: { module: slug, activated, available: selectable, override: false } as MyJetpackModule,
} );

describe( 'partitionSelection', () => {
	it( 'routes each selected product to the call that matches its state', () => {
		const targets = [
			productTarget( 'boost', 'install' ),
			productTarget( 'social', 'activate' ),
			productTarget( 'stats', 'running' ),
		];

		expect( partitionSelection( targets, [ 'boost', 'social', 'stats' ] ) ).toEqual( {
			toInstall: [ 'boost' ],
			toActivate: [ 'social' ],
			toDeactivate: [ 'stats' ],
			modulesOn: [],
			modulesOff: [],
		} );
	} );

	it( 'selects features and standalone modules together', () => {
		const targets = [
			productTarget( 'stats', 'running' ),
			moduleTarget( 'carousel', false ),
			moduleTarget( 'markdown', true ),
		];

		const result = partitionSelection( targets, [ 'stats', 'carousel', 'markdown' ] );

		expect( result.toDeactivate ).toEqual( [ 'stats' ] );
		expect( result.modulesOn ).toEqual( [ 'carousel' ] );
		expect( result.modulesOff ).toEqual( [ 'markdown' ] );
	} );

	it( 'dispatches a module-backed feature by its module slug, not its own', () => {
		// Podcast's feature slug and module slug coincide; a feature whose do not would
		// otherwise be dispatched under a name the modules store does not know.
		const targets = [ moduleFeatureTarget( 'newsletter', 'subscriptions', false ) ];

		expect( partitionSelection( targets, [ 'newsletter' ] ).modulesOn ).toEqual( [
			'subscriptions',
		] );
	} );

	it( 'ignores targets that were not selected', () => {
		const targets = [ productTarget( 'boost', 'install' ), productTarget( 'crm', 'install' ) ];

		expect( partitionSelection( targets, [ 'boost' ] ).toInstall ).toEqual( [ 'boost' ] );
	} );

	it( 'drops a selected target that has become unselectable', () => {
		// A module pinned by a filter reports activated, so only the selectable flag keeps
		// it out of the deactivate call.
		const targets = [ moduleTarget( 'blaze', true, false ) ];

		expect( partitionSelection( targets, [ 'blaze' ] ).modulesOff ).toEqual( [] );
	} );

	it( 'excludes a paid feature that offers only Learn more', () => {
		const targets = [ productTarget( 'backup', 'learn_more' ) ];

		expect( partitionSelection( targets, [ 'backup' ] ) ).toEqual( {
			toInstall: [],
			toActivate: [],
			toDeactivate: [],
			modulesOn: [],
			modulesOff: [],
		} );
	} );
} );
