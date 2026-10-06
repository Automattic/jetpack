/**
 * External dependencies
 */
import { withoutComparison, type ReportParams } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../../../tests/js/route-test-utils';
import { WidgetRootContext } from '../../widget-root';
import { ReportLink } from '../report-link';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

const REPORT_PARAMS: ReportParams = {
	from: '2026-03-01',
	to: '2026-03-10',
	interval: 'day',
	preset: 'last-30-days',
	comp: '1',
	compare_from: '2026-02-01',
	compare_to: '2026-02-10',
	compare_preset: 'previous-period',
	date_type: 'created',
	period: 'week',
};

const WIDGET_ROOT = {
	reportParams: withoutComparison( REPORT_PARAMS ),
	navigationParams: REPORT_PARAMS,
};

const OnDashboard = ( { children }: { children: ReactNode } ) => (
	<WidgetRootContext.Provider value={ WIDGET_ROOT }>{ children }</WidgetRootContext.Provider>
);

describe( 'ReportLink', () => {
	beforeEach( () => {
		setMockRouteSearch();
	} );

	it( 'links to the report with the dashboard navigation params', () => {
		render( <ReportLink report="posts" />, { wrapper: OnDashboard } );

		const href = screen.getByRole( 'link', { name: 'View all' } ).getAttribute( 'href' ) ?? '';
		const url = new URL( href, 'https://example.com' );

		expect( url.pathname ).toBe( '/reports/posts' );
		// Only `navigationParams` carries the comparison.
		expect( url.searchParams.get( 'comp' ) ).toBe( '1' );
	} );

	it( 'renders through the design system link so it inherits the brand tone', () => {
		render( <ReportLink report="posts" className="custom-link" />, { wrapper: OnDashboard } );

		const link = screen.getByRole( 'link', { name: 'View all' } );
		expect( link ).toHaveClass( /is-brand/ );
		expect( link ).toHaveClass( 'custom-link' );
	} );

	it( 'appends a section and renders custom visible and accessible labels', () => {
		render(
			<ReportLink
				report="posts"
				section="posts-pages"
				label="View all posts"
				ariaLabel="View the Posts and Pages report"
			/>,
			{ wrapper: OnDashboard }
		);

		const link = screen.getByRole( 'link', { name: 'View the Posts and Pages report' } );
		expect( link ).toHaveTextContent( 'View all posts' );
		expect(
			new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' ).searchParams.get(
				'section'
			)
		).toBe( 'posts-pages' );
	} );

	it( 'renders children after the label, outside the element that carries the underline', () => {
		render(
			<ReportLink report="earnings" label="Adjustments">
				<span data-testid="count">2</span>
			</ReportLink>,
			{ wrapper: OnDashboard }
		);

		const link = screen.getByRole( 'link', { name: 'Adjustments 2' } );
		const label = screen.getByText( 'Adjustments' );
		expect( link ).toContainElement( label );
		expect( label ).not.toBe( link );
		expect( label ).not.toContainElement( screen.getByTestId( 'count' ) );
	} );
} );
