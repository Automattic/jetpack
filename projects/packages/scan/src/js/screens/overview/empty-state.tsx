import { EmptyState as UIEmptyState } from '@wordpress/ui';
import type { FC, ReactNode } from 'react';

interface EmptyStateProps {
	heading: string;
	body?: string | ReactNode;
	actions?: ReactNode;
}

/**
 * Centered DataViews empty state built on `@wordpress/ui`'s `EmptyState`
 * primitive so the heading renders as a real `<h2>` and the body as a
 * `<p>` (correct semantics for screen readers + page outline).
 *
 * Forwarded to the underlying `DataViews` via the `empty` prop on
 * `ThreatsDataViews`.
 *
 * @param root0         - Component props.
 * @param root0.heading - Title line (e.g. "No active threats detected").
 * @param root0.body    - Body copy.
 * @param root0.actions - Optional CTA slot.
 * @return The empty state node.
 */
const EmptyState: FC< EmptyStateProps > = ( { heading, body, actions } ) => (
	<UIEmptyState.Root>
		<UIEmptyState.Title>{ heading }</UIEmptyState.Title>
		{ body && <UIEmptyState.Description>{ body }</UIEmptyState.Description> }
		{ actions && <UIEmptyState.Actions>{ actions }</UIEmptyState.Actions> }
	</UIEmptyState.Root>
);

export default EmptyState;
