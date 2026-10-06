import { filterLauncherDestinations, getLauncherDestinations } from '../index';
import type { LauncherDestination } from '../index';

const ADMIN = 'https://example.com/wp-admin/';

const feature = ( overrides: Partial< MainFeature > ): MainFeature =>
	( {
		in_jetpack: false,
		plugin: '',
		plugin_name: '',
		plugin_status: 'not-installed',
		plugin_override: '',
		product: '',
		module: '',
		manage_url: '',
		...overrides,
	} ) as MainFeature;

const FEATURES = [
	feature( {
		slug: 'activity-log',
		name: 'Activity Log',
		in_jetpack: true,
		module: 'activity-log',
		manage_url: `${ ADMIN }admin.php?page=jetpack-activity-log`,
	} ),
	feature( {
		slug: 'backup',
		name: 'VaultPress Backup',
		in_jetpack: true,
		product: 'backup',
		plugin: 'jetpack-backup',
		plugin_name: 'Jetpack VaultPress Backup',
		manage_url: 'https://cloud.jetpack.com/backup/example.com',
	} ),
	feature( {
		slug: 'boost',
		name: 'Boost',
		product: 'boost',
		plugin: 'jetpack-boost',
		plugin_name: 'Jetpack Boost',
		plugin_status: 'active',
		manage_url: `${ ADMIN }admin.php?page=jetpack-boost`,
	} ),
	feature( {
		slug: 'podcast',
		name: 'Podcast',
		in_jetpack: true,
		module: 'podcast',
		manage_url: `${ ADMIN }admin.php?page=jetpack-podcast`,
	} ),
	// Switched on, but with nowhere to go.
	feature( { slug: 'jetpack-forms', name: 'Forms', in_jetpack: true, product: 'jetpack-forms' } ),
];

type Site = {
	jetpack: MainFeaturePluginStatus;
	activeModules: string[];
	backup: { status: string; has_paid_plan_for_product: boolean };
};

const setSite = ( { jetpack, activeModules, backup }: Site ) => {
	global.JetpackScriptData = {
		site: { admin_url: ADMIN, host: 'standard' },
		user: { current_user: { capabilities: { manage_options: true } } },
		myJetpack: { productsSection: { slug: 'features', label: 'Features' } },
	} as unknown as typeof global.JetpackScriptData;
	window.myJetpackInitialState = {
		mainFeatures: { jetpack, features: FEATURES },
		header: { activeModules, connectorsUrl: null },
		products: {
			items: {
				backup: backup,
				boost: { status: 'active' },
				'jetpack-forms': { status: 'active' },
			},
		},
		plugins: { 'jetpack/jetpack.php': { Name: 'Jetpack', active: jetpack === 'active' } },
	} as unknown as typeof window.myJetpackInitialState;
};

describe( 'getLauncherDestinations', () => {
	it.each< [ string, Site, string[] ] >( [
		[
			'a Complete site running Jetpack',
			{
				jetpack: 'active',
				activeModules: [ 'activity-log' ],
				backup: { status: 'active', has_paid_plan_for_product: true },
			},
			[ 'activity-log', 'backup', 'boost', 'overview', 'features', 'help', 'jetpack-settings' ],
		],
		[
			'a free site with only Boost',
			{
				jetpack: 'not-installed',
				activeModules: [],
				backup: { status: 'needs_plan', has_paid_plan_for_product: false },
			},
			[ 'boost', 'overview', 'features', 'help' ],
		],
	] )( 'lists active features with a page, then the pages, on %s', ( _, site, ids ) => {
		setSite( site );

		expect( getLauncherDestinations().map( ( { id } ) => id ) ).toEqual( ids );
	} );

	it( 'describes a feature by its page and the names it also goes by', () => {
		setSite( {
			jetpack: 'not-installed',
			activeModules: [],
			backup: { status: 'needs_plan', has_paid_plan_for_product: false },
		} );

		expect( getLauncherDestinations()[ 0 ] ).toEqual( {
			id: 'boost',
			label: 'Boost',
			url: `${ ADMIN }admin.php?page=jetpack-boost`,
			keywords: [ 'boost', 'Jetpack Boost' ],
			type: 'feature',
		} );
	} );
} );

describe( 'filterLauncherDestinations', () => {
	const destinations: LauncherDestination[] = [
		{ id: 'boost', label: 'Boost', url: '', keywords: [ 'Jetpack Boost' ], type: 'feature' },
		{ id: 'help', label: 'Help', url: '', keywords: [ 'support' ], type: 'page' },
	];

	it.each( [
		[ 'everything for a blank query', '  ', [ 'boost', 'help' ] ],
		[ 'labels, ignoring case', 'bOO', [ 'boost' ] ],
		[ 'keywords', 'supp', [ 'help' ] ],
		[ 'nothing when nothing matches', 'backup', [] ],
	] )( 'matches %s', ( _, query, ids ) => {
		expect( filterLauncherDestinations( destinations, query ).map( ( { id } ) => id ) ).toEqual(
			ids
		);
	} );
} );
