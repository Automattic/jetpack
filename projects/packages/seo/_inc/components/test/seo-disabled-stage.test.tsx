import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// True-ESM Jest (`--experimental-vm-modules`): register mocks with
// `jest.unstable_mockModule`, then import the component under test dynamically.
// Stub the chrome and the enable card so this is a focused unit test of the
// wrapper's wiring (which tab it activates, that it renders the enable card).
const DashboardPage = jest.fn(
	( { active, children }: { active: string; children: ReactNode } ) => (
		<div data-testid="dashboard-page" data-active={ active }>
			{ children }
		</div>
	)
);

jest.unstable_mockModule( '../../dashboard/dashboard-page', () => ( {
	default: DashboardPage,
} ) );
jest.unstable_mockModule( '../enable-seo-card', () => ( {
	default: () => <div data-testid="enable-seo-card" />,
} ) );

const { default: SeoDisabledStage } = await import( '../seo-disabled-stage' );

describe( 'SeoDisabledStage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the enable card inside the dashboard chrome', () => {
		render( <SeoDisabledStage active="settings" /> );

		expect( screen.getByTestId( 'enable-seo-card' ) ).toBeInTheDocument();
	} );

	it( 'activates the tab it is given', () => {
		render( <SeoDisabledStage active="content" /> );

		expect( screen.getByTestId( 'dashboard-page' ) ).toHaveAttribute( 'data-active', 'content' );
	} );
} );
