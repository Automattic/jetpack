/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalText as Text, __experimentalVStack as VStack } from '@wordpress/components';
import type { FC, ReactNode } from 'react';

interface EmptyStateProps {
	heading: string;
	body?: string | ReactNode;
	actions?: ReactNode;
}

/**
 * Centered DataViews empty state, mirroring Forms' `EmptyWrapper`
 * (`projects/packages/forms/src/dashboard/components/empty-responses/index.tsx`)
 * so the Scan overview reads as the same empty pattern users already see in
 * the Jetpack Forms inbox: heading + muted body + optional CTA.
 *
 * Forwarded to the underlying `DataViews` via the `empty` prop on
 * `ThreatsDataViews`.
 *
 * @param root0         - Component props.
 * @param root0.heading - Title line (e.g. "No active threats detected").
 * @param root0.body    - Muted body copy.
 * @param root0.actions - Optional CTA slot.
 * @return The empty state node.
 */
const EmptyState: FC< EmptyStateProps > = ( { heading, body, actions } ) => (
	<VStack alignment="center" spacing="2">
		<Text as="h3" weight="500" size="15">
			{ heading }
		</Text>
		{ body && <Text variant="muted">{ body }</Text> }
		{ actions && <span style={ { marginBlockStart: '16px' } }>{ actions }</span> }
	</VStack>
);

export default EmptyState;
