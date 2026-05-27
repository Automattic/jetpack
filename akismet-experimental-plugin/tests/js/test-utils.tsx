import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Build a TanStack QueryClient tuned for tests — no retries, no caching, no
 * background timing concerns. Each test should call this fresh to guarantee no
 * cache bleed between tests.
 *
 * See `akismet-modernization/react-query-conventions.md` §11.
 *
 * @return Test-tuned QueryClient.
 */
export function createTestQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
			},
			mutations: { retry: false },
		},
	} );
}

/**
 * Render a tree wrapped in a fresh QueryClientProvider. Returns the rendered
 * harness plus the client so the test can inspect cache state if needed.
 *
 * @param ui      - Element to render.
 * @param options - Extra options passed through to RTL's `render`.
 * @return `{ client, ...renderResult }`.
 */
export function renderWithClient( ui: ReactElement, options?: RenderOptions ) {
	const client = createTestQueryClient();
	return {
		client,
		...render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider>, options ),
	};
}
