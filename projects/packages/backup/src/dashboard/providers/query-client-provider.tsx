import { QueryClientProvider as TanStackProvider } from '@tanstack/react-query';
import { queryClient } from '../data/query-client';
import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

/**
 * Wraps children in TanStack's `<QueryClientProvider>` with the
 * dashboard's shared singleton client.
 *
 * @param props          - Component props.
 * @param props.children - Children to wrap.
 * @return The provider tree.
 */
export default function QueryClientProvider( { children }: Props ) {
	return <TanStackProvider client={ queryClient }>{ children }</TanStackProvider>;
}
