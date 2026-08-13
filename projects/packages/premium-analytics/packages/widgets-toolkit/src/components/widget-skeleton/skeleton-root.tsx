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
	/** The shape's placeholder elements. */
	children: ReactNode;
}

/**
 * Accessibility and layout wrapper shared by every widget skeleton shape.
 *
 * `VisuallyHidden` renders a real element, so shapes must not index
 * `SkeletonRoot`'s direct children with `:nth-child()` — a repeated sequence
 * belongs in its own wrapper.
 *
 * @param props          - Component props.
 * @param props.children - The shape's placeholder elements.
 * @return The rendered loading region.
 */
export function SkeletonRoot( { children }: SkeletonRootProps ) {
	// `role="status"` already implies `aria-live="polite"`. On a refetch the
	// caller hides this region from assistive tech entirely — see `WidgetState`.
	return (
		<div role="status" aria-busy="true" className={ styles.root }>
			<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
			{ children }
		</div>
	);
}
