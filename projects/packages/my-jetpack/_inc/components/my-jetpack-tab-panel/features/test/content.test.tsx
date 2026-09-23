import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { FeaturesContent } from '../content';
import type { FeatureState } from '../feature-state';

const activeStats = {
	feature: { slug: 'stats', name: 'Stats', description: '', plans: [] },
	status: 'active',
	control: { kind: 'none' },
} as unknown as FeatureState;

let mockStates: FeatureState[] = [ activeStats ];
let mockMainFeatures: Record< string, unknown > = {
	features: [ { slug: 'stats' } ],
	isPlaceholderData: false,
};

jest.mock( '../use-main-features', () => ( { useMainFeatures: () => mockMainFeatures } ) );

jest.mock( '../feature-state', () => ( {
	useFeatureStates: () => ( { states: mockStates, isLoading: false } ),
} ) );

jest.mock( '../feature-item', () => ( { FeatureItem: () => <div>grid card</div> } ) );
jest.mock( '../feature-list', () => ( { FeatureList: () => <div>list rows</div> } ) );
jest.mock( '../feature-modal', () => ( { FeatureModal: () => null } ) );

const renderAt = ( url: string ) =>
	render(
		<MemoryRouter initialEntries={ [ url ] }>
			<FeaturesContent />
		</MemoryRouter>
	);

describe( 'FeaturesContent', () => {
	beforeEach( () => {
		mockStates = [ activeStats ];
		mockMainFeatures = { features: [ { slug: 'stats' } ], isPlaceholderData: false };
	} );

	it( 'names the filter that matched nothing and switches back from the empty state', async () => {
		renderAt( '/features?filter=inactive' );

		expect( screen.getByRole( 'heading', { name: 'Everything is turned on.' } ) ).toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'View active features' } ) );

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
} );
