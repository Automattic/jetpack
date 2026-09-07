import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useNewsletterCategories } from '../_inc/subscribers/data/use-newsletter-categories';
import type { NewsletterCategoriesData } from '../_inc/subscribers/data/types';
import type { ReactNode } from 'react';

const mockFetch = jest.fn();

jest.mock( '../_inc/subscribers/data/api', () => ( {
	fetchNewsletterCategories: ( ...args: unknown[] ) => mockFetch( ...args ),
} ) );

const ENABLED: NewsletterCategoriesData = {
	enabled: true,
	newsletter_categories: [ { id: 7, name: 'News' } ],
};
const DISABLED: NewsletterCategoriesData = { enabled: false, newsletter_categories: [] };

/**
 * A wrapper backed by a single shared QueryClient, so unmounting and remounting the hook models
 * the Add Subscribers modal closing and reopening against the same cache.
 *
 * @return Wrapper component plus the shared client.
 */
function makeWrapper() {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	return { wrapper, queryClient };
}

beforeEach( () => {
	mockFetch.mockReset();
} );

describe( 'useNewsletterCategories', () => {
	it( 'refetches on remount so a settings-tab feature toggle is reflected the next time the modal opens', async () => {
		// The feature toggle lives on a separate surface that never invalidates this query, so the
		// picker can only pick up the change by refetching when the modal reopens (a fresh mount).
		const { wrapper } = makeWrapper();

		mockFetch.mockResolvedValueOnce( ENABLED );
		const { result: firstResult, unmount } = renderHook( () => useNewsletterCategories(), {
			wrapper,
		} );
		await waitFor( () => expect( firstResult.current.data?.enabled ).toBe( true ) );

		// User closes the modal, then disables newsletter categories on the Settings tab.
		unmount();
		mockFetch.mockResolvedValueOnce( DISABLED );

		// Reopening the modal must surface the now-disabled feature, not the cached enabled state.
		const { result: secondResult } = renderHook( () => useNewsletterCategories(), { wrapper } );
		await waitFor( () => expect( secondResult.current.data?.enabled ).toBe( false ) );
		expect( mockFetch ).toHaveBeenCalledTimes( 2 );
	} );
} );
