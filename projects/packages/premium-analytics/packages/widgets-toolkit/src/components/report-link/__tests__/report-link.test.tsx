/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../widget-root';
import { ReportLink } from '../report-link';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, params, search, children, ...props }: MockRouteLinkProps ) => {
		const path = Object.entries( params ?? {} ).reduce(
			( result, [ key, value ] ) => result.replace( `$${ key }`, String( value ) ),
			to
		);
		const query = new URLSearchParams();
		Object.entries( search ?? {} ).forEach( ( [ key, value ] ) => {
			if ( value !== undefined && value !== null ) {
				query.set( key, String( value ) );
			}
		} );
		const queryString = query.toString();

		return (
			<a href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
				{ children }
			</a>
		);
	},
} ) );

jest.mock( '../../widget-root', () => ( {
	useWidgetRootContext: jest.fn(),
} ) );

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

const mockUseWidgetRootContext = jest.mocked( useWidgetRootContext );

describe( 'ReportLink', () => {
	beforeEach( () => {
		mockUseWidgetRootContext.mockReturnValue( { reportParams: REPORT_PARAMS } );
	} );

	it( 'links to the report with shared date params and no page-owned params', () => {
		render( <ReportLink report="posts" /> );

		const link = screen.getByRole( 'link', { name: 'See report' } );
		const href = link.getAttribute( 'href' ) ?? '';
		const search = new URL( href, 'https://example.com' ).searchParams;

		expect( href ).toContain( '/reports/posts?' );
		expect( search.get( 'from' ) ).toBe( '2026-03-01' );
		expect( search.get( 'to' ) ).toBe( '2026-03-10' );
		expect( search.get( 'interval' ) ).toBe( 'day' );
		expect( search.get( 'preset' ) ).toBe( 'last-30-days' );
		expect( search.get( 'comp' ) ).toBe( '1' );
		expect( search.get( 'compare_from' ) ).toBe( '2026-02-01' );
		expect( search.get( 'compare_to' ) ).toBe( '2026-02-10' );
		expect( search.get( 'compare_preset' ) ).toBe( 'previous-period' );
		expect( search.get( 'date_type' ) ).toBe( 'created' );
		expect( search.has( 'period' ) ).toBe( false );
		expect( search.has( 'section' ) ).toBe( false );
	} );

	it( 'appends a section and renders custom visible and accessible labels', () => {
		render(
			<ReportLink
				report="posts"
				section="posts-pages"
				label="View all posts"
				ariaLabel="View the Posts and Pages report"
			/>
		);

		const link = screen.getByRole( 'link', { name: 'View the Posts and Pages report' } );
		expect( link ).toHaveTextContent( 'View all posts' );
		expect(
			new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' ).searchParams.get(
				'section'
			)
		).toBe( 'posts-pages' );
	} );
} );
