import { render, screen, within } from '@testing-library/react';
import { stage as Settings } from '../stage';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	DashboardSectionProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	StatsOptionsMenu: ( { withPromo = true }: { withPromo?: boolean } ) => (
		<div data-testid="stats-options-menu" data-with-promo={ String( withPromo ) } />
	),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( { StatsBreadcrumbs: () => null } ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<div>
			<div data-testid="page-actions">{ actions }</div>
			{ children }
		</div>
	),
} ) );

jest.mock( '../components', () => ( {
	StatsSettingsPanel: () => <div data-testid="settings-panel" />,
} ) );

describe( 'Settings route', () => {
	it( 'leaves the promo to the settings panel, so the options menu offers none', () => {
		render( <Settings /> );

		expect( screen.getByTestId( 'settings-panel' ) ).toBeInTheDocument();
		expect(
			within( screen.getByTestId( 'page-actions' ) ).getByTestId( 'stats-options-menu' )
		).toHaveAttribute( 'data-with-promo', 'false' );
	} );
} );
