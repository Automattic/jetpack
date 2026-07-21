import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * REST paths the dashboard hydrates its initial state from. Must match the
 * routes registered in `Initializer::register_rest_reads()` (and the paths
 * preloaded onto the page by `Initializer::inject_script_data()`).
 */
export const OVERVIEW_PATH = '/jetpack/v4/seo/overview';
export const SETTINGS_PATH = '/jetpack/v4/seo/settings';
export const AI_PATH = '/jetpack/v4/seo/ai';

/** A single preloaded REST response, as emitted by `rest_preload_api_request()`. */
interface PreloadedResponse {
	body?: unknown;
}

type SeoScriptData = {
	seo?: {
		preload?: Record< string, PreloadedResponse | undefined >;
	};
};

/**
 * Read a REST response the server preloaded onto the page, with no request. On a
 * normal load every dashboard path is present here at first paint, so the screens
 * read their state synchronously. Returns `undefined` when a path wasn't preloaded
 * — a stale or incomplete page snapshot — which is the dashboard's signal to fetch
 * it instead of dead-ending. See [use-ensure-tab-data].
 *
 * @param path - The REST path; one of the `*_PATH` constants.
 * @return The preloaded response body, or `undefined` when absent.
 */
export function getPreloaded< T >( path: string ): T | undefined {
	return ( getScriptData() as SeoScriptData | undefined )?.seo?.preload?.[ path ]?.body as
		| T
		| undefined;
}

/**
 * Cache a freshly-fetched response back onto the page's preload map, so the
 * synchronous readers (`getPreloaded`, and the stores seeded from it) pick it up
 * on the next read. Used after the dashboard recovers a missing path via
 * `apiFetch` (see [use-ensure-tab-data]).
 *
 * @param path - The REST path.
 * @param body - The fetched response body.
 */
export function writePreloaded( path: string, body: unknown ): void {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	if ( ! scriptData ) {
		return;
	}
	scriptData.seo = scriptData.seo ?? {};
	scriptData.seo.preload = scriptData.seo.preload ?? {};
	scriptData.seo.preload[ path ] = { body };
}
