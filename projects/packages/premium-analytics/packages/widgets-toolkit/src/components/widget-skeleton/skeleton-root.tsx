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

export function SkeletonRoot( { children }: SkeletonRootProps ) {
	return (
		<div role="status" aria-busy="true" className={ styles.root }>
			<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
			{ children }
		</div>
	);
}
