import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// True-ESM Jest (`--experimental-vm-modules`): register mocks with
// `jest.unstable_mockModule`, then import the component under test dynamically.
// Stub the chrome and the empty state so this is a focused unit test of the
// wrapper's wiring (which tab it reports, that it hides the tabs and centers the
// enable prompt).
const DashboardPage = jest.fn(
	( {
		active,
		showTabs,
		centered,
		children,
	}: {
		active: string;
		showTabs?: boolean;
		centered?: boolean;
		children: ReactNode;
	} ) => (
		<div
			data-testid="dashboard-page"
			data-active={ active }
			data-show-tabs={ String( showTabs ?? true ) }
			data-centered={ String( centered ?? false ) }
		>
			{ children }
		</div>
	)
);
const EnableSeoEmptyState = jest.fn( ( { screen: tab }: { screen: string } ) => (
	<div data-testid="enable-seo-empty-state" data-screen={ tab } />
) );
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '../../dashboard/dashboard-page', () => ( {
	default: DashboardPage,
} ) );
jest.unstable_mockModule( '../../data/is-gated', () => ( {
	isGated,
} ) );
jest.unstable_mockModule( '../enable-seo-empty-state', () => ( {
	default: EnableSeoEmptyState,
} ) );

const { default: SeoDisabledStage } = await import( '../seo-disabled-stage' );

describe( 'SeoDisabledStage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		isGated.mockReturnValue( false );
	} );

	it( 'renders the enable prompt inside the dashboard chrome', () => {
		render( <SeoDisabledStage active="settings" /> );

		expect( screen.getByTestId( 'enable-seo-empty-state' ) ).toBeInTheDocument();
	} );

	it( 'hides the tabs and centers the prompt', () => {
		render( <SeoDisabledStage active="settings" /> );

		const page = screen.getByTestId( 'dashboard-page' );
		expect( page ).toHaveAttribute( 'data-show-tabs', 'false' );
		expect( page ).toHaveAttribute( 'data-centered', 'true' );
	} );

	// Gated sites keep their Overview with the module off, so Settings must keep a
	// way back to it.
	it( 'keeps the tabs on plan-gated sites', () => {
		isGated.mockReturnValue( true );

		render( <SeoDisabledStage active="settings" /> );

		const page = screen.getByTestId( 'dashboard-page' );
		expect( page ).toHaveAttribute( 'data-show-tabs', 'true' );
		expect( page ).toHaveAttribute( 'data-centered', 'true' );
	} );

	it( 'reports the tab it is given', () => {
		render( <SeoDisabledStage active="content" /> );

		expect( screen.getByTestId( 'dashboard-page' ) ).toHaveAttribute( 'data-active', 'content' );
		expect( screen.getByTestId( 'enable-seo-empty-state' ) ).toHaveAttribute(
			'data-screen',
			'content'
		);
	} );
} );
