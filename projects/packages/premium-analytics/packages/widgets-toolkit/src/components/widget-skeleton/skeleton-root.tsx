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
 * Deliberately no `aria-busy`: it means "hold updates" on a live region, but
 * this node unmounts the moment data lands and would never say otherwise.
 * `WidgetState`, which outlives the fetch, owns marking the region as busy.
 */
export function SkeletonRoot( { children }: SkeletonRootProps ) {
	return (
		<div role="status" className={ styles.root }>
			<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
			{ children }
		</div>
	);
}
