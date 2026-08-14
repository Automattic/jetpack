/**
 * External dependencies
 */
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './widget-skeleton.module.scss';
import type { ReactNode } from 'react';

export interface SkeletonRootProps {
	children: ReactNode;
}

/**
 * Deliberately no `aria-busy`: on a live region it means "hold updates until I
 * say otherwise", and this node is unmounted the moment the data lands, so it
 * would never say otherwise — the announcement it exists to make could be held
 * forever. Marking the region that is actually being updated is `WidgetState`'s
 * job, on a wrapper that outlives the fetch.
 */
export function SkeletonRoot( { children }: SkeletonRootProps ) {
	return (
		<div role="status" className={ styles.root }>
			<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
			{ children }
		</div>
	);
}
