import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { FeaturesContent } from '../content';
import type { FeatureState } from '../feature-state';

const mockStates = [
	{
		feature: { slug: 'stats', name: 'Stats', description: '', plans: [] },
		status: 'active',
		control: { kind: 'none' },
	},
] as unknown as FeatureState[];

jest.mock( '../use-main-features', () => ( { useMainFeatures: () => ( {} ) } ) );

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
