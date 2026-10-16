/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { render } from '@testing-library/react';
import { Breadcrumbs } from '@wordpress/admin-ui';
/**
 * Internal dependencies
 */
import { StatsBreadcrumbs } from '../stats-breadcrumbs';

// Test the items this component owns without requiring a router for `Breadcrumbs`.
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: jest.fn( () => null ),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: jest.fn(),
} ) );

const mockBreadcrumbs = jest.mocked( Breadcrumbs );
const mockUseDashboardLink = jest.mocked( useDashboardLink );

const DASHBOARD_LINK = '/?from=2026-03-01&to=2026-03-10';

const renderedItems = () => mockBreadcrumbs.mock.calls[ 0 ][ 0 ].items;

describe( 'StatsBreadcrumbs', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseDashboardLink.mockReturnValue( DASHBOARD_LINK );
	} );

	it( 'leaves the dashboard crumb unlinked on the dashboard, so it renders as the page heading', () => {
		render( <StatsBreadcrumbs isRoot /> );

		expect( renderedItems() ).toEqual( [ { label: 'Stats' } ] );
	} );

	it( 'keeps the dashboard crumb linked while a child crumb is unresolved', () => {
		render( <StatsBreadcrumbs /> );

		expect( renderedItems() ).toEqual( [ { label: 'Stats', to: DASHBOARD_LINK } ] );
	} );

	it( 'links the dashboard crumb back to the dashboard from a report page', () => {
		render( <StatsBreadcrumbs items={ [ { label: 'Tags & categories' } ] } /> );

		expect( renderedItems() ).toEqual( [
			{ label: 'Stats', to: DASHBOARD_LINK },
			{ label: 'Tags & categories' },
		] );
	} );

	it( 'keeps deeper crumbs in order below the dashboard', () => {
		render(
			<StatsBreadcrumbs
				items={ [ { label: 'Videos', to: '/reports/videos' }, { label: 'A video' } ] }
			/>
		);

		expect( renderedItems() ).toEqual( [
			{ label: 'Stats', to: DASHBOARD_LINK },
			{ label: 'Videos', to: '/reports/videos' },
			{ label: 'A video' },
		] );
	} );
} );
