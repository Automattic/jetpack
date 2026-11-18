/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useStatsBreadcrumbs } from '../use-stats-breadcrumbs';

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: jest.fn(),
} ) );

const mockUseDashboardLink = jest.mocked( useDashboardLink );

const DASHBOARD_LINK = '/?from=2026-03-01&to=2026-03-10';

const breadcrumbsFor = ( options?: Parameters< typeof useStatsBreadcrumbs >[ 0 ] ) =>
	renderHook( () => useStatsBreadcrumbs( options ) ).result.current.breadcrumbs;

describe( 'useStatsBreadcrumbs', () => {
	beforeEach( () => {
		mockUseDashboardLink.mockReturnValue( DASHBOARD_LINK );
	} );

	it.each( [
		[
			'leaves the dashboard crumb unlinked on the dashboard',
			{ isRoot: true },
			[ { label: 'Stats' } ],
		],
		[
			'keeps the dashboard crumb linked while a child crumb is unresolved',
			undefined,
			[ { label: 'Stats', href: DASHBOARD_LINK } ],
		],
		[
			'links the dashboard crumb back to the dashboard from a report page',
			{ items: [ { label: 'Tags & categories' } ] },
			[ { label: 'Stats', href: DASHBOARD_LINK }, { label: 'Tags & categories' } ],
		],
		[
			'keeps deeper crumbs in order below the dashboard',
			{ items: [ { label: 'Videos', href: '/reports/videos' }, { label: 'A video' } ] },
			[
				{ label: 'Stats', href: DASHBOARD_LINK },
				{ label: 'Videos', href: '/reports/videos' },
				{ label: 'A video' },
			],
		],
	] )( '%s', ( _name, options, expected ) => {
		expect( breadcrumbsFor( options ) ).toEqual( expected );
	} );
} );
