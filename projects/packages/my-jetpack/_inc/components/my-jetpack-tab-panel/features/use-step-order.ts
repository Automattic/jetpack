import { useRef } from 'react';
import type { FeatureState } from './feature-state';

type StepOrder = { key: string; features: MainFeature[] };

/**
 * The features the modal steps through: what the grid showed when it opened.
 *
 * Held while the modal stays open, so switching a feature a status filter then hides
 * does not strand the modal without neighbors. A new filter or search takes a fresh copy.
 *
 * @param visible  - The features the grid shows now.
 * @param openSlug - The feature the modal shows, or null while it is closed.
 * @param key      - Changes whenever the filter or search does.
 * @return The features to step through, in grid order.
 */
export function useStepOrder(
	visible: FeatureState[],
	openSlug: string | null,
	key: string
): MainFeature[] {
	const orderRef = useRef< StepOrder | null >( null );
	const current = orderRef.current;
	const isStale =
		! current ||
		current.key !== key ||
		// Opened before the catalog arrived: take the order once the feature shows up.
		( ! current.features.some( feature => feature.slug === openSlug ) &&
			visible.some( state => state.feature.slug === openSlug ) );

	if ( ! openSlug ) {
		orderRef.current = null;
	} else if ( isStale ) {
		orderRef.current = { key, features: visible.map( state => state.feature ) };
	}

	return orderRef.current?.features ?? [];
}
