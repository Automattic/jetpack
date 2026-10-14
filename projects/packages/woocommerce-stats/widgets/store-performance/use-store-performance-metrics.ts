/**
 * External dependencies
 */
import { addAction } from '@wordpress/hooks';
import { useSyncExternalStore } from 'react';
/**
 * Internal dependencies
 */
import {
	STORE_PERFORMANCE_METRICS_FILTER,
	type StorePerformanceMetric,
} from '../../src/store-performance/metric';
import { getStorePerformanceMetrics } from './metrics';

const WATCHER_NAMESPACE = 'jetpack-woocommerce-stats/store-performance';

const listeners = new Set< () => void >();
let snapshot: StorePerformanceMetric[] | undefined;
let watching = false;

/**
 * Drop the cached list when the metrics filter gains or loses a registrant.
 *
 * @param {string} hookName - The hook added or removed.
 */
function onHookChange( hookName: string ) {
	if ( hookName !== STORE_PERFORMANCE_METRICS_FILTER ) {
		return;
	}
	snapshot = undefined;
	listeners.forEach( listener => listener() );
}

/**
 * Watch the metrics filter, once, and keep the listener until it unsubscribes.
 *
 * @param {Function} listener - Called when the list changes.
 * @return {Function} Unsubscribes.
 */
function subscribe( listener: () => void ) {
	if ( ! watching ) {
		watching = true;
		addAction( 'hookAdded', WATCHER_NAMESPACE, onHookChange );
		addAction( 'hookRemoved', WATCHER_NAMESPACE, onHookChange );
	}
	listeners.add( listener );

	return () => {
		listeners.delete( listener );
	};
}

/**
 * The current list, read once per change.
 *
 * @return {StorePerformanceMetric[]} The metrics.
 */
function getSnapshot() {
	if ( ! snapshot ) {
		snapshot = getStorePerformanceMetrics();
	}
	return snapshot;
}

/**
 * The metrics on offer, read again when a plugin adds or removes its filter.
 *
 * @return {StorePerformanceMetric[]} The metrics, in tab order.
 */
export function useStorePerformanceMetrics(): StorePerformanceMetric[] {
	return useSyncExternalStore( subscribe, getSnapshot );
}
