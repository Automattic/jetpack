import { useSyncExternalStore } from '@wordpress/element';
import { generateMockStats } from '../fixtures/stats';
import type {
	ActiveMetric,
	ChartCompare,
	DateRange,
	Granularity,
	OverviewStats,
} from '../types/stats';

const MOCK_INITIAL_LOAD_MS = 1_000;

type Settings = {
	dateRange: DateRange;
	granularity: Granularity;
	activeMetric: ActiveMetric;
	compare: ChartCompare;
};

type GlobalStore = {
	settings: Settings;
	stats: OverviewStats;
	isLoading: boolean;
	subscribers: Set< () => void >;
	initialLoadTimerScheduled: boolean;
};

declare global {
	interface Window {
		__jetpackVideopressMockStats?: GlobalStore;
	}
}

const STORE_KEY = '__jetpackVideopressMockStats' as const;

const DEFAULT_SETTINGS: Settings = {
	dateRange: 'last_30_days',
	granularity: 'days',
	activeMetric: 'views',
	compare: 'secondary_and_previous_period',
};

// Watch Time has no other metric to compare against (different unit),
// so any compare that depends on a "secondary" metric collapses to
// `previous_period` when Watch Time becomes active.
const COMPARE_FALLBACK_FOR_WATCH_TIME: ChartCompare = 'previous_period';

/**
 * Lazily creates and returns the window-attached singleton stats
 * store. Mirrors useMockLibrary's pattern (see use-mock-library.ts:79
 * for the rationale: each lazy-loaded route bundle ships its own copy
 * of this module).
 *
 * @return The singleton store.
 */
function getStore(): GlobalStore {
	if ( ! window[ STORE_KEY ] ) {
		const settings = DEFAULT_SETTINGS;
		window[ STORE_KEY ] = {
			settings,
			stats: generateMockStats( settings.dateRange, settings.granularity ),
			isLoading: true,
			subscribers: new Set(),
			initialLoadTimerScheduled: false,
		};
	}
	return window[ STORE_KEY ];
}

/**
 * Schedules the one-time initial-load delay (sets `isLoading` to false
 * after MOCK_INITIAL_LOAD_MS). Idempotent — safe to call from every
 * `useMockStats` mount.
 */
function ensureInitialLoadTimer(): void {
	const store = getStore();
	if ( store.initialLoadTimerScheduled ) {
		return;
	}
	store.initialLoadTimerScheduled = true;
	setTimeout( () => {
		store.isLoading = false;
		store.subscribers.forEach( fn => fn() );
	}, MOCK_INITIAL_LOAD_MS );
}

/**
 * Notifies every store subscriber that state has changed.
 */
function notify(): void {
	getStore().subscribers.forEach( fn => fn() );
}

/**
 * Merges a partial settings update into the store, recomputes derived
 * stats, and notifies subscribers.
 *
 * @param partial - Settings keys to update; unspecified keys keep their
 *                current values.
 */
function applySettings( partial: Partial< Settings > ): void {
	const store = getStore();
	const next = { ...store.settings, ...partial };
	store.settings = next;
	store.stats = generateMockStats( next.dateRange, next.granularity );
	notify();
}

const setDateRange = ( next: DateRange ): void => applySettings( { dateRange: next } );
const setGranularity = ( next: Granularity ): void => applySettings( { granularity: next } );
const setCompare = ( next: ChartCompare ): void => applySettings( { compare: next } );

const setActiveMetric = ( next: ActiveMetric ): void => {
	const store = getStore();
	const compare =
		next === 'watch_time' && store.settings.compare !== 'previous_period'
			? COMPARE_FALLBACK_FOR_WATCH_TIME
			: store.settings.compare;
	applySettings( { activeMetric: next, compare } );
};

const subscribe = ( cb: () => void ): ( () => void ) => {
	const store = getStore();
	store.subscribers.add( cb );
	return () => {
		store.subscribers.delete( cb );
	};
};

const getStatsSnapshot = (): OverviewStats => getStore().stats;
const getSettingsSnapshot = (): Settings => getStore().settings;
const getIsLoadingSnapshot = (): boolean => getStore().isLoading;

/**
 * Mock-data hook for the Overview tab. Subscribes to a window-attached
 * singleton store via useSyncExternalStore. Hook signature matches the
 * TanStack Query hook Phase 6 will swap in.
 *
 * @return Stats state and setters.
 */
export function useMockStats() {
	ensureInitialLoadTimer();
	const stats = useSyncExternalStore( subscribe, getStatsSnapshot );
	const settings = useSyncExternalStore( subscribe, getSettingsSnapshot );
	const isLoading = useSyncExternalStore( subscribe, getIsLoadingSnapshot );
	return {
		stats,
		isLoading,
		dateRange: settings.dateRange,
		granularity: settings.granularity,
		activeMetric: settings.activeMetric,
		compare: settings.compare,
		setDateRange,
		setGranularity,
		setActiveMetric,
		setCompare,
	};
}

export type UseMockStats = ReturnType< typeof useMockStats >;
