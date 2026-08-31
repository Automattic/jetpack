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
 * Deliberately not a live region: a `role="status"` mounting with its text already
 * in place is never announced, so the one it carried was inert. The hidden label
 * stays for a reader who navigates onto the widget; `WidgetState` owns `aria-busy`.
 */
export function SkeletonRoot( { children }: SkeletonRootProps ) {
	return (
		<div className={ styles.root } data-testid="widget-skeleton">
			<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
			{ children }
		</div>
	);
}
