import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
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

jest.mock( '../use-main-features', () => ( { useMainFeatures: () => mockMainFeatures } ) );

jest.mock( '../feature-state', () => ( {
	useFeatureStates: () => ( { states: mockStates, isLoading: false } ),
} ) );

jest.mock( '../feature-item', () => ( { FeatureItem: () => <div>grid card</div> } ) );
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

const renderAt = ( url: string ) =>
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<MemoryRouter initialEntries={ [ url ] }>
				<FeaturesContent />
			</MemoryRouter>
		</QueryClientProvider>
	);

describe( 'FeaturesContent', () => {
	beforeEach( () => {
		mockStates = [ activeStats ];
		mockGroups = [];
		mockMainFeatures = {
			jetpack: 'active',
			features: [ { slug: 'stats' } ],
			isPlaceholderData: false,
		};
	} );

	it( 'names the filter that matched nothing and switches back from the empty state', async () => {
		renderAt( '/features?filter=inactive' );

		expect( screen.getByRole( 'heading', { name: 'Everything is turned on.' } ) ).toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Explore all' } ) );

		expect( screen.getByText( 'grid card' ) ).toBeInTheDocument();
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

	it( 'still answers a search that matched nothing while modules are in flight', () => {
		mockStates = [ { ...activeStats, pending: true, status: 'inactive' } as FeatureState ];

		renderAt( '/features?search=zzzz' );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features match “zzzz”.' );
	} );

	it( 'reports an empty catalog as a failure rather than a site with no features', () => {
		mockStates = [];
		mockMainFeatures = { features: [], isPlaceholderData: false };

		renderAt( '/features' );

		expect(
			screen.getByRole( 'heading', { name: 'We couldn’t load your features.' } )
		).toBeVisible();
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
} );
