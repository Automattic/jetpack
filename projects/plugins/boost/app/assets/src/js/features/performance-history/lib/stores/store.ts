import { jetpack_boost_ds } from '$lib/stores/data-sync-client';
import { z } from 'zod';

const performanceHistoryToggle = jetpack_boost_ds.createAsyncStore(
	'performance_history_toggle',
	z.boolean()
);

export const showPerformanceHistory = performanceHistoryToggle.store;
