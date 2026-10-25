import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import {
	ConnectResume,
	rememberConnectIntent,
	resetConnectIntentForTests,
	useConnectResume,
} from '../connect-resume';
import { FeaturesContent } from '../content';
import { getModuleFeatureState } from '../use-more-features';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureState } from '../feature-state';
import type { MoreFeaturesGroup } from '../use-more-features';

const activeStats = {
	feature: { slug: 'stats', name: 'Stats', description: '', plans: [] },
	status: 'active',
	control: { kind: 'none' },
} as unknown as FeatureState;

const moduleState = ( slug: string, activated: boolean ) =>
	getModuleFeatureState(
		{ module: slug, name: slug, description: '', activated, available: true } as MyJetpackModule,
		{}
	);

let mockStates: FeatureState[] = [ activeStats ];
let mockGroups: MoreFeaturesGroup[] = [];
let mockMainFeatures: Record< string, unknown > = {
	jetpack: 'active',
	features: [ { slug: 'stats' } ],
	isPlaceholderData: false,
};

let mockModules: Record< string, MyJetpackModule > = {};
let mockModulesLoaded = true;
let mockModulesFailed = false;
const mockRecordEvent = jest.fn();
jest.mock( '../use-all-jetpack-modules', () => ( {
	useAllJetpackModules: () => ( {
		modules: mockModules,
		isLoading: false,
		hasLoaded: mockModulesLoaded,
		hasFailed: mockModulesFailed,
	} ),
} ) );

const mockRun = jest.fn();
const mockSetModuleActive = jest.fn();
jest.mock( '../use-main-features', () => ( {
	useMainFeatures: () => mockMainFeatures,
	useFeaturePlugin: ( plugin: string ) => ( {
		run: ( action: string ) => mockRun( plugin, action ),
	} ),
} ) );
jest.mock( '../../../module-toggle', () => ( {
	// Records the reload option too: Activity Log reloads the page after switching unless it is false.
	useModuleActivation: ( $module: MyJetpackModule, options?: { reload?: boolean } ) => ( {
		setModuleActive: ( active: boolean ) => mockSetModuleActive( $module.module, active, options ),
	} ),
} ) );

let mockIsLoading = false;

// The tab mounts its tracking provider, which would otherwise reach the connection and
// analytics packages for a test about which layout renders.
jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

jest.mock( '../feature-state', () => ( {
	...jest.requireActual( '../feature-state' ),
	useFeatureStates: () => ( { states: mockStates, isLoading: mockIsLoading } ),
	useAccountConnected: () => mockConnected,
} ) );
let mockConnected = true;

jest.mock( '../feature-item', () => ( {
	FeatureItem: ( { state }: { state: FeatureState } ) => (
		<div>
			<span>grid card</span>
			<span>{ state.feature.slug }</span>
		</div>
	),
} ) );
jest.mock( '../feature-list', () => ( {
	FeatureList: () => <div>list rows</div>,
	UnswitchableNote: () => null,
} ) );
let mockModalProps: Record< string, unknown > | null = null;
jest.mock( '../feature-modal', () => ( {
	FeatureModal: ( props: Record< string, unknown > ) => {
		mockModalProps = props;
		return null;
	},
} ) );
jest.mock( '../use-more-features', () => ( {
	...jest.requireActual( '../use-more-features' ),
	useMoreFeatures: () => mockGroups,
} ) );
jest.mock( '../features-banner', () => ( { FeaturesBanner: () => null } ) );

const RouteState = () => <output data-testid="route">{ useLocation().search }</output>;

const tree = ( url: string, client: QueryClient ) => (
	<QueryClientProvider client={ client }>
		<MemoryRouter initialEntries={ [ url ] }>
			<RouteState />
			<FeaturesContent />
		</MemoryRouter>
	</QueryClientProvider>
);
const renderAt = ( url: string ) => {
	const client = new QueryClient();
	const view = render( tree( url, client ) );

	return { ...view, rerenderAt: () => view.rerender( tree( url, client ) ) };
};

describe( 'FeaturesContent', () => {
	beforeEach( () => {
		mockModules = {};
		mockModulesLoaded = true;
		mockModulesFailed = false;
		mockRecordEvent.mockClear();
		mockStates = [ activeStats ];
		mockIsLoading = false;
		mockGroups = [];
		mockMainFeatures = {
			jetpack: 'active',
			features: [ { slug: 'stats' } ],
			isPlaceholderData: false,
		};
	} );
	it.each( [ false, true ] )( 'shows a classic escape only on a marked view: %s', marked => {
		const original = window.location.href;
		try {
			window.history.replaceState(
				{},
				'',
				`?s=stats%20%26%20visits&module_tag=Jetpack%20Stats&modules_fallback=${ marked ? '1' : '0' }`
			);
			renderAt( '/features?search=stats%20%26%20visits&module_tag=Jetpack%20Stats' );
			const link = screen.queryByRole( 'link', { name: 'Classic Modules list' } );
			const params = link
				? new URL( link.getAttribute( 'href' )!, window.location.href ).searchParams
				: undefined;
			expect( params && Object.fromEntries( params ) ).toEqual(
				marked
					? {
							page: 'jetpack_modules',
							modules_fallback: '1',
							s: 'stats & visits',
							module_tag: 'Jetpack Stats',
						}
					: undefined
			);
		} finally {
			window.history.replaceState( {}, '', original );
		}
	} );

	it.each( [
		{ name: 'Jetpack Stats' },
		{ long_description: 'Jetpack Stats' },
		{ module_tags: [ 'Jetpack Stats' ] },
	] )( 'preserves migrated search fields %p without broadening native search', fields => {
		mockStates = [
			{ ...activeStats, feature: { ...activeStats.feature, product: 'stats' } } as FeatureState,
		];
		mockModules = { stats: fields as MyJetpackModule };
		const view = renderAt( '/features?search=Jetpack%20Stats' );
		expect( screen.queryByText( 'grid card' ) ).not.toBeInTheDocument();
		const original = window.location.href;
		try {
			window.history.replaceState( {}, '', '?modules_fallback=1&s=Jetpack%20Stats' );
			view.rerenderAt();
			expect( screen.getByText( 'grid card' ) ).toBeInTheDocument();
		} finally {
			window.history.replaceState( {}, '', original );
		}
	} );

	it.each( [
		'module_tag=Writing',
		'search=artificial%20intelligence',
		'search=artificial%20intelligence&module_tag=Writing',
	] )( 'matches migrated AI metadata with its activation toggle hidden: %s', params => {
		const original = window.location.href;
		const flags = window.myJetpackInitialState.myJetpackFlags;
		try {
			window.myJetpackInitialState.myJetpackFlags = { ...flags, showAiModuleToggle: false };
			window.history.replaceState( {}, '', '?modules_fallback=1&s=artificial%20intelligence' );
			mockStates = [
				activeStats,
				{
					...activeStats,
					feature: {
						...activeStats.feature,
						slug: 'jetpack-ai',
						product: 'jetpack-ai',
						name: 'AI',
					},
				} as FeatureState,
			];
			mockModules = {
				ai: {
					module_tags: [ 'Writing' ],
					search_terms: 'artificial intelligence',
				} as MyJetpackModule,
			};
			renderAt( `/features?${ params }` );
			expect( screen.getByText( 'jetpack-ai' ) ).toBeInTheDocument();
			expect( screen.getAllByText( 'grid card' ) ).toHaveLength( 1 );
		} finally {
			window.myJetpackInitialState.myJetpackFlags = flags;
			window.history.replaceState( {}, '', original );
		}
	} );

	it( 'applies a saved tag and search to product cards and module rows, and clears only the tag', async () => {
		const stats = {
			...activeStats,
			feature: { ...activeStats.feature, product: 'stats' },
		} as FeatureState;
		mockModules = { stats: { module_tags: [ 'Jetpack Stats' ] } as MyJetpackModule };
		mockStates = [
			stats,
			{
				...activeStats,
				feature: {
					...activeStats.feature,
					slug: 'other-stats',
					name: 'Other stats',
					product: undefined,
				},
			},
		];
		const tagged = moduleState( 'stats-extra', false );
		if ( tagged.control.kind === 'module' ) tagged.control.module.module_tags = [ 'Jetpack Stats' ];
		mockGroups = [
			{ label: 'Other', states: [ tagged, moduleState( 'stats-unrelated', false ) ] },
		];
		const original = window.location.href;
		try {
			window.history.replaceState( {}, '', '?modules_fallback=1&s=old&module_tag=old' );
			renderAt( '/features?search=stats&module_tag=Jetpack%20Stats' );
			expect( screen.getAllByText( 'grid card' ) ).toHaveLength( 2 );
			expect( screen.getByRole( 'button', { name: /^All/ } ) ).toHaveTextContent( 'All2' );
			expect( screen.getByText( 'stats-extra' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'stats-unrelated' ) ).not.toBeInTheDocument();
			await userEvent.click( screen.getByRole( 'button', { name: 'Clear tag' } ) );
			expect( screen.getByRole( 'searchbox', { name: 'Search features' } ) ).toHaveFocus();
			expect( screen.getByTestId( 'route' ) ).toHaveTextContent( '?search=stats' );
			expect( screen.getAllByText( 'grid card' ) ).toHaveLength( 4 );
			expect( screen.getByText( 'stats-unrelated' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Classic Modules list' } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( '&s=stats' )
			);
			expect(
				screen.getByRole( 'link', { name: 'Classic Modules list' } ).getAttribute( 'href' )
			).not.toContain( 'module_tag' );
			await userEvent.type( screen.getByRole( 'searchbox', { name: 'Search features' } ), ' new' );
			expect( screen.getByRole( 'link', { name: 'Classic Modules list' } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( 's=stats+new' )
			);
		} finally {
			window.history.replaceState( {}, '', original );
		}
	} );

	it.each( [
		[ 'search=related', false ],
		[ 'module_tag=Social', false ],
		[ 'module_tag=Social', true ],
	] )(
		'waits for modules before reporting an empty migrated view: %s (failed: %s)',
		( params, failed ) => {
			const original = window.location.href;
			try {
				window.history.replaceState( {}, '', '?modules_fallback=1&s=related' );
				mockStates = failed ? [ { ...activeStats, pending: true } ] : [];
				mockModulesLoaded = false;
				const view = renderAt( `/features?${ params }` );
				expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();
				expect(
					mockRecordEvent.mock.calls.some(
						( [ name ] ) => name === 'jetpack_myjetpack_features_empty_state_view'
					)
				).toBe( false );
				mockModulesLoaded = true;
				view.rerenderAt();
				expect( screen.getByRole( 'heading' ) ).toBeInTheDocument();
				expect(
					mockRecordEvent.mock.calls.some(
						( [ name ] ) => name === 'jetpack_myjetpack_features_empty_state_view'
					)
				).toBe( true );
			} finally {
				window.history.replaceState( {}, '', original );
			}
		}
	);

	it( 'does not describe the whole site as inactive when a tag has no active matches', () => {
		renderAt( '/features?filter=active&module_tag=Social' );
		expect( screen.getByRole( 'heading', { name: 'No features found.' } ) ).toBeVisible();
		expect( screen.queryByRole( 'button', { name: 'Explore all' } ) ).not.toBeInTheDocument();
	} );

	it( 'restores the available filter and search from the route after a remount', async () => {
		const view = renderAt( '/features?view=list' );
		await userEvent.click( screen.getByRole( 'button', { name: /^Available/ } ) );
		await userEvent.type( screen.getByRole( 'searchbox', { name: 'Search features' } ), 'monitor' );
		const saved = screen.getByTestId( 'route' ).textContent;
		expect( new URLSearchParams( saved || '' ).get( 'filter' ) ).toBe( 'available' );
		expect( new URLSearchParams( saved || '' ).get( 'search' ) ).toBe( 'monitor' );
		view.unmount();
		renderAt( `/features${ saved }` );
		expect( screen.getByRole( 'button', { name: /^Available/ } ) ).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect( screen.getByRole( 'searchbox', { name: 'Search features' } ) ).toHaveValue( 'monitor' );
		expect(
			new URLSearchParams( screen.getByTestId( 'route' ).textContent || '' ).get( 'filter' )
		).toBe( 'available' );
		await userEvent.clear( screen.getByRole( 'searchbox', { name: 'Search features' } ) );
		expect( screen.getByRole( 'button', { name: /^Available/ } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	} );

	it( 'names the filter that matched nothing and switches back from the empty state', async () => {
		renderAt( '/features?filter=inactive' );

		expect( screen.getByRole( 'heading', { name: 'Everything is turned on.' } ) ).toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Explore all' } ) );

		expect( screen.getByText( 'grid card' ) ).toBeInTheDocument();
	} );

	it( 'says the list is incomplete when the modules failed and none arrived', () => {
		mockModulesFailed = true;
		renderAt( '/' );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'This list is incomplete' );
	} );

	it.each( [
		[ 'the modules loaded', false ],
		[ 'a refresh failed over a full list', true ],
	] )( 'shows no incomplete-list notice when %s', ( _, failed ) => {
		mockModulesFailed = failed;
		mockModules = { stats: { module: 'stats', activated: true } as MyJetpackModule };
		renderAt( '/' );

		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'drops the incomplete-list notice once another request refills the modules', () => {
		mockModulesFailed = true;
		const { rerenderAt } = renderAt( '/' );
		expect( screen.getByRole( 'alert' ) ).toBeInTheDocument();

		mockModules = { stats: { module: 'stats', activated: true } as MyJetpackModule };
		rerenderAt();

		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'waits for the read to settle before calling an empty catalog a failure', () => {
		mockStates = [];
		mockMainFeatures = { features: [], isPlaceholderData: true };

		renderAt( '/features' );

		expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();
	} );

	it( 'holds the empty state back while the modules a feature depends on are in flight', () => {
		mockStates = [ { ...activeStats, pending: true, status: 'inactive' } as FeatureState ];

		renderAt( '/features?filter=active' );

		expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'all', 'available' ] )(
		'still answers a search that matched nothing while modules are in flight (filter: %s)',
		filter => {
			mockStates = [ { ...activeStats, pending: true, status: 'inactive' } as FeatureState ];

			renderAt( `/features?filter=${ filter }&search=zzzz` );

			expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features match “zzzz”.' );
		}
	);

	it( 'waits for modules before reporting an empty Available filter after a reload', () => {
		mockIsLoading = true;
		mockModulesLoaded = false;
		mockStates = [ { ...activeStats, pending: true } as FeatureState ];
		const { rerenderAt } = renderAt( '/features?filter=available' );

		expect( screen.queryByText( 'No features found.' ) ).not.toBeInTheDocument();

		mockIsLoading = false;
		mockModulesLoaded = true;
		mockStates = [ activeStats ];
		rerenderAt();
		expect( screen.getByText( 'grid card' ) ).toBeInTheDocument();

		mockStates = [ { ...activeStats, unavailableReason: 'Unavailable' } ];
		rerenderAt();
		expect( screen.getByText( 'No features found.' ) ).toBeInTheDocument();
	} );

	it( 'stops holding Available back once a failed module request has ended', () => {
		mockStates = [ { ...activeStats, pending: true, status: 'inactive' } as FeatureState ];

		renderAt( '/features?filter=available' );

		expect( screen.getByRole( 'heading', { name: 'No features found.' } ) ).toBeVisible();
	} );

	it( 'reports an empty catalog as a failure rather than a site with no features', () => {
		mockStates = [];
		mockMainFeatures = { features: [], isPlaceholderData: false };

		renderAt( '/features' );

		expect(
			screen.getByRole( 'heading', { name: 'We couldn’t load your features.' } )
		).toBeVisible();
	} );

	it( 'leaves every filter pill unpressed while a search covers all features', () => {
		renderAt( '/features?filter=growth&search=stats' );

		const pills = within( screen.getByRole( 'group', { name: 'Filter features' } ) );

		expect( pills.getByRole( 'button', { name: /^Growth/ } ) ).toBeInTheDocument();
		expect( pills.queryAllByRole( 'button', { pressed: true } ) ).toHaveLength( 0 );
	} );

	it( 'drops the category pills for a visit that arrived on Included in plan, until it leaves the tab', async () => {
		const { unmount } = renderAt( '/features?filter=included' );

		const pillNames = () =>
			within( screen.getByRole( 'group', { name: 'Filter features' } ) )
				.getAllByRole( 'button' )
				.map( pill => pill.textContent?.replace( /\d+$/, '' ) );

		expect( pillNames() ).toEqual( [
			'All',
			'Available',
			'Active',
			'Inactive',
			'Included in plan',
		] );

		await userEvent.click( screen.getByRole( 'button', { name: /^All/ } ) );

		expect( pillNames() ).toEqual( [
			'All',
			'Available',
			'Active',
			'Inactive',
			'Included in plan',
		] );

		// A fresh mount is a new visit to the tab, which offers the usual pills again.
		unmount();
		renderAt( '/features' );

		expect( pillNames() ).toEqual( [
			'All',
			'Available',
			'Active',
			'Inactive',
			'Essential',
			'Security',
			'Growth',
		] );
	} );

	it( 'shows the grid by default and switches to the list from the toolbar', async () => {
		renderAt( '/features' );

		expect( screen.getByText( 'grid card' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Grid view' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'List view' } ) );

		expect( screen.getByText( 'list rows' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'grid card' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Grid view' } ) );

		expect( screen.getByText( 'grid card' ) ).toBeInTheDocument();
	} );

	it( 'opens on the list when the URL asks for it', () => {
		renderAt( '/features?view=list' );

		expect( screen.getByText( 'list rows' ) ).toBeInTheDocument();
	} );

	it( 'counts the modules with the features, and offers one bulk bar over both lists', () => {
		mockGroups = [
			{
				label: 'Security',
				states: [ moduleState( 'monitor', false ), moduleState( 'sso', true ) ],
			},
		];

		renderAt( '/features?view=list' );

		// One feature and two modules, counted together. Read off the filter select, whose
		// options carry the same counts as the pills in a readable form.
		expect( screen.getByRole( 'option', { name: 'All (3)' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'option', { name: 'Active (2)' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'option', { name: 'Inactive (1)' } ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'checkbox', { name: 'Select all features' } ) ).toHaveLength( 1 );
	} );

	it( 'drops the bulk bar when nothing is left to switch', () => {
		renderAt( '/features?view=list&search=nothing-matches-this' );

		expect(
			screen.queryByRole( 'checkbox', { name: 'Select all features' } )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'No features match “nothing-matches-this”.' ) ).toBeInTheDocument();
	} );

	it( 'steps the modal through the features the filter shows, skipping the rest', () => {
		const feature = ( slug: string, status: string ) =>
			( {
				...activeStats,
				feature: { ...activeStats.feature, slug, name: slug },
				status,
			} ) as FeatureState;
		mockStates = [
			feature( 'stats', 'active' ),
			feature( 'anti-spam', 'inactive' ),
			feature( 'forms', 'active' ),
			feature( 'podcast', 'active' ),
		];
		mockModalProps = null;

		renderAt( '/features?filter=active&feature=forms' );

		expect( mockModalProps ).toMatchObject( {
			previous: { slug: 'stats' },
			next: { slug: 'podcast' },
			position: 2,
			total: 3,
		} );
	} );

	it( 'steps through a feature opened before the catalog carried it, once it arrives', () => {
		mockStates = [];
		mockMainFeatures = { jetpack: 'active', features: [], isPlaceholderData: true };

		const { rerenderAt } = renderAt( '/features?feature=forms' );

		const feature = ( slug: string ) =>
			( {
				...activeStats,
				feature: { ...activeStats.feature, slug, name: slug },
				status: 'active',
			} ) as FeatureState;
		mockStates = [ feature( 'stats' ), feature( 'forms' ), feature( 'podcast' ) ];
		mockMainFeatures = {
			jetpack: 'active',
			features: [ { slug: 'stats' } ],
			isPlaceholderData: false,
		};
		rerenderAt();

		expect( mockModalProps ).toMatchObject( {
			previous: { slug: 'stats' },
			next: { slug: 'podcast' },
			position: 2,
			total: 3,
		} );
	} );

	it( 'keeps stepping from a feature switched out of the status filter it was opened under', () => {
		const feature = ( slug: string, status: string ) =>
			( {
				...activeStats,
				feature: { ...activeStats.feature, slug, name: slug },
				status,
			} ) as FeatureState;
		mockStates = [
			feature( 'stats', 'inactive' ),
			feature( 'forms', 'inactive' ),
			feature( 'podcast', 'inactive' ),
		];
		const url = '/features?filter=inactive&feature=forms';
		const { rerenderAt } = renderAt( url );

		mockStates = [
			feature( 'stats', 'inactive' ),
			feature( 'forms', 'active' ),
			feature( 'podcast', 'inactive' ),
		];
		rerenderAt();

		expect( mockModalProps ).toMatchObject( {
			previous: { slug: 'stats' },
			next: { slug: 'podcast' },
			position: 2,
			total: 3,
		} );
	} );

	it( 'retakes the step order once the modules a status filter reads have landed', () => {
		const feature = ( slug: string, status: string, pending = false ) =>
			( {
				...activeStats,
				feature: { ...activeStats.feature, slug, name: slug },
				status,
				pending,
			} ) as FeatureState;
		mockIsLoading = true;
		mockStates = [
			feature( 'stats', 'inactive', true ),
			feature( 'forms', 'inactive', true ),
			feature( 'podcast', 'inactive', true ),
		];
		const { rerenderAt } = renderAt( '/features?filter=inactive&feature=forms' );

		mockIsLoading = false;
		mockStates = [
			feature( 'stats', 'active' ),
			feature( 'forms', 'inactive' ),
			feature( 'podcast', 'inactive' ),
		];
		rerenderAt();

		expect( mockModalProps ).toMatchObject( { next: { slug: 'podcast' }, position: 1, total: 2 } );
		expect( mockModalProps?.previous ).toBeUndefined();
	} );
} );

describe( 'FeaturesContent after connecting the account', () => {
	const off = ( slug: string, control: FeatureState[ 'control' ], overrides = {} ) =>
		( {
			feature: { slug, name: slug, plans: [] },
			status: 'inactive',
			control,
			...overrides,
		} ) as unknown as FeatureState;
	const $module = { module: 'monitor', name: 'Monitor', available: true, activated: false };
	const monitor = off( 'monitor', { kind: 'module', module: $module as MyJetpackModule } );
	const social = off( 'social', { kind: 'plugin', plugin: 'jetpack-social' } );
	const requests = () => [ ...mockSetModuleActive.mock.calls, ...mockRun.mock.calls ];
	const setFlag = ( accountConnect: boolean ) => {
		window.myJetpackInitialState = {
			...window.myJetpackInitialState,
			myJetpackFlags: { accountConnect },
		} as typeof window.myJetpackInitialState;
	};

	let nowSpy: jest.SpyInstance | undefined;
	const anHourLater = () => {
		const at = Date.now();
		nowSpy = jest.spyOn( Date, 'now' ).mockReturnValue( at + 60 * 60 * 1000 );
	};

	beforeEach( () => {
		window.sessionStorage.clear();
		resetConnectIntentForTests();
		setFlag( true );
		mockConnected = true;
		mockRun.mockClear();
		mockSetModuleActive.mockClear();
		mockMainFeatures = { jetpack: 'active', features: [], isPlaceholderData: false };
		mockGroups = [];
		mockIsLoading = false;
	} );
	afterEach( () => nowSpy?.mockRestore() );

	it.each( [
		[ 'a module that is off', [ monitor ], 'monitor', [ [ 'monitor', true, { reload: false } ] ] ],
		[ 'a plugin that is off', [ social ], 'social', [ [ 'jetpack-social', 'activate' ] ] ],
	] as const )( 'turns on once, after the return, %s', ( _, states, slug, expected ) => {
		mockStates = [ ...states ] as FeatureState[];
		const id = rememberConnectIntent( slug );

		renderAt( `/features?view=list&connect_intent=${ id }` );

		expect( requests() ).toEqual( expected );
		expect( screen.getByTestId( 'route' ) ).toHaveTextContent( /^\?view=list$/ );
	} );

	it.each( [
		[ 'a feature Jetpack already turned on', [ { ...monitor, status: 'active' } ], 'monitor' ],
		[
			'a feature unavailable for another reason',
			[
				off( 'monitor', {
					kind: 'module',
					module: { ...$module, available: false } as MyJetpackModule,
				} ),
			],
			'monitor',
		],
	] as const )( 'leaves %s as it is after the return', ( _, states, slug ) => {
		mockStates = [ ...states ] as FeatureState[];
		const id = rememberConnectIntent( slug );

		renderAt( `/features?view=list&connect_intent=${ id }` );

		expect( requests() ).toEqual( [] );
		expect( screen.getByTestId( 'route' ) ).toHaveTextContent( /^\?view=list$/ );
	} );

	it.each< [ string, () => string | void ] >( [
		[
			'the account is still missing',
			() => {
				mockConnected = false;
			},
		],
		[ 'the return is for another tab', () => 'another' ],
		[ 'the click is over an hour old', anHourLater ],
		[
			'Back from WordPress.com showed the cached page',
			() => {
				const event = new Event( 'pageshow' );
				Object.defineProperty( event, 'persisted', { value: true } );
				window.dispatchEvent( event );
			},
		],
		[ 'the account-connect flag is off', () => setFlag( false ) ],
	] )( 'turns nothing on when %s', ( _, setup ) => {
		mockStates = [ monitor ];
		const id = rememberConnectIntent( 'monitor' );
		const returnId = setup() ?? id;

		renderAt( `/features?connect_intent=${ returnId }` );

		expect( requests() ).toEqual( [] );
	} );

	it( 'forgets the click on a return with the flag off, so a reload with it on turns nothing on', () => {
		mockStates = [ monitor ];
		const id = rememberConnectIntent( 'monitor' );
		setFlag( false );
		renderAt( `/features?connect_intent=${ id }` ).unmount();

		// A reload of the same return URL is a new page load.
		resetConnectIntentForTests();
		setFlag( true );
		renderAt( `/features?connect_intent=${ id }` );

		expect( requests() ).toEqual( [] );
	} );

	it( 'still turns the feature on once when the mount that decided goes away first', () => {
		const id = rememberConnectIntent( 'monitor' );
		const wrapper = ( { children }: { children: React.ReactNode } ) => (
			<MemoryRouter initialEntries={ [ `/features?connect_intent=${ id }` ] }>
				{ children }
			</MemoryRouter>
		);
		renderHook( () => useConnectResume( [ monitor ], true ), { wrapper } ).unmount();

		const { result } = renderHook( () => useConnectResume( [ monitor ], true ), { wrapper } );
		const target = result.current as FeatureState;
		render( <ConnectResume state={ target } /> ).unmount();
		render( <ConnectResume state={ target } /> );

		expect( requests() ).toEqual( [ [ 'monitor', true, { reload: false } ] ] );
	} );

	it.each( [
		[ 'it went on meanwhile', () => ( { ...monitor, status: 'active' } ) as FeatureState ],
		[
			'the hour ran out meanwhile',
			() => {
				anHourLater();
				return monitor;
			},
		],
	] )( 'checks the feature again when a mount claims it, and sends nothing if %s', ( _, later ) => {
		const id = rememberConnectIntent( 'monitor' );
		const wrapper = ( { children }: { children: React.ReactNode } ) => (
			<MemoryRouter initialEntries={ [ `/features?connect_intent=${ id }` ] }>
				{ children }
			</MemoryRouter>
		);
		renderHook( () => useConnectResume( [ monitor ], true ), { wrapper } ).unmount();

		render( <ConnectResume state={ later() } /> );

		expect( requests() ).toEqual( [] );
	} );

	it( 'does nothing when the hour runs out before the feature rows load', () => {
		mockIsLoading = true;
		mockStates = [ monitor ];
		const id = rememberConnectIntent( 'monitor' );
		const view = renderAt( `/features?connect_intent=${ id }` );

		anHourLater();
		mockIsLoading = false;
		view.rerenderAt();

		expect( requests() ).toEqual( [] );
	} );

	it( 'finds a More Features row after loading and never replays the click', () => {
		mockIsLoading = true;
		mockGroups = [ { label: 'Other', states: [ monitor ] } ];
		const id = rememberConnectIntent( 'monitor' );
		const view = renderAt( `/features?connect_intent=${ id }` );
		expect( requests() ).toEqual( [] );

		mockIsLoading = false;
		view.rerenderAt();
		view.rerenderAt();
		view.unmount();
		renderAt( `/features?connect_intent=${ id }` );
		// A reload of the same return URL is a new page load.
		resetConnectIntentForTests();
		renderAt( `/features?connect_intent=${ id }` );

		expect( requests() ).toEqual( [ [ 'monitor', true, { reload: false } ] ] );
	} );
} );
