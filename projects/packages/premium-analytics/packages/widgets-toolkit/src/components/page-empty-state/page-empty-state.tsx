/**
 * External dependencies
 */
import { EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { search } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import styles from './page-empty-state.module.scss';
import type { ReactNode } from 'react';

export interface PageEmptyStateProps {
	title: string;
	description?: string;
	/** Buttons or links under the description. */
	actions?: ReactNode;
}

/**
 * Stand in for a report's or a detail page's sections when there is nothing to show, centred in the space the page layout leaves below its header.
 *
 * @param {PageEmptyStateProps} props - The component props.
 * @return The page empty state.
 */
export function PageEmptyState( { title, description, actions }: PageEmptyStateProps ) {
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
