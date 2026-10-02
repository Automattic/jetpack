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
 * Not a live region: a `role="status"` mounting with its text already in place is
 * announced inconsistently at best, so the label only serves a reader who lands on it.
 */
export function SkeletonRoot( { children }: SkeletonRootProps ) {
	return (
		<div className={ styles.root } data-testid="widget-skeleton">
			<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
			{ children }
		</div>
	);
}
