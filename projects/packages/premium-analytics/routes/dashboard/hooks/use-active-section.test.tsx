/* eslint-disable import/no-extraneous-dependencies */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useActiveSection } from './use-active-section';
import type { DashboardSection } from '../config';

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useStagedSearch: jest.fn(),
} ) );

const mockUseStagedSearch = useStagedSearch as jest.MockedFunction< typeof useStagedSearch >;

const stage = jest.fn();
const commit = jest.fn();

const sections: DashboardSection[] = [
	{
		id: 'analytics/traffic',
		label: 'Traffic',
		order: 10,
		layout: [],
		hasCustomLayout: false,
	},
	{
		id: 'analytics/subscribers',
		label: 'Subscribers',
		order: 30,
		layout: [],
		hasCustomLayout: false,
	},
];

beforeEach( () => {
	stage.mockClear();
	commit.mockClear();
	mockUseStagedSearch.mockReset();
	mockUseStagedSearch.mockReturnValue( {
		committed: {},
		staged: {},
		effective: {},
		isSyncing: false,
		isDirty: false,
		stage,
		commit,
		revert: jest.fn(),
		cancelAutoCommit: jest.fn(),
	} );
} );

describe( 'useActiveSection', () => {
	it( 'uses the first REST-provided section when the URL has no section param', () => {
		const { result } = renderHook( () => useActiveSection( sections ) );

		expect( result.current[ 0 ] ).toBe( 'analytics/traffic' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'uses the URL section when it is available', () => {
		mockUseStagedSearch.mockReturnValue( {
			committed: { section: 'analytics/subscribers' },
			staged: { section: 'analytics/subscribers' },
			effective: { section: 'analytics/subscribers' },
			isSyncing: false,
			isDirty: false,
			stage,
			commit,
			revert: jest.fn(),
			cancelAutoCommit: jest.fn(),
		} );

		const { result } = renderHook( () => useActiveSection( sections ) );

		expect( result.current[ 0 ] ).toBe( 'analytics/subscribers' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'replaces unavailable URL sections with the default section', async () => {
		mockUseStagedSearch.mockReturnValue( {
			committed: { section: 'woocommerce/store' },
			staged: { section: 'woocommerce/store' },
			effective: { section: 'woocommerce/store' },
			isSyncing: false,
			isDirty: false,
			stage,
			commit,
			revert: jest.fn(),
			cancelAutoCommit: jest.fn(),
		} );

		const { result } = renderHook( () => useActiveSection( sections ) );

		expect( result.current[ 0 ] ).toBe( 'analytics/traffic' );
		await waitFor( () => expect( stage ).toHaveBeenCalledWith( { section: 'analytics/traffic' } ) );
		expect( commit ).toHaveBeenCalledWith( { replace: true } );
	} );

	it( 'commits explicit section changes as browser-history entries', () => {
		const { result } = renderHook( () => useActiveSection( sections ) );

		act( () => {
			result.current[ 1 ]( 'analytics/subscribers' );
		} );

		expect( stage ).toHaveBeenCalledWith( { section: 'analytics/subscribers' } );
		expect( commit ).toHaveBeenCalledWith( { replace: false } );
	} );
} );
