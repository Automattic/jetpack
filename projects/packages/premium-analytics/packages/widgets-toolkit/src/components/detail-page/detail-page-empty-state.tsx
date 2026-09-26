/**
 * External dependencies
 */
import { EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { search } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import styles from './detail-page-empty-state.module.scss';
import type { ReactNode } from 'react';

export interface DetailPageEmptyStateProps {
	title: string;
	description?: string;
	/** Buttons or links under the description. */
	actions?: ReactNode;
}

/**
 * Stand in for a detail page's header and widgets when a whole tab has nothing to report, centred in the space `DetailPageLayout` leaves below its tabs.
 *
 * @param {DetailPageEmptyStateProps} props - The component props.
 * @return The detail page empty state.
 */
export function DetailPageEmptyState( { title, description, actions }: DetailPageEmptyStateProps ) {
	return (
		<EmptyState.Root className={ styles.root }>
			<EmptyState.Visual>
				<Icon icon={ search } size={ 48 } />
			</EmptyState.Visual>
			<EmptyState.Title>{ title }</EmptyState.Title>
			{ description && <EmptyState.Description>{ description }</EmptyState.Description> }
			{ actions && <EmptyState.Actions>{ actions }</EmptyState.Actions> }
		</EmptyState.Root>
	);
}
