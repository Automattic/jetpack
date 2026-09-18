/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { useWidgetNavigationSearch } from '../use-widget-navigation-search';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '../../components/widget-root', () => ( {
	useWidgetRootContext: jest.fn(),
} ) );

const mockUseWidgetRootContext = jest.mocked( useWidgetRootContext );

const NAVIGATION_PARAMS = {
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
	post_id: '12',
} as unknown as ReportParams;

describe( 'useWidgetNavigationSearch', () => {
	beforeEach( () => {
		mockUseWidgetRootContext.mockReturnValue( {
			reportParams: {
				from: '2026-03-01',
				to: '2026-03-10',
				interval: 'day',
			} as unknown as ReportParams,
			navigationParams: NAVIGATION_PARAMS,
		} );
	} );

	it( 'carries the shared report window and drops page-owned params', () => {
		const { result } = renderHook( () => useWidgetNavigationSearch() );

		expect( result.current ).toEqual( {
			from: '2026-03-01',
			to: '2026-03-10',
			interval: 'day',
			preset: 'last-30-days',
			comp: '1',
			compare_from: '2026-02-01',
			compare_to: '2026-02-10',
			compare_preset: 'previous-period',
			date_type: 'created',
		} );
	} );

	it( 'adds a destination section without inventing a report origin', () => {
		const { result } = renderHook( () => useWidgetNavigationSearch( { section: 'posts-pages' } ) );

		expect( result.current.section ).toBe( 'posts-pages' );
		expect( result.current ).not.toHaveProperty( 'ref' );
		expect( result.current ).not.toHaveProperty( 'ref_section' );
	} );

	it( 'names the report origin without treating it as a destination section', () => {
		const { result } = renderHook( () =>
			useWidgetNavigationSearch( {
				origin: { report: 'posts', section: 'posts-pages' },
			} )
		);

		expect( result.current.ref ).toBe( 'posts' );
		expect( result.current.ref_section ).toBe( 'posts-pages' );
		expect( result.current ).not.toHaveProperty( 'section' );
	} );

	it( 'keeps a destination tab and a report origin as separate params', () => {
		const { result } = renderHook( () =>
			useWidgetNavigationSearch( {
				section: 'email-opens',
				origin: { report: 'emails' },
			} )
		);

		expect( result.current.section ).toBe( 'email-opens' );
		expect( result.current.ref ).toBe( 'emails' );
		expect( result.current ).not.toHaveProperty( 'ref_section' );
	} );
} );
