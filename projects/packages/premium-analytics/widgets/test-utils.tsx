/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export { mockWordPressRoute } from '../tests/js/route-test-utils';

/** Shared renderHook wrapper using the application's query client. */
export function queryClientWrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}
