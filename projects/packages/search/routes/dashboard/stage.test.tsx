import { render, screen } from '@testing-library/react';
import { stage as DashboardStage } from './stage';

jest.mock( '../../src/dashboard/components/dashboard/wrapped-dashboard', () => ( {
	__esModule: true,
	default: () => <div data-testid="search-dashboard" />,
} ) );

describe( 'dashboard stage', () => {
	it( 'renders the dashboard inside the wrapper dashboard-page.scss is scoped to', () => {
		render( <DashboardStage /> );

		// eslint-disable-next-line testing-library/no-node-access -- the id is the contract here, since dashboard-page.scss scopes its rules to it.
		const wrapper = screen.getByTestId( 'search-dashboard' ).parentElement;

		expect( wrapper?.id ).toBe( 'jp-search-dashboard' );
	} );
} );
