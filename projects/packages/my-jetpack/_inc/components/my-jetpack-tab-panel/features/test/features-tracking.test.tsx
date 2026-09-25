import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import useAnalytics from '../../../../hooks/use-analytics';
import { reloadPage } from '../../products/reload-page';
import { FeaturesContent } from '../content';
import { FeaturesEmptyState } from '../empty-state';
import { FeatureAction } from '../feature-action';
import { FeatureModalActions } from '../feature-modal-actions';
import { FeaturesTrackingProvider } from '../features-tracking-context';
import type { FeatureState } from '../feature-state';
import type { FeaturesView } from '../toolbar';
import type { FeatureFilter } from '../use-feature-filter';
import type { MoreFeaturesGroup } from '../use-more-features';
import type { ReactNode } from 'react';

const mockRun = jest.fn();
const mockSetModuleActive = jest.fn();
const recordEvent = jest.fn();

jest.mock( '../../../../hooks/use-analytics' );
jest.mock( '../../products/reload-page', () => ( { reloadPage: jest.fn() } ) );

jest.mock( '../use-main-features', () => ( {
	useMainFeatures: () => ( {
		jetpack: 'active',
		features: [ { slug: 'stats' }, { slug: 'boost' } ],
		isPlaceholderData: false,
	} ),
	useFeaturePlugin: ( plugin: string, name: string ) => ( {
		run: ( action: string ) => mockRun( { plugin, name, action } ),
		isBusy: false,
	} ),
} ) );

// The real switch calls this; that it does is covered by the module-toggle tests, so here
// it is held onto and called directly.
const mockModuleSwitch: { onSwitch?: ( active: boolean ) => void } = {};

jest.mock( '../../../module-toggle', () => ( {
	ModuleToggle: ( { onSwitch }: { onSwitch?: ( active: boolean ) => void } ) => {
		mockModuleSwitch.onSwitch = onSwitch;

		// ds-allow: input -- stands in for the real ModuleToggle, which reaches the modules store.
		return <input type="checkbox" aria-label="Module toggle" readOnly />;
	},
	useModuleActivation: () => ( {
		setModuleActive: mockSetModuleActive,
		isUpdating: false,
		isActive: false,
	} ),
} ) );

const mockStates = [
	{
		feature: {
			slug: 'stats',
			name: 'Stats',
			description: '',
			plans: [ { slug: 'complete' } ],
			essential: true,
		},
		status: 'active',
		control: { kind: 'none' },
	},
	{
		feature: { slug: 'boost', name: 'Boost', description: '', plans: [ { slug: 'complete' } ] },
		status: 'inactive',
		control: { kind: 'none' },
	},
] as unknown as FeatureState[];

// Stands in for modules still loading, when each feature is a placeholder reading inactive.
let mockPending = false;

jest.mock( '../feature-state', () => ( {
	useFeatureStates: () => ( {
		states: mockPending
			? mockStates.map( state => ( { ...state, pending: true, status: 'inactive' } ) )
			: mockStates,
		isLoading: mockPending,
	} ),
	// Nothing here is forced by a host, which is what leaves the switches on show.
	getForcedReason: () => null,
} ) );

// The card's own click target is covered elsewhere; here the handler is held onto.
const mockGrid: { onOpen?: ( slug: string ) => void } = {};

jest.mock( '../feature-item', () => ( {
	FeatureItem: ( { onOpen }: { onOpen: ( slug: string ) => void } ) => {
		mockGrid.onOpen = onOpen;

		return <div>grid card</div>;
	},
} ) );
jest.mock( '../feature-list', () => ( {
	FeatureList: () => <div>list rows</div>,
	UnswitchableNote: () => null,
} ) );
// The real narrowing is kept: a count or a result_count is only right if it answers for
// this section as well as for the grid.
let mockMoreFeatures: MoreFeaturesGroup[] = [];

jest.mock( '../use-more-features', () => ( {
	...jest.requireActual( '../use-more-features' ),
	useMoreFeatures: () => mockMoreFeatures,
} ) );
// The plan badges live inside the real modal; here the handler is held onto and called.
const mockModal: { onFilterByPlan?: ( plan: string ) => void } = {};

jest.mock( '../feature-modal', () => ( {
	FeatureModal: ( {
		onClose,
		onFilterByPlan,
	}: {
		onClose: () => void;
		onFilterByPlan: ( plan: string ) => void;
	} ) => {
		mockModal.onFilterByPlan = onFilterByPlan;

		// ds-allow: button -- stands in for the real modal, which is not under test.
		return <button onClick={ onClose }>close modal</button>;
	},
} ) );

const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;

const buildState = ( control: FeatureState[ 'control' ], overrides = {} ): FeatureState =>
	( {
		feature: {
			slug: 'boost',
			name: 'Boost',
			plugin: 'jetpack-boost',
			plugin_name: 'Jetpack Boost',
			plugin_status: 'inactive',
			manage_url: '#boost',
		},
		status: 'inactive',
		control,
		...overrides,
	} ) as FeatureState;

// A row as the More Features section builds one: a module, carrying no plan.
const moduleRow = ( slug: string, name: string ): FeatureState =>
	( {
		feature: { slug, name, description: '', plans: [], essential: false },
		status: 'inactive',
		control: { kind: 'module', module: { module: slug, name, description: '' } },
	} ) as unknown as FeatureState;

const renderAt = ( url: string ) =>
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<MemoryRouter initialEntries={ [ url ] }>
				<FeaturesContent />
			</MemoryRouter>
		</QueryClientProvider>
	);

type Grid = { filter?: FeatureFilter; search?: string; view?: FeaturesView };

const renderTracked = ( children: ReactNode, grid: Grid = {} ) =>
	render(
		<FeaturesTrackingProvider
			filter={ grid.filter ?? 'all' }
			search={ grid.search ?? '' }
			view={ grid.view ?? 'grid' }
		>
			{ children }
		</FeaturesTrackingProvider>
	);

// Comfortably past the tab's own delay, so a loaded CI worker cannot land a timer after
// the wait that is meant to contain it.
const SEARCH_SETTLE = 1500;

// Same reason, for the waits that expect a timer to have fired: the default is 1s, which
// leaves a 500ms debounce almost no room.
const SETTLED = { timeout: 5000 };

const eventNames = () => recordEvent.mock.calls.map( ( [ name ] ) => name );

const lastEvent = ( name: string ) =>
	recordEvent.mock.calls.filter( ( [ event ] ) => event === name ).at( -1 )?.[ 1 ];

beforeEach( () => {
	jest.clearAllMocks();
	mockMoreFeatures = [];
	mockPending = false;
	mockModuleSwitch.onSwitch = undefined;
	mockModal.onFilterByPlan = undefined;
	mockGrid.onOpen = undefined;
	mockUseAnalytics.mockReturnValue( { recordEvent } );
} );

describe( 'Features tab toolbar tracking', () => {
	it( 'records the filter it switched to, and the one it left', async () => {
		renderAt( '/features?filter=active' );

		await userEvent.click( screen.getByRole( 'button', { name: /Inactive/ } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_filter_change' ) ).toMatchObject( {
			filter: 'inactive',
			previous_filter: 'active',
			count: 1,
		} );
	} );

	it( 'records a view change in both directions', async () => {
		renderAt( '/features' );

		await userEvent.click( screen.getByRole( 'button', { name: 'List view' } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_view_change' ) ).toMatchObject( {
			view: 'list',
			previous_view: 'grid',
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'Grid view' } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_view_change' ) ).toMatchObject( {
			view: 'grid',
			previous_view: 'list',
		} );
	} );

	it( 'records the term someone settles on, not every prefix typed on the way', async () => {
		renderAt( '/features' );

		await userEvent.type( screen.getByRole( 'searchbox', { name: 'Search features' } ), 'boost' );

		await waitFor(
			() =>
				expect( lastEvent( 'jetpack_myjetpack_features_search' ) ).toMatchObject( {
					search_term: 'boost',
				} ),
			SETTLED
		);

		expect(
			eventNames().filter( name => name === 'jetpack_myjetpack_features_search' )
		).toHaveLength( 1 );
	} );
} );

describe( 'Features tab modal tracking', () => {
	it( 'records a view when the URL names a feature, and a close when it stops naming one', async () => {
		renderAt( '/features?feature=stats' );

		await waitFor( () =>
			expect( lastEvent( 'jetpack_myjetpack_feature_modal_view' ) ).toMatchObject( {
				feature_slug: 'stats',
				feature_status: 'active',
				is_essential: true,
			} )
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'close modal' } ) );

		await waitFor( () =>
			expect( lastEvent( 'jetpack_myjetpack_feature_modal_close' ) ).toMatchObject( {
				feature_slug: 'stats',
			} )
		);
	} );

	it( 'records the modal opening once, however often the tab re-renders', async () => {
		const { rerender } = renderAt( '/features?feature=stats' );

		await waitFor( () =>
			expect( eventNames() ).toContain( 'jetpack_myjetpack_feature_modal_view' )
		);

		rerender(
			<QueryClientProvider client={ new QueryClient() }>
				<MemoryRouter initialEntries={ [ '/features?feature=stats' ] }>
					<FeaturesContent />
				</MemoryRouter>
			</QueryClientProvider>
		);

		expect(
			eventNames().filter( name => name === 'jetpack_myjetpack_feature_modal_view' )
		).toHaveLength( 1 );
	} );

	it( 'waits for a deep-linked feature to load before recording its view', () => {
		mockPending = true;
		const { rerender } = renderAt( '/features?feature=stats' );

		expect( eventNames() ).not.toContain( 'jetpack_myjetpack_feature_modal_view' );

		mockPending = false;
		rerender(
			<QueryClientProvider client={ new QueryClient() }>
				<MemoryRouter initialEntries={ [ '/features?feature=stats' ] }>
					<FeaturesContent />
				</MemoryRouter>
			</QueryClientProvider>
		);

		expect( lastEvent( 'jetpack_myjetpack_feature_modal_view' ) ).toMatchObject( {
			feature_slug: 'stats',
			feature_status: 'active',
		} );
	} );
} );

describe( 'Feature action tracking', () => {
	it( 'records an install from the card, and says it came from the card', async () => {
		renderTracked(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'install',
			origin: 'card',
			feature_slug: 'boost',
			control_kind: 'install-plugin',
			plugin: 'jetpack-boost',
		} );
		expect( mockRun ).toHaveBeenCalledWith( expect.objectContaining( { action: 'install' } ) );
	} );

	it( 'records the same action from the modal under a different origin', async () => {
		renderTracked(
			<FeatureModalActions
				state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'install',
			origin: 'modal',
		} );
		expect( mockRun ).toHaveBeenCalledWith( expect.objectContaining( { action: 'install' } ) );
	} );

	it( 'records switching a plugin off as a deactivate', async () => {
		renderTracked(
			<FeatureAction
				state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost' }, { status: 'active' } ) }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'deactivate',
			origin: 'card',
			feature_status: 'active',
		} );
		// Recording must not have replaced the switch it reports.
		expect( mockRun ).toHaveBeenCalledWith( expect.objectContaining( { action: 'deactivate' } ) );
	} );

	it( 'records a module toggle, which reports nothing on its own', async () => {
		renderTracked(
			<FeatureAction
				state={ buildState( {
					kind: 'module',
					module: { module: 'stats', activated: false },
				} as unknown as FeatureState[ 'control' ] ) }
			/>
		);

		act( () => mockModuleSwitch.onSwitch?.( true ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'activate',
			origin: 'card',
			control_kind: 'module',
		} );
	} );

	it( 'records leaving for the feature itself', async () => {
		renderTracked(
			<FeatureModalActions state={ buildState( { kind: 'none' }, { status: 'active' } ) } />
		);

		await userEvent.click( screen.getByRole( 'link', { name: 'Open' } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_manage_click' ) ).toMatchObject( {
			feature_slug: 'boost',
		} );
	} );
} );

describe( 'Empty state tracking', () => {
	const emptyProps = {
		search: '',
		filter: 'all' as const,
		hasCatalog: true,
		onFilterChange: jest.fn(),
	};

	it.each( [
		[ 'search', { search: 'bakcup' } ],
		[ 'active', { filter: 'active' as const } ],
		[ 'inactive', { filter: 'inactive' as const } ],
		[ 'no-catalog', { hasCatalog: false } ],
		[ 'none', {} ],
	] )( 'names %s as what emptied the grid', ( reason, overrides ) => {
		renderTracked( <FeaturesEmptyState { ...emptyProps } { ...overrides } /> );

		expect( lastEvent( 'jetpack_myjetpack_features_empty_state_view' ) ).toMatchObject( {
			reason,
		} );
	} );

	it( 'records the state once, not once per keystroke refining a failed search', () => {
		const { rerender } = renderTracked( <FeaturesEmptyState { ...emptyProps } search="bak" /> );
		rerender(
			<FeaturesTrackingProvider filter="all" search="bakc" view="grid">
				<FeaturesEmptyState { ...emptyProps } search="bakc" />
			</FeaturesTrackingProvider>
		);

		expect(
			eventNames().filter( name => name === 'jetpack_myjetpack_features_empty_state_view' )
		).toHaveLength( 1 );
	} );

	it( 'records the way out of a filter that matched nothing', async () => {
		const onFilterChange = jest.fn();
		renderTracked(
			<FeaturesEmptyState { ...emptyProps } filter="active" onFilterChange={ onFilterChange } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Explore all' } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_empty_state_click' ) ).toMatchObject( {
			reason: 'active',
			action: 'explore_all',
		} );
		expect( onFilterChange ).toHaveBeenCalledWith( 'all' );
	} );

	it( 'records a reload of a catalog that never arrived, and still reloads', async () => {
		renderTracked( <FeaturesEmptyState { ...emptyProps } hasCatalog={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Reload' } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_empty_state_click' ) ).toMatchObject( {
			reason: 'no-catalog',
			action: 'reload',
		} );
		// The event is recorded on the click; the reload follows a beat later so the
		// queued pixel is not cancelled by it.
		expect( reloadPage ).not.toHaveBeenCalled();
		await waitFor( () => expect( reloadPage ).toHaveBeenCalled(), SETTLED );
	} );

	it( 'records leaving for the support search', async () => {
		renderTracked( <FeaturesEmptyState { ...emptyProps } search="bakcup" /> );

		await userEvent.click( screen.getByRole( 'link', { name: /Search jetpack.com/ } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_empty_state_click' ) ).toMatchObject( {
			reason: 'search',
			action: 'support_search',
		} );
	} );

	it( 'carries the grid the empty state was reached from', () => {
		render(
			<FeaturesTrackingProvider filter="inactive" search="" view="list">
				<FeaturesEmptyState { ...emptyProps } filter="inactive" />
			</FeaturesTrackingProvider>
		);

		expect( lastEvent( 'jetpack_myjetpack_features_empty_state_view' ) ).toMatchObject( {
			reason: 'inactive',
			current_filter: 'inactive',
			view: 'list',
		} );
	} );
} );

describe( 'The grid every event is measured against', () => {
	it( 'rides along on a feature action', async () => {
		renderTracked(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />,
			{ filter: 'inactive', search: 'boo', view: 'list' }
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			current_filter: 'inactive',
			search_term: 'boo',
			view: 'list',
		} );
	} );

	it( 'leaves out a search term there is none of, rather than sending it empty', async () => {
		renderTracked(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).not.toHaveProperty( 'search_term' );
	} );

	it( 'leaves out a plugin a feature does not have', async () => {
		const state = buildState( {
			kind: 'module',
			module: {},
		} as unknown as FeatureState[ 'control' ] );
		state.feature.plugin = '';
		state.feature.plugin_status = undefined as unknown as MainFeaturePluginStatus;

		renderTracked( <FeatureModalActions state={ { ...state, status: 'active' } } /> );

		await userEvent.click( screen.getByRole( 'link', { name: 'Open' } ) );

		const event = lastEvent( 'jetpack_myjetpack_feature_manage_click' );
		expect( event ).not.toHaveProperty( 'plugin' );
		expect( event ).not.toHaveProperty( 'plugin_status' );
	} );

	it( 'stamps the schema version on every event', async () => {
		renderTracked(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( { event_version: 1 } );
	} );
} );

describe( 'Empty state view, as the grid changes under it', () => {
	it( 'records the new state when the reason changes without a remount', async () => {
		const { rerender } = renderTracked(
			<FeaturesEmptyState
				search="bakcup"
				filter="all"
				hasCatalog={ true }
				onFilterChange={ jest.fn() }
			/>,
			{ search: 'bakcup' }
		);

		rerender(
			<FeaturesTrackingProvider filter="all" search="" view="grid">
				<FeaturesEmptyState
					search=""
					filter="all"
					hasCatalog={ false }
					onFilterChange={ jest.fn() }
				/>
			</FeaturesTrackingProvider>
		);

		expect(
			recordEvent.mock.calls
				.filter( ( [ name ] ) => name === 'jetpack_myjetpack_features_empty_state_view' )
				.map( ( [ , props ] ) => props.reason )
		).toEqual( [ 'search', 'no-catalog' ] );
	} );

	it( 'names the term that emptied the grid', () => {
		renderTracked(
			<FeaturesEmptyState
				search="bakcup"
				filter="all"
				hasCatalog={ true }
				onFilterChange={ jest.fn() }
			/>,
			{ search: 'bakcup' }
		);

		expect( lastEvent( 'jetpack_myjetpack_features_empty_state_view' ) ).toMatchObject( {
			reason: 'search',
			search_term: 'bakcup',
		} );
	} );
} );

describe( 'What is not worth an event', () => {
	it( 'says nothing when the filter already in play is picked again', async () => {
		renderAt( '/features?filter=active' );

		await userEvent.click( screen.getByRole( 'button', { name: /^Active/ } ) );

		expect( eventNames() ).not.toContain( 'jetpack_myjetpack_features_filter_change' );
	} );

	it( 'says nothing when the layout already in play is picked again', async () => {
		renderAt( '/features?view=list' );

		await userEvent.click( screen.getByRole( 'button', { name: 'List view' } ) );

		expect( eventNames() ).not.toContain( 'jetpack_myjetpack_features_view_change' );
	} );

	it( 'treats emptying the search box as the end of a search, not one of its own', async () => {
		renderAt( '/features' );
		const box = screen.getByRole( 'searchbox', { name: 'Search features' } );

		await userEvent.type( box, 'boost' );
		await waitFor(
			() => expect( eventNames() ).toContain( 'jetpack_myjetpack_features_search' ),
			SETTLED
		);
		await userEvent.clear( box );
		await new Promise( resolve => setTimeout( resolve, SEARCH_SETTLE ) );

		expect(
			recordEvent.mock.calls
				.filter( ( [ name ] ) => name === 'jetpack_myjetpack_features_search' )
				.map( ( [ , props ] ) => props.search_term )
		).toEqual( [ 'boost' ] );
	} );

	it( 'records a term searched for again after a filter cleared it', async () => {
		renderAt( '/features' );
		const box = screen.getByRole( 'searchbox', { name: 'Search features' } );

		await userEvent.type( box, 'boost' );
		await waitFor(
			() => expect( eventNames() ).toContain( 'jetpack_myjetpack_features_search' ),
			SETTLED
		);

		// Picking a filter clears the term, so typing it again is a new search.
		await userEvent.click( screen.getByRole( 'button', { name: /Inactive/ } ) );
		await userEvent.type( screen.getByRole( 'searchbox', { name: 'Search features' } ), 'boost' );
		await new Promise( resolve => setTimeout( resolve, SEARCH_SETTLE ) );

		expect(
			recordEvent.mock.calls.filter( ( [ name ] ) => name === 'jetpack_myjetpack_features_search' )
		).toHaveLength( 2 );
	} );
} );

describe( 'How many a filter would show', () => {
	it( 'counts a plan the pills do not offer', async () => {
		renderAt( '/features?feature=stats' );

		await waitFor( () =>
			expect( eventNames() ).toContain( 'jetpack_myjetpack_feature_modal_view' )
		);
		act( () => mockModal.onFilterByPlan?.( 'complete' ) );

		// Both fixtures are on the Complete plan; `counts` never holds that filter unless it
		// is already in play, which is what made this read as 0.
		expect( lastEvent( 'jetpack_myjetpack_features_filter_change' ) ).toMatchObject( {
			filter: 'complete',
			count: 2,
		} );
		// The badge also steps out of the modal, which is a close.
		expect( lastEvent( 'jetpack_myjetpack_feature_modal_close' ) ).toMatchObject( {
			feature_slug: 'stats',
		} );
	} );

	it( 'counts the More Features rows the pill counts, not the grid alone', async () => {
		mockMoreFeatures = [ { label: 'Engagement', states: [ moduleRow( 'monitor', 'Monitor' ) ] } ];
		renderAt( '/features' );

		await userEvent.click( screen.getByRole( 'button', { name: /Inactive/ } ) );

		// Boost from the grid, Monitor from the section below it.
		expect( lastEvent( 'jetpack_myjetpack_features_filter_change' ) ).toMatchObject( {
			filter: 'inactive',
			count: 2,
		} );
	} );

	it( 'counts a search the same way, over both lists', async () => {
		mockMoreFeatures = [ { label: 'Engagement', states: [ moduleRow( 'monitor', 'Monitor' ) ] } ];
		renderAt( '/features' );

		await userEvent.type( screen.getByRole( 'searchbox', { name: 'Search features' } ), 'monitor' );

		await waitFor(
			() =>
				expect( lastEvent( 'jetpack_myjetpack_features_search' ) ).toMatchObject( {
					search_term: 'monitor',
					result_count: 1,
				} ),
			SETTLED
		);
	} );
} );

describe( "How a feature's details came to be open", () => {
	it( 'calls a link opened straight to a feature a link', async () => {
		renderAt( '/features?feature=stats' );

		await waitFor( () =>
			expect( lastEvent( 'jetpack_myjetpack_feature_modal_view' ) ).toMatchObject( {
				trigger: 'link',
			} )
		);
	} );

	it( 'calls a feature opened from the grid a card', async () => {
		renderAt( '/features' );

		act( () => mockGrid.onOpen?.( 'stats' ) );

		await waitFor( () =>
			expect( lastEvent( 'jetpack_myjetpack_feature_modal_view' ) ).toMatchObject( {
				trigger: 'card',
				feature_slug: 'stats',
			} )
		);
	} );
} );

describe( 'A search left behind', () => {
	it( 'is still recorded when the tab is left before the term settles', async () => {
		const { unmount } = renderAt( '/features' );

		await userEvent.type( screen.getByRole( 'searchbox', { name: 'Search features' } ), 'boost' );
		unmount();

		expect( lastEvent( 'jetpack_myjetpack_features_search' ) ).toMatchObject( {
			search_term: 'boost',
		} );
	} );

	it( 'closes details left open when the tab goes, so views and closes still pair up', async () => {
		const { unmount } = renderAt( '/features?feature=stats' );

		await waitFor(
			() => expect( eventNames() ).toContain( 'jetpack_myjetpack_feature_modal_view' ),
			SETTLED
		);
		unmount();

		expect( lastEvent( 'jetpack_myjetpack_feature_modal_close' ) ).toMatchObject( {
			feature_slug: 'stats',
		} );
	} );
} );

describe( 'Which list a module was switched from', () => {
	const moduleState = () =>
		( {
			feature: { slug: 'monitor', name: 'Monitor', plans: [] },
			status: 'inactive',
			control: { kind: 'module', module: { module: 'monitor', activated: false } },
		} ) as unknown as FeatureState;

	it( 'calls a module under More Features that section, not the grid', async () => {
		renderTracked( <FeatureAction state={ moduleState() } origin="more_features" /> );

		act( () => mockModuleSwitch.onSwitch?.( true ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'activate',
			origin: 'more_features',
			feature_slug: 'monitor',
			control_kind: 'module',
		} );
	} );

	it( 'still calls the main grid the grid', async () => {
		renderTracked( <FeatureAction state={ moduleState() } /> );

		act( () => mockModuleSwitch.onSwitch?.( false ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'deactivate',
			origin: 'card',
		} );
	} );
} );

describe( "The modal's own switches", () => {
	it( 'records activating a module-backed feature from the modal', async () => {
		renderTracked(
			<FeatureModalActions
				state={ buildState( {
					kind: 'module',
					module: { module: 'stats', available: true, activated: false },
				} as unknown as FeatureState[ 'control' ] ) }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: /Activate/ } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'activate',
			origin: 'modal',
			control_kind: 'module',
		} );
		// Recording must not have replaced the switch it reports.
		expect( mockSetModuleActive ).toHaveBeenCalledWith( true );
	} );

	it( 'records deactivating a plugin-backed feature from the modal', async () => {
		renderTracked(
			<FeatureModalActions
				state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost' }, { status: 'active' } ) }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: /Deactivate/ } ) );

		expect( lastEvent( 'jetpack_myjetpack_feature_action' ) ).toMatchObject( {
			action: 'deactivate',
			origin: 'modal',
			control_kind: 'plugin',
		} );
		expect( mockRun ).toHaveBeenCalledWith( expect.objectContaining( { action: 'deactivate' } ) );
	} );
} );

describe( 'The filter in play, on every event', () => {
	it( 'is readable on the filter change itself, not only on the events around it', async () => {
		renderAt( '/features?filter=active' );

		await userEvent.click( screen.getByRole( 'button', { name: /Inactive/ } ) );

		expect( lastEvent( 'jetpack_myjetpack_features_filter_change' ) ).toMatchObject( {
			filter: 'inactive',
			previous_filter: 'active',
			current_filter: 'active',
		} );
	} );
} );
