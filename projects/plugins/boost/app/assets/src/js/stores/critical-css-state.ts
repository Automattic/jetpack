/* eslint-disable no-console */
import { derived, get, writable } from 'svelte/store';
// eslint-disable-next-line import/no-extraneous-dependencies
import api from '../api/api';
import { startPollingCloudStatus } from '../utils/cloud-css';
import generateCriticalCss from '../utils/generate-critical-css';
import {
	type CriticalCssState,
	type Provider,
	CriticalCssStateSchema,
} from './critical-css-state-types';
import { client, JSONObject, suggestRegenerateDS } from './data-sync-client';
import { modules } from './modules';

const stateClient = client.createAsyncStore(
	'critical_css_state',
	CriticalCssStateSchema
);
const cssStateStore = stateClient.store;

export const criticalCssState = {
	subscribe: cssStateStore.subscribe,
	// @REFACTORING: Move this functionality to Svelte DataSync Client:
	refresh: async () => {
		const status = await stateClient.endpoint.GET();
		if (status) {
			// .override will set the store values without triggering
			// an update back to the server.
			cssStateStore.override(status);
		}
	},
};


// @REFACTORING: Move this functionality to Svelte DataSync Client:
export const replaceCssState = (value: CriticalCssState) => {
	cssStateStore.update(oldValue => {
		return { ...oldValue, ...value };
	});
}

/**
 * Derived datastore: Returns whether to show an error.
 * Show an error if in error state, or if a success has 0 results.
 */
export const showError = derived(cssStateStore, $criticalCssState => {
	if ($criticalCssState.status === 'generated') {
		return (
			$criticalCssState.providers.filter((provider: Provider) => provider.status === 'error')
				.length > 0
		);
	}

	return $criticalCssState.status === 'error';
});

/**
 * Fatal error when no providers are successful.
 */
export const isFatalError = derived([cssStateStore, showError], ([$criticalCssState, $showError]) => {
	if (!$showError) {
		return false;
	}
	return !$criticalCssState.providers.some(provider => provider.status === 'success');
});

export const isGenerating = derived(
	[cssStateStore, modules],
	([$criticalCssState, $modules]) => {
		const statusIsRequesting = $criticalCssState.status === 'pending';
		const criticalCssIsEnabled = $modules['critical-css'] && $modules['critical-css'].enabled;
		const cloudCssIsEnabled = $modules['cloud-css'] && $modules['cloud-css'].enabled;

		return statusIsRequesting && (criticalCssIsEnabled || cloudCssIsEnabled);
	}
);

type GenerationResponse = {
	// @REFACTORING: Implement error handling. Or see @REFACTOR below
	status: 'success';
	data: CriticalCssState;
};
export async function generateCriticalCssRequest(): Promise<CriticalCssState | false> {
	// @REFACTOR: Use the WP JS Stores API instead and ensure that the CSS has indeed been reset.
	const result = await api.post<GenerationResponse>('/critical-css/start');
	if (result.status !== 'success') {
		throw new Error(JSON.stringify(result));
	}
	return result.data as Partial<CriticalCssState>;
}

export function criticalCssFatalError(): void {
	replaceCssState({ status: 'error' });
}

type CriticalCssInsertResponse = {
	status: 'success' | 'error' | 'module-unavailable';
	code: string;
};
export async function saveCriticalCssChunk(
	providerKey: string,
	css: string,
	passthrough: JSONObject
): Promise<boolean> {
	const response = await api.post<CriticalCssInsertResponse>(
		`/critical-css/${providerKey}/insert`,
		{
			data: css,
			passthrough,
		}
	);

	if (response.status === 'module-unavailable') {
		return false;
	}

	if (response.status !== 'success') {
		throw new Error(
			response.code ||
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(response as any).message ||
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(response as any).error ||
			JSON.stringify(response)
		);
	}

	return true;
}

export function storeGenerateError(error: Error): void {
	replaceCssState({
		status: 'error',
		status_error: error
	});
}

export function updateProvider(providerKey: string, data: Partial<Provider>): void {
	return cssStateStore.update($state => {
		const providerIndex = $state.providers.findIndex(provider => provider.key === providerKey);

		$state.providers[providerIndex] = {
			...$state.providers[providerIndex],
			...data,
		};

		return $state;
	});
}

export const refreshCriticalCssState = async () => {
	const state = await stateClient.endpoint.GET();
	cssStateStore.override(state);
	return state;
};

export const regenerateCriticalCss = async () => {
	const $modules = get(modules);
	const $isCloudCssEnabled = $modules['cloud-css']?.enabled || false;

	// Clear regeneration suggestions
	suggestRegenerateDS.store.set(false);

	// This will clear the CSS from the database
	// And return fresh nonce, provider and viewport data.
	const freshState = await generateCriticalCssRequest();
	if( ! freshState ) {
		// @REFACTORING - Handle error. Currently this dies silently.
		return false;
	}

	// We received a fresh state from the server,
	// it's already saved there,
	// This will update the store without triggering a save back to the server.
	cssStateStore.override(freshState);

	if ($isCloudCssEnabled) {
		startPollingCloudStatus();
	} else {
		await generateCriticalCss(get(cssStateStore));
		replaceCssState({ status: 'generated' });
	}

};


export const localCriticalCSSProgress = writable<undefined | number>(undefined);

export const criticalCssProgress = derived(
	[cssStateStore, localCriticalCSSProgress],
	([$criticalCssState, $localProgress]) => {
		if ($criticalCssState.status === 'generated') {
			return 100;
		}

		if ($criticalCssState.status === 'not_generated') {
			return 0;
		}

		const totalCount = $criticalCssState.providers.length;
		const doneCount = $criticalCssState.providers.filter(
			provider => provider.status !== 'pending'
		).length;

		// `localProgress` provides a percentage 0-100 for each step for the Local critical CSS Generation
		// Convert that to a percentage of the total progress.
		let percent = Math.round((doneCount / totalCount) * 100);
		if (
			$localProgress !== undefined &&
			$localProgress > 0 &&
			$localProgress < 1 &&
			doneCount < totalCount &&
			doneCount > 0
		) {
			const percentPerStep = 100 / totalCount;
			percent += $localProgress * percentPerStep;
		}

		return percent;
	}
);

// @REFACTORING Utils: Remove in production
// window.store = cssStateStore;
// window.replaceState = replaceCssState;
